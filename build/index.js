'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _ = require('lodash');
var ___default = _interopDefault(_);

class SignallingService {
  constructor(url, isServer) {

    this.connection = new WebSocket(url);
    this.state = 'connecting';
    this.id = null;
    this.isServer = isServer;

    this.connection.onopen = this.onOpen.bind(this);
    this.connection.onmessage = this.onMessage.bind(this);
    this.connection.onclose = this.onClose.bind(this);

    window.addEventListener('beforeunload', function () {
      this.connection.close();
    }.bind(this));
  }

  onOpen() {
    this.state = 'connected';
    if(this.isServer) {
      this.send('info', {
        type: 'SERVER'
      });
      this.message('session')
        .then((message) => {
          this.room = message.data.room;
        });
    } else {
      this.send('info', {
        type: 'CLIENT',
      });
      this.message('session')
        .then((message) => {
          console.log('[session] -',message);
        });
    }

    this.message('info')
      .then((message) => {
        this.id = message.data.id;
        if (this.isServer && message.data.room) {
          this.room = message.data.room;
        }
      });
  }

  onMessage(evt) {
    console.log('[message] - ', JSON.parse(evt.data).type);
  }

  async isConnected() {
    if(!this.id) {
      await this.message('info');
    }
  }

  onClose(event) {
    this.state = 'closed';
  }

  async start(room) {
    if (this.isServer) {
      this.send('session', {});
      const message = await this.message('session');
      this.room = message.data.room;
      this.id = message.data.id;
    } else {
      this.room = room;
      this.send('session', {
        room: room,
      });
      const message = await this.message('session');

    }
  }

  message(type, from) {
    return new Promise((resolve, reject) => {
      let evtListener = this.connection.addEventListener('message',(evt) => {
        let message = JSON.parse(evt.data);
        if(message.type === type && (message.from === from || from === undefined) ) {
          this.connection.removeEventListener('message',evtListener);
          resolve(JSON.parse(evt.data));
        }
      });
    });
  }

  send(type, data, to, additionalData) {
    if(!additionalData) {
      additionalData = {};
    }
    const dataToSend = {
      type,
      data,
      to,
    };
    ___default.forEach(additionalData, (value, key) => {
      dataToSend[key] = value;
    });

    this.connection.send(JSON.stringify(dataToSend));
  }
}

const resolvePromises = (promises, type, data) => {
  let newPromises = Object.assign({}, promises);
  newPromises[type] = _.filter(promises[type], (promise) => {
    promise.resolve(data);
    return true;
  });
  return newPromises;
};



const addPromise = (promises, type, resolve, reject) => {
  let newPromises = Object.assign({}, promises);
  newPromises[type] = _.concat(promises[type] || [], { resolve, reject });
  return newPromises;
};

const STATUS = {
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
};

const TYPE = {
  SERVER: 'SERVER',
  CLIENT: 'CLIENT',
  BROADCAST: 'BROADCAST',
};

const NETWORK_CHANGE = {
  NEW_CONNECTION: 'NEW_CONNECTION',
  CLIENT_DISCONNECTED: 'CLIENT_DISCONNECTED',
};

const MESSAGE_TYPES = {
  NEW_CONNECTION: 'NEW_CONNECTION',
  CLIENT_DISCONNECTED: 'CLIENT_DISCONNECTED',
  NEW_CLIENT: '',
  DATA: 'DATA',
  OPEN: 'OPEN',
  CLIENT_INFO: 'CLIENT_INFO',
  NETWORK_INFO: 'NETWORK_INFO',
};

const SIGNALLING_MESSAGE_TYPES = {
};





var constants = Object.freeze({
	STATUS: STATUS,
	TYPE: TYPE,
	NETWORK_CHANGE: NETWORK_CHANGE,
	MESSAGE_TYPES: MESSAGE_TYPES,
	SIGNALLING_MESSAGE_TYPES: SIGNALLING_MESSAGE_TYPES
});

class Client {
  constructor(signallingServerURL, iceServers) {
    this.iceServers = iceServers;

    this.signalling = new SignallingService(signallingServerURL, false);

    this.sendChannelOpen = false;
    this.receiveChannelOpen = false;
    this.connected = false;

    this.promises = {
      connected: [],
      newClient: [],
      message: [],
    };

    this.clients = {
      SERVER: {
        promises: {},
      },
    };
  }

  addPromise(type) {
    return new Promise((resolve, reject) => {
      this.promises = addPromise(this.promises, type, resolve, reject);
    })
  }

  addClientPromise(clientId, type) {
    if (this.clients[clientId]) {
      return new Promise((resolve, reject) => {
        this.clients[clientId].promises = addPromise(this.clients[clientId].promises, type, resolve, reject);
      })
    } else {
      return Promise.reject('')
    }
  }

  resolvePromises(type, data) {
    this.promises = resolvePromises(this.promises, type, data);
  }

  resolveClientPromise(clientId, type, data) {
    this.clients[clientId].promises = resolvePromises(this.clients[clientId].promises, type, data);
  }

  connection() {
    if (!this.connected) {
      return this.addPromise('connected')
    } else {
      return Promise.resolve(true);
    }
  }

  onIceCandidate(evt) {
    if (evt.candidate) {
      this.signalling.send('ice', evt.candidate, );
    }
  }

  async onIncomingIceCandidate() {
    const message = await this.signalling.message('ice');
    console.log('new ice candidate');
    this.peerConnection.addIceCandidate(message.data);
  }

  onSendChannelOpen() {
    console.log('sendChannel open');
    this.sendChannelOpen = true;
    if (this.receiveChannelOpen && !this.connected) {
      this.connected = true;
      console.log(this.sendChannel.readyState);
      this.resolvePromises('connected', true);
    }
  }

