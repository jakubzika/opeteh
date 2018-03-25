import { forEach, mapValues, filter, pickBy } from 'lodash';

import SignallingService from './signalling';
import { STATUS, MESSAGE_TYPES, TYPE } from "./constants";
import { resolvePromises, rejectPromises, addPromise } from './lib';

function log(type, message, data) {
  console.log(`[${type}] - ${message}`, data);
}
/**
 * Server library
 * @class
 */
class Server {
  /**
   * Creates new instance of Server8
   * @param  {string} signallingServerURL url of signalling server which allows clients to connect, client must use same signalling server
   * @param  {object[]} [iceServers=defualt ICE servers] array of public ICE servers, if null uses default ones
   * @param  {number} maxConnections maximum number of connections
   */
  constructor(signallingServerURL, iceServers, maxConnections) {
    this.maxConnections = maxConnections;
    this.iceServers = iceServers;

    this.signalling = new SignallingService(signallingServerURL, true);

    this.clients = {};
    this.onopen = undefined;

    /**
     * 
     * @member {string} room room id which is used for clients to connect to server
     */
    this.room = null;

    this.onSendChannelOpen = this.onSendChannelOpen.bind(this);
    this.onReceiveChannelOpen = this.onReceiveChannelOpen.bind(this);
    this.onIceCandidate = this.onIceCandidate.bind(this);
    this.onMessage = this._onMessage.bind(this);
    this.onDataChannel = this.onDataChannel.bind(this);

    this.promises = {
      initialization: [],
      newClient: [],
    }
  }

  /**
   * Returns promise which gets fulfilled when server has finished initialization handshake with signalling server
   * Server is now in state in which it can accept incoming connections
   * @returns {promise<string>} Contains room id obtained from signalling server
   */
  initialization() {
    if (!this.room) {
      return this._addPromise('initialization')
    }
  }

  /**
   * Returns promise which gets fulfilled when new client has connected to server
   * @returns {promise<clientId>} Contains clientm id obtained from signalling server
   */
  newClient() {
    return this._addPromise('newClient')
  }
  /**
   * Returns promise which gets fullfiled when server receives info message from client
   * 
   * @param {promise<object>} from message object with client info
   */
  clientInfo(from) {
    return this._receive(from, MESSAGE_TYPES.CLIENT_INFO)
  }
  
  /**
   * Returns promise which waits for message from specified clients in `to` parameter
   * 
   * @param {clientId|clientId[]|null} [from=null] from who to receive message, if null waits for message from anyone
   * @param {string|null} [customType=null] wait for specific type of message, if null waits for any type
   * @returns {Promise<object>} contains received message from client/s
   */
  receive(from, customType) {
    if (customType) {
      return this._receive(from, `${MESSAGE_TYPES.DATA}/${customType}`)
    } else {
      return this._receive(from, MESSAGE_TYPES.DATA)
    }
  }

  /**
   * Sends message to specified clients
   * 
   * @param {object} data 
   * @param {clientId|clientId[]|null} to can be single TYPE.BROADCAST or client id or array of user id to which to send the message
   * @param {string|null} [customType=null] info for receiving side to specify what kind of message it is sending, if null sends message without custom type
   */
  send(data, to, customType) {
    this._send(MESSAGE_TYPES.DATA, data, to, TYPE.SERVER, customType)
  }

  /**
   * Disconnects client from server
   * @param {clientId} clientId 
   */
  disconnect(clientId) {
    this.clients[clientId].peerConnection.close();
    this.clients[clientId].receiveChannel.close();
    this.clients[clientId].sendChannel.close();
  }

  /**
   * @returns {number} number of connected clients
   */
  get activeClients() {
    let numOfActiveClients = 0;
    forEach(this.clients, (client) => {
      if (client.state !== STATUS.DISCONNECTED) {
        numOfActiveClients++;
      }
    });
    return numOfActiveClients;
  }

  /**
   * @returns {object} object containing connected clients and their info
   */
  get clientsInfo() {
    return mapValues(this.clients, (client, clientId) => {
      return {
        info: client.info,
      }
    })
  }

