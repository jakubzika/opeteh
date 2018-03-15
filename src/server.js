import { forEach, mapValues, filter, pickBy } from 'lodash';

import SignallingService from './signalling';
import { STATUS, MESSAGE_TYPES, TYPE } from "./constants";
import { resolvePromises, rejectPromises, addPromise } from './lib';

function log(type, message, data) {
  console.log(`[${type}] - ${message}`, data);
}

class Server {
  constructor(signallingServerURL, iceServers, maxConnections) {
    this.maxConnections = maxConnections;
    this.iceServers = iceServers;

    this.signalling = new SignallingService(signallingServerURL, true);
    this.clients = {};
    this.onopen = undefined;

    this.onSendChannelOpen = this.onSendChannelOpen.bind(this);
    this.onReceiveChannelOpen = this.onReceiveChannelOpen.bind(this);
    this.onIceCandidate = this.onIceCandidate.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.onDataChannel = this.onDataChannel.bind(this);

    this.promises = {
      initialization: [],
      newClient: [],
    }
  }

  // promise events
  addPromise(type) {
    return new Promise((resolve, reject) => {
      this.promises = addPromise(this.promises, type, resolve, reject);
    })
  }

  addClientPromise(clientId, type) {
    return new Promise((resolve, reject) => {
      this.clients[clientId].promises = addPromise(this.clients[clientId].promises, type, resolve, reject);
    })
  }


  resolveClientPromise(clientId, type, data) {
    this.clients[clientId].promises = resolvePromises(this.clients[clientId].promises, type, data)
  }

  resolvePromises(type, data) {
    this.promises = resolvePromises(this.promises, type, data);
  }

  initialization() {
    if (!this.room) {
      return this.addPromise('initialization')
    }
  }

  newClient() {
    return this.addPromise('newClient')
  }

  clientInfo(from) {
    return this._receive(from, MESSAGE_TYPES.CLIENT_INFO)
  }
  //

  get activeClients() {
    let numOfActiveClients = 0;
    forEach(this.clients, (client) => {
      if (client.state !== STATUS.DISCONNECTED) {
        numOfActiveClients++;
      }
    });
    return numOfActiveClients;
  }

  get clientsInfo() {
    return mapValues(this.clients, (client, clientId) => {
      return {
        info: client.info,
      }
    })
  }

  onSendChannelOpen(clientId) {
    return (evt) => {
      log('send channel', 'send channel open');
      this.clients[clientId].sendChannelOpen = true;
      if (this.clients[clientId].receiveChannelOpen && !this.clients[clientId].connected) {
        this.clients[clientId].connected = true;
        this.resolvePromises('newClient', clientId)
      }
    }
  }

  onReceiveChannelOpen(clientId) {
    return (evt) => {
      log('receive channel', 'receive channel open');
      this.clients[clientId].receiveChannelOpen = true;
      if (this.clients[clientId].receiveChannelOpen && !this.clients[clientId].connected) {
        this.clients[clientId].connected = true;
        this.resolvePromises('newClient', clientId)
      }
    }
  }

  onIceCandidate(clientId) {
    return (evt) => {
      if (evt.candidate) {
        log('ice', 'got ice candidate', evt.candidate);
        this.signalling.send('ice', evt.candidate, clientId);
      }
    }
  }

  async onIncomingIceCandidate(clientId) {
    log('ice', 'starting to expect ice candidate message');
    let message = await this.signalling.message('ice');
    log('ice', 'received ice candidate from client', message.data);
    console.log('received ice candidate but it does not really matter');
    this.clients[clientId].peerConnection.addIceCandidate(message.data);
  }

  processMessage(message, clientId) {
    message.from = clientId;
    this.resolvePromises('message', message);
    this.resolvePromises(message.type, message);
    if (message.type === MESSAGE_TYPES.DATA && message.customType) {
      this.resolvePromises(`${message.type}/${message.customType}`, message);
    }
    if (this.clients[clientId]) {
      this.resolveClientPromise(clientId, 'message', message);
      this.resolveClientPromise(clientId, message.type, message);
      if (message.type === MESSAGE_TYPES.DATA && message.customType) {
        this.resolveClientPromise(clientId, `${message.type}/${message.customType}`, message)
      }
    }

    switch (message.type) {
      case MESSAGE_TYPES.OPEN:
        break;
      case MESSAGE_TYPES.DATA:
        break;
      case MESSAGE_TYPES.CLIENT_INFO:
        this.clients[clientId].info = message.data;
        
        break;
    }
  }

