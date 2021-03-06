import { mapValues } from 'lodash';

import SignallingService from "./signalling";
import { resolvePromises, rejectPromises, addPromise } from './lib';
import { TYPE, MESSAGE_TYPES, ICE_SERVERS } from './constants';

class Client {
  /**
   * Creates new instance of Client
   * @param  {string} signallingServerURL url of signalling server which allows clients to connect, server must use same signalling server
   * @param  {object[]} [iceServers=defualt ICE servers] array of public ICE servers, if null uses default ones
   */
  constructor(signallingServerURL, iceServers) {
    this.iceServers = iceServers || ICE_SERVERS;;

    this.signalling = new SignallingService(signallingServerURL, false);

    this.sendChannelOpen = false;
    this.receiveChannelOpen = false;
    this.connected = false;

    this.promises = {
      connected: [],
      newClient: [],
      message: [],
    }

    this.clients = {
      SERVER: {
        promises: {},
      },
    };
  }
  /**
   * Returns promise which gets resolved when client has connected
   * @returns {promise}
   */
  connection() {
    if (!this.connected) {
      return this._addPromise('connected')
    } else {
      return Promise.resolve(true);
    }
  }
  /**
   * Returns promise which gets fulfilled when client receives message
   * 
   * 
   * @param  {clientId|clientId[]|null} [from=null] waits for message from specified clients/server
   * @param  {string|null} [customType=null] wait for specific type of message, if null waits for any type
   * @returns {promise<object>} contains received message
   */
  receive(from, customType) {
    if (customType) {
      return this._receive(`${MESSAGE_TYPES.DATA}/${customType}`, from)
    } else {
      return this._receive(MESSAGE_TYPES.DATA, from)
    }
  }
  /**
   * Sends message to specified clients(including server)
   * Recipients can be specified in `to` param
   * 
   * @param  {object|string} data data to send
   * @param  {clientId|clientId[]|null} to can be client id or TYPE.SERVER or TYPE.BROADCAST
   * @param  {string|null} [customType=null] info for receiving side to specify what kind of message it is sending, if null sends message without custom type
   */
  send(data, to, customType) {
    this._send(MESSAGE_TYPES.DATA, data, to, customType)
  }
  /**
   * Disconnects client from server
   */
  disconnect() {
    this.peerConnection.close();
    this.sendChannel.close();
    this.receiveChannel.close();
  }
  /**
   * Connects the client to server
   * 
   * @param  {string} room room id given by server to which client will attempt to connect
   * @param  {object} info info about the client which is broadcasted to everyone who is connected
   * @returns {promise} is fulfilled when client is connected to server
   */
  async connect(room, info) {

    const onIceCandidate = (evt) => {
      if (evt.candidate) {
        this.signalling.send('ice', evt.candidate, );
      }
    }

    const onIncomingIceCandidate = async () => {
      const message = await this.signalling.message('ice');
      console.log('new ice candidate');
      this.peerConnection.addIceCandidate(message.data);
    }

    const onSendChannelOpen = () => {
      console.log('sendChannel open');
      this.sendChannelOpen = true;
      if (this.receiveChannelOpen && !this.connected) {
        this.connected = true;
        console.log(this.sendChannel.readyState)
        this._resolvePromises('connected', true);
      }
    }

    const onReceiveChannelOpen = () => {
      console.log('receiveChannel open');
      this.receiveChannelOpen = true;
      if (this.sendChannelOpen && !this.connected) {
        this.connected = true;
        this._resolvePromises('connected', true);
      }
    }

    const onDataChannel = (evt) => {
      let receiveChannel = evt.channel;
      receiveChannel.onmessage = this._onMessage.bind(this);
      receiveChannel.onopen = onReceiveChannelOpen.bind(this);
      this.receiveChannel = receiveChannel;
    }

    const addEventListeners = () => {
      this.peerConnection.onicecandidate = onIceCandidate.bind(this);
      this.peerConnection.ondatachannel = onDataChannel.bind(this);
      this.sendChannel.onopen = onSendChannelOpen.bind(this);
      onIncomingIceCandidate();
    }

    this.info = info;
    await this.signalling.isConnected();
    await this.signalling.start(room, info);

    this.id = this.signalling.id;

    this.peerConnection = new RTCPeerConnection(this.iceServers);
    this.sendChannel = this.peerConnection.createDataChannel('clientSendChannel');

    addEventListeners();

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.signalling.send('request', offer);

    const response = await this.signalling.message('response');
    await this.peerConnection.setRemoteDescription(response.data);
    await this.connection();
    this._send(MESSAGE_TYPES.CLIENT_INFO, info, TYPE.BROADCAST);
    await this._receive(TYPE.NETWORK_INFO);
  }

  _onMessage(evt) {
    const message = JSON.parse(evt.data);
    this._resolvePromises('message', message);
    this._resolvePromises(message.type, message);
    if (message.type === MESSAGE_TYPES.DATA && message.customType) {
      this._resolvePromises(`${message.type}/${message.customType}`, message);
    }
    if (this.clients[message.from]) {
      this._resolveClientPromise(message.from, 'message', message);
      this._resolveClientPromise(message.from, message.type, message);
      if (message.type === MESSAGE_TYPES.DATA && message.customType) {
        this._resolveClientPromise(message.from, `${message.type}/${message.customType}`, message)
      }
    }

    switch (message.type) {
      case MESSAGE_TYPES.NETWORK_INFO:
        let newClients = mapValues(message.data.clients, (client) => {
          client.promises = {}
          return client
        })
        this.clients = Object.assign({}, this.clients, newClients)
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
        }
        break;
    }
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

  _receive(type = 'message', from) {
    if (from) {
      return this._addClientPromise(from, type);
    }
    else {
      return this._addPromise(type);
    }
  }

  // promise handlers
  _addPromise(type) {
    return new Promise((resolve, reject) => {
      this.promises = addPromise(this.promises, type, resolve, reject);
    })
  }

  _addClientPromise(clientId, type) {
    if (this.clients[clientId]) {
      return new Promise((resolve, reject) => {
        this.clients[clientId].promises = addPromise(this.clients[clientId].promises, type, resolve, reject);
      })
    } else {
      return Promise.reject('')
    }
  }

  _resolvePromises(type, data) {
    this.promises = resolvePromises(this.promises, type, data);
  }

  _resolveClientPromise(clientId, type, data) {
    this.clients[clientId].promises = resolvePromises(this.clients[clientId].promises, type, data);
  }
  // end of promise handlers
}

export default Client;