  /**
   * Initializes and starts the server
   * Accepts incoming connections
   * 
   * @returns {promise} gets fulfilled when maximum number of clients is reached
   */
  async listen() {
    const onDataChannel = (clientId) => {
      return (evt) => {
        log('data channel', 'new data channel', evt.channel);
        let receiveChannel = evt.channel;
        receiveChannel.onmessage = this._onMessage(clientId);
        receiveChannel.onopen = this.onReceiveChannelOpen(clientId);
  
        this.clients[clientId].receiveChannel = receiveChannel;
        window.receiveChannel = receiveChannel;
      }
    }
  
    const addEventListeners = (clientId) => {
      log('event listener', 'adding event listeners');
      this.onIncomingIceCandidate(clientId)
        .then(() => {
          console.log('done');
        });
      this.clients[clientId].peerConnection.onicecandidate = onIceCandidate(clientId);
      this.clients[clientId].peerConnection.ondatachannel = onDataChannel(clientId);
      this.clients[clientId].sendChannel.onopen = onSendChannelOpen(clientId);
    }

    const onSendChannelOpen = (clientId) => {
      return (evt) => {
        log('send channel', 'send channel open');
        this.clients[clientId].sendChannelOpen = true;
        if (this.clients[clientId].receiveChannelOpen && !this.clients[clientId].connected) {
          this.clients[clientId].connected = true;
          this._resolvePromises('newClient', clientId)
        }
      }
    }
  
    const onReceiveChannelOpen = (clientId) => {
      return (evt) => {
        log('receive channel', 'receive channel open');
        this.clients[clientId].receiveChannelOpen = true;
        if (this.clients[clientId].receiveChannelOpen && !this.clients[clientId].connected) {
          this.clients[clientId].connected = true;
          this._resolvePromises('newClient', clientId)
        }
      }
    }
  
    const onIceCandidate = (clientId) => {
      return (evt) => {
        if (evt.candidate) {
          log('ice', 'got ice candidate', evt.candidate);
          this.signalling.send('ice', evt.candidate, clientId);
        }
      }
    }
  
    const onIncomingIceCandidate = async (clientId) => {
      log('ice', 'starting to expect ice candidate message');
      let message = await this.signalling.message('ice');
      log('ice', 'received ice candidate from client', message.data);
      console.log('received ice candidate but it does not really matter');
      this.clients[clientId].peerConnection.addIceCandidate(message.data);
    }

    await this.signalling.isConnected();
    await this.signalling.start();

    this.room = this.signalling.room;
    this.id = this.signalling.id;

    this._resolvePromises('initialization', this.room);

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

      client.peerConnection = new RTCPeerConnection(this.iceServers);
      log('peer connection', 'created RTCPeerConnection');
      client.sendChannel = client.peerConnection.createDataChannel('sendChannel');
      log('peer connection', 'created sendChannel');
      addEventListeners(id);
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

  _processMessage(message, clientId) {
    message.from = clientId;
    this._resolvePromises('message', message);
    this._resolvePromises(message.type, message);
    if (message.type === MESSAGE_TYPES.DATA && message.customType) {
      this._resolvePromises(`${message.type}/${message.customType}`, message);
    }
    if (this.clients[clientId]) {
      this._resolveClientPromise(clientId, 'message', message);
      this._resolveClientPromise(clientId, message.type, message);
      if (message.type === MESSAGE_TYPES.DATA && message.customType) {
        this._resolveClientPromise(clientId, `${message.type}/${message.customType}`, message)
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

  _onMessage(clientId) {
    return (evt) => {
      const message = JSON.parse(evt.data);

      // Handle to who is message meant to
      let to = message.to;

      if (typeof(to) === 'string') {
        if (to === TYPE.SERVER) {
          this._processMessage(message, clientId)
        }
        else if (to === TYPE.BROADCAST) {
          this._processMessage(message, clientId)
          this._send(message.type, message.data, to, clientId)
        } else {
          this._send(message.type, message.data, to, clientId)
        }
      } else if (typeof(to) === 'object') {
        if (to.includes(TYPE.SERVER)) {
          this._processMessage(message, clientId);
          this._send(message.type, message.data, to, clientId)
        } else {
          this._send(message.type, message.data, to, clientId)
        }
      }
    };
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

  _receive(from, type) {
    if (from) {
      return this._addClientPromise(from, type);
    } else {
      return this._addPromise(type);
    }
  }

    // Promise handlers
    _addPromise(type) {
      return new Promise((resolve, reject) => {
        this.promises = addPromise(this.promises, type, resolve, reject);
      })
    }
  
    _addClientPromise(clientId, type) {
      return new Promise((resolve, reject) => {
        this.clients[clientId].promises = addPromise(this.clients[clientId].promises, type, resolve, reject);
      })
    }
  
    _resolveClientPromise(clientId, type, data) {
      this.clients[clientId].promises = resolvePromises(this.clients[clientId].promises, type, data)
    }
  
    _resolvePromises(type, data) {
      this.promises = resolvePromises(this.promises, type, data);
    }
    // end of promise handlers
}

export default Server;