  onMessage(clientId) {
    return (evt) => {
      const message = JSON.parse(evt.data);

      // Handle to who is message meant to
      let to = message.to;

      if (typeof(to) === 'string') {
        if (to === TYPE.SERVER) {
          this.processMessage(message, clientId)
        }
        else if (to === TYPE.BROADCAST) {
          this.processMessage(message, clientId)
          this._send(message.type, message.data, to, clientId)
        } else {
          this._send(message.type, message.data, to, clientId)
        }
      } else if (typeof(to) === 'object') {
        if (to.includes(TYPE.SERVER)) {
          this.processMessage(message, clientId);
          this._send(message.type, message.data, to, clientId)
        } else {
          this._send(message.type, message.data, to, clientId)
        }
      }
    };
  }

  onDataChannel(clientId) {
    return (evt) => {
      log('data channel', 'new data channel', evt.channel);
      let receiveChannel = evt.channel;
      receiveChannel.onmessage = this.onMessage(clientId);
      receiveChannel.onopen = this.onReceiveChannelOpen(clientId);

      this.clients[clientId].receiveChannel = receiveChannel;
      window.receiveChannel = receiveChannel;
    }
  }

  addEventListeners(clientId) {
    log('event listener', 'adding event listeners');
    this.onIncomingIceCandidate(clientId)
      .then(() => {
        console.log('done');
      });
    this.clients[clientId].peerConnection.onicecandidate = this.onIceCandidate(clientId);
    this.clients[clientId].peerConnection.ondatachannel = this.onDataChannel(clientId);
    this.clients[clientId].sendChannel.onopen = this.onSendChannelOpen(clientId);
  }

  close(clientId) {
    this.clients[clientId].peerConnection.close();
    this.clients[clientId].receiveChannel.close();
    this.clients[clientId].sendChannel.close();
  }

  async listen() {
    await this.signalling.isConnected();
    await this.signalling.start();

    this.room = this.signalling.room;
    this.id = this.signalling.id;

    this.resolvePromises('initialization', this.room);
    while (this.activeClients < this.maxConnections) {
      log('initialization', 'waiting for initial request message');
      const initialMessage = await this.signalling.message('request');
      log('initialization', 'got initialization message', initialMessage);
      const client = {
        promises: {
          message: [],
        },
        info: undefined,
      };
      const id = initialMessage.from;
      this.clients[id] = client;

      // client.sendChannelConnected = false;
      // client.receiveChannelConnected = false;



      client.peerConnection = new RTCPeerConnection(this.iceServers);
      log('peer connection', 'created RTCPeerConnection');
      client.sendChannel = client.peerConnection.createDataChannel('sendChannel');
      log('peer connection', 'created sendChannel');
      this.addEventListeners(id);
      log('event listener', 'added event listeners');
      await client.peerConnection.setRemoteDescription(initialMessage.data);
      log('peer connection', 'set remote description');
      const answer = await client.peerConnection.createAnswer();
      log('peer connection', 'created answer');
      await client.peerConnection.setLocalDescription(answer);
      log('peer connection', 'set localDescription');
      this.signalling.send('response', answer, id);
      log('peer connection', 'sent response');

      this._receive(id, TYPE.CLIENT_INFO)
        .then((infoMessage) => {
          console.log('received info message');
          this.clients[id].info = infoMessage.data;
          // TODO add resolve promise to let know that user is ready
        })
      await this.newClient();
      
      this._send(MESSAGE_TYPES.NETWORK_INFO, {
        clients: pickBy(this.clientsInfo, (client, clientId) => {
          return clientId !== id;
        }),
      }, id);

      this._send(MESSAGE_TYPES.NEW_CONNECTION, {
        id,
      }, TYPE.BROADCAST, id);
    }
  }


  _send(type, data, to, from = TYPE.SERVER, customType) {
    const message = {
      type,
      data,
      from,
      customType,
    };
    const serializedMessage = JSON.stringify(message);
    if (typeof to === 'object') {
      forEach(to, (recipient) => {
        if (recipient !== TYPE.SERVER) {
          this.clients[recipient].sendChannel.send(serializedMessage);
        }
      })
    } else if (to == TYPE.BROADCAST) {
      forEach(this.clients, (client, clientId) => {
        if (from !== clientId) {
          client.sendChannel.send(serializedMessage)
        }
      })
    }
    else {
      this.clients[to].sendChannel.send(serializedMessage);
    }
  }

  send(data, to, customType) {
    this._send(MESSAGE_TYPES.DATA, data, to, TYPE.SERVER, customType)
  }

  _receive(from, type) {
    if (from) {
      return this.addClientPromise(from, type);
    } else {
      return this.addPromise(type);
    }
  }

  receive(from, customType) {
    if (customType) {
      return this._receive(from, `${MESSAGE_TYPES.DATA}/${customType}`)
    } else {
      return this._receive(from, MESSAGE_TYPES.DATA)
    }
  }
}

export default Server;