  onReceiveChannelOpen() {
    console.log('receiveChannel open');
    this.receiveChannelOpen = true;
    if (this.sendChannelOpen && !this.connected) {
      this.connected = true;
      this.resolvePromises('connected', true);
    }
  }

  onDataChannel(evt) {
    let receiveChannel = evt.channel;
    receiveChannel.onmessage = this.onMessage.bind(this);
    receiveChannel.onopen = this.onReceiveChannelOpen.bind(this);
    this.receiveChannel = receiveChannel;
  }

  onMessage(evt) {
    const message = JSON.parse(evt.data);
    this.resolvePromises('message', message);
    this.resolvePromises(message.type, message);
    if (message.type === MESSAGE_TYPES.DATA && message.customType) {
      this.resolvePromises(`${message.type}/${message.customType}`, message);
    }
    if (this.clients[message.from]) {
      this.resolveClientPromise(message.from, 'message', message);
      this.resolveClientPromise(message.from, message.type, message);
      if (message.type === MESSAGE_TYPES.DATA && message.customType) {
        this.resolveClientPromise(message.from, `${message.type}/${message.customType}`, message);
      }
    }

    switch (message.type) {
      case MESSAGE_TYPES.NETWORK_INFO:
        let newClients = _.mapValues(message.data.clients, (client) => {
          client.promises = {};
          return client
        });
        this.clients = Object.assign({}, this.clients, newClients);
        break;
      case MESSAGE_TYPES.CLIENT_INFO:
        this.clients[message.from].info = message.data;
        break;
      case MESSAGE_TYPES.DATA:
        break;
      case MESSAGE_TYPES.NEW_CONNECTION:
        this.clients[message.data.id] = {
          info: undefined,
          promises: {},
        };
        break;
    }
  }

  addEventListeners() {
    this.peerConnection.onicecandidate = this.onIceCandidate.bind(this);
    this.peerConnection.ondatachannel = this.onDataChannel.bind(this);
    this.sendChannel.onopen = this.onSendChannelOpen.bind(this);
    this.onIncomingIceCandidate();
  }

  async connect(room, info) {
    this.info = info;
    await this.signalling.isConnected();
    await this.signalling.start(room, info);

    this.id = this.signalling.id;

    this.peerConnection = new RTCPeerConnection(this.iceServers);
    this.sendChannel = this.peerConnection.createDataChannel('clientSendChannel');

    this.addEventListeners();

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.signalling.send('request', offer);

    const response = await this.signalling.message('response');
    await this.peerConnection.setRemoteDescription(response.data);
    await this.connection();
    this._send(MESSAGE_TYPES.CLIENT_INFO, info, TYPE.BROADCAST);
    await this._receive(TYPE.NETWORK_INFO);
  }

  _send(type, data, to, customType) {
    const message = {
      type,
      data,
      to,
      customType,
    };
    this.sendChannel.send(JSON.stringify(message));
  }

  send(data, to, customType) {
    this._send(MESSAGE_TYPES.DATA, data, to, customType);
  }

  close() {
    this.peerConnection.close();
    this.sendChannel.close();
    this.receiveChannel.close();
  }

  _receive(type = 'message', from) {
    if (from) {
      return this.addClientPromise(from, type);
    }
    else {
      return this.addPromise(type);
    }
  }

  receive(from, customType) {
    if (customType) {
      return this._receive(`${MESSAGE_TYPES.DATA}/${customType}`, from)
    } else {
      return this._receive(MESSAGE_TYPES.DATA, from)
    }
  }
}

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
    };
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
    this.clients[clientId].promises = resolvePromises(this.clients[clientId].promises, type, data);
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
    _.forEach(this.clients, (client) => {
      if (client.state !== STATUS.DISCONNECTED) {
        numOfActiveClients++;
      }
    });
    return numOfActiveClients;
  }

  get clientsInfo() {
    return _.mapValues(this.clients, (client, clientId) => {
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
        this.resolvePromises('newClient', clientId);
      }
    }
  }

  onReceiveChannelOpen(clientId) {
    return (evt) => {
      log('receive channel', 'receive channel open');
      this.clients[clientId].receiveChannelOpen = true;
      if (this.clients[clientId].receiveChannelOpen && !this.clients[clientId].connected) {
        this.clients[clientId].connected = true;
        this.resolvePromises('newClient', clientId);
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
        this.resolveClientPromise(clientId, `${message.type}/${message.customType}`, message);
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
          this.processMessage(message, clientId);
        }
        else if (to === TYPE.BROADCAST) {
          this.processMessage(message, clientId);
          this._send(message.type, message.data, to, clientId);
        } else {
          this._send(message.type, message.data, to, clientId);
        }
      } else if (typeof(to) === 'object') {
        if (to.includes(TYPE.SERVER)) {
          this.processMessage(message, clientId);
          this._send(message.type, message.data, to, clientId);
        } else {
          this._send(message.type, message.data, to, clientId);
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
        });
      await this.newClient();
      
      this._send(MESSAGE_TYPES.NETWORK_INFO, {
        clients: _.pickBy(this.clientsInfo, (client, clientId) => {
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
      _.forEach(to, (recipient) => {
        if (recipient !== TYPE.SERVER) {
          this.clients[recipient].sendChannel.send(serializedMessage);
        }
      });
    } else if (to == TYPE.BROADCAST) {
      _.forEach(this.clients, (client, clientId) => {
        if (from !== clientId) {
          client.sendChannel.send(serializedMessage);
        }
      });
    }
    else {
      this.clients[to].sendChannel.send(serializedMessage);
    }
  }

  send(data, to, customType) {
    this._send(MESSAGE_TYPES.DATA, data, to, TYPE.SERVER, customType);
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

exports.Server = Server;
exports.Client = Client;
exports.constants = constants;
