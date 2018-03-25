import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _Object$assign from 'babel-runtime/core-js/object/assign';
import _regeneratorRuntime from 'babel-runtime/regenerator';
import _asyncToGenerator from 'babel-runtime/helpers/asyncToGenerator';
import _Promise from 'babel-runtime/core-js/promise';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _, { concat, filter, forEach, mapValues, pickBy } from 'lodash';
import _typeof from 'babel-runtime/helpers/typeof';

var SignallingService = function () {
  function SignallingService(url, isServer) {
    _classCallCheck(this, SignallingService);

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

  _createClass(SignallingService, [{
    key: 'onOpen',
    value: function onOpen() {
      var _this = this;

      this.state = 'connected';
      if (this.isServer) {
        this.send('info', {
          type: 'SERVER'
        });
        this.message('session').then(function (message) {
          _this.room = message.data.room;
        });
      } else {
        this.send('info', {
          type: 'CLIENT'
        });
        this.message('session').then(function (message) {
          console.log('[session] -', message);
        });
      }

      this.message('info').then(function (message) {
        _this.id = message.data.id;
        if (_this.isServer && message.data.room) {
          _this.room = message.data.room;
        }
      });
    }
  }, {
    key: 'onMessage',
    value: function onMessage(evt) {
      console.log('[message] - ', JSON.parse(evt.data).type);
    }
  }, {
    key: 'isConnected',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (this.id) {
                  _context.next = 3;
                  break;
                }

                _context.next = 3;
                return this.message('info');

              case 3:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function isConnected() {
        return _ref.apply(this, arguments);
      }

      return isConnected;
    }()
  }, {
    key: 'onClose',
    value: function onClose(event) {
      this.state = 'closed';
    }
  }, {
    key: 'start',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(room) {
        var message, _message;

        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!this.isServer) {
                  _context2.next = 9;
                  break;
                }

                this.send('session', {});
                _context2.next = 4;
                return this.message('session');

              case 4:
                message = _context2.sent;

                this.room = message.data.room;
                this.id = message.data.id;
                _context2.next = 14;
                break;

              case 9:
                this.room = room;
                this.send('session', {
                  room: room
                });
                _context2.next = 13;
                return this.message('session');

              case 13:
                _message = _context2.sent;

              case 14:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function start(_x) {
        return _ref2.apply(this, arguments);
      }

      return start;
    }()
  }, {
    key: 'message',
    value: function message(type, from) {
      var _this2 = this;

      return new _Promise(function (resolve, reject) {
        var evtListener = _this2.connection.addEventListener('message', function (evt) {
          var message = JSON.parse(evt.data);
          if (message.type === type && (message.from === from || from === undefined)) {
            _this2.connection.removeEventListener('message', evtListener);
            resolve(JSON.parse(evt.data));
          }
        });
      });
    }
  }, {
    key: 'send',
    value: function send(type, data, to, additionalData) {
      if (!additionalData) {
        additionalData = {};
      }
      var dataToSend = {
        type: type,
        data: data,
        to: to
      };
      _.forEach(additionalData, function (value, key) {
        dataToSend[key] = value;
      });

      this.connection.send(_JSON$stringify(dataToSend));
    }
  }]);

  return SignallingService;
}();

var resolvePromises = function resolvePromises(promises, type, data) {
  var newPromises = _Object$assign({}, promises);
  newPromises[type] = filter(promises[type], function (promise) {
    promise.resolve(data);
    return true;
  });
  return newPromises;
};



var addPromise = function addPromise(promises, type, resolve, reject) {
  var newPromises = _Object$assign({}, promises);
  newPromises[type] = concat(promises[type] || [], { resolve: resolve, reject: reject });
  return newPromises;
};

var STATUS = {
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING'
};

var TYPE = {
  SERVER: 'SERVER',
  CLIENT: 'CLIENT',
  BROADCAST: 'BROADCAST'
};

var NETWORK_CHANGE = {
  NEW_CONNECTION: 'NEW_CONNECTION',
  CLIENT_DISCONNECTED: 'CLIENT_DISCONNECTED'
};

var MESSAGE_TYPES = {
  NEW_CONNECTION: 'NEW_CONNECTION',
  CLIENT_DISCONNECTED: 'CLIENT_DISCONNECTED',
  NEW_CLIENT: '',
  DATA: 'DATA',
  OPEN: 'OPEN',
  CLIENT_INFO: 'CLIENT_INFO',
  NETWORK_INFO: 'NETWORK_INFO'
};

var SIGNALLING_MESSAGE_TYPES = {};

var ICE_SERVERS = {
  iceServers: [{
    urls: 'stun:stun.l.google.com:19302'
  }, {
    urls: 'stun:stun.services.mozilla.org'
  }]
};

var constants = Object.freeze({
	STATUS: STATUS,
	TYPE: TYPE,
	NETWORK_CHANGE: NETWORK_CHANGE,
	MESSAGE_TYPES: MESSAGE_TYPES,
	SIGNALLING_MESSAGE_TYPES: SIGNALLING_MESSAGE_TYPES,
	ICE_SERVERS: ICE_SERVERS
});

var Client = function () {
  /**
   * Creates new instance of Client
   * @param  {string} signallingServerURL url of signalling server which allows clients to connect, server must use same signalling server
   * @param  {object[]} [iceServers=defualt ICE servers] array of public ICE servers, if null uses default ones
   */
  function Client(signallingServerURL, iceServers) {
    _classCallCheck(this, Client);

    this.iceServers = iceServers || ICE_SERVERS;

    this.signalling = new SignallingService(signallingServerURL, false);

    this.sendChannelOpen = false;
    this.receiveChannelOpen = false;
    this.connected = false;

    this.promises = {
      connected: [],
      newClient: [],
      message: []
    };

    this.clients = {
      SERVER: {
        promises: {}
      }
    };
  }
  /**
   * Returns promise which gets resolved when client has connected
   * @returns {promise}
   */


  _createClass(Client, [{
    key: 'connection',
    value: function connection() {
      if (!this.connected) {
        return this._addPromise('connected');
      } else {
        return _Promise.resolve(true);
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

  }, {
    key: 'receive',
    value: function receive(from, customType) {
      if (customType) {
        return this._receive(MESSAGE_TYPES.DATA + '/' + customType, from);
      } else {
        return this._receive(MESSAGE_TYPES.DATA, from);
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

  }, {
    key: 'send',
    value: function send(data, to, customType) {
      this._send(MESSAGE_TYPES.DATA, data, to, customType);
    }
    /**
     * Disconnects client from server
     */

  }, {
    key: 'disconnect',
    value: function disconnect() {
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

  }, {
    key: 'connect',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(room, info) {
        var _this = this;

        var onIceCandidate, onIncomingIceCandidate, onSendChannelOpen, onReceiveChannelOpen, onDataChannel, addEventListeners, offer, response;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                onIceCandidate = function onIceCandidate(evt) {
                  if (evt.candidate) {
                    _this.signalling.send('ice', evt.candidate);
                  }
                };

                onIncomingIceCandidate = function () {
                  var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
                    var message;
                    return _regeneratorRuntime.wrap(function _callee$(_context) {
                      while (1) {
                        switch (_context.prev = _context.next) {
                          case 0:
                            _context.next = 2;
                            return _this.signalling.message('ice');

                          case 2:
                            message = _context.sent;

                            console.log('new ice candidate');
                            _this.peerConnection.addIceCandidate(message.data);

                          case 5:
                          case 'end':
                            return _context.stop();
                        }
                      }
                    }, _callee, _this);
                  }));

                  return function onIncomingIceCandidate() {
                    return _ref2.apply(this, arguments);
                  };
                }();

                onSendChannelOpen = function onSendChannelOpen() {
                  console.log('sendChannel open');
                  _this.sendChannelOpen = true;
                  if (_this.receiveChannelOpen && !_this.connected) {
                    _this.connected = true;
                    console.log(_this.sendChannel.readyState);
                    _this._resolvePromises('connected', true);
                  }
                };

                onReceiveChannelOpen = function onReceiveChannelOpen() {
                  console.log('receiveChannel open');
                  _this.receiveChannelOpen = true;
                  if (_this.sendChannelOpen && !_this.connected) {
                    _this.connected = true;
                    _this._resolvePromises('connected', true);
                  }
                };

                onDataChannel = function onDataChannel(evt) {
                  var receiveChannel = evt.channel;
                  receiveChannel.onmessage = _this._onMessage.bind(_this);
                  receiveChannel.onopen = onReceiveChannelOpen.bind(_this);
                  _this.receiveChannel = receiveChannel;
                };

                addEventListeners = function addEventListeners() {
                  _this.peerConnection.onicecandidate = onIceCandidate.bind(_this);
                  _this.peerConnection.ondatachannel = onDataChannel.bind(_this);
                  _this.sendChannel.onopen = onSendChannelOpen.bind(_this);
                  onIncomingIceCandidate();
                };

                this.info = info;
                _context2.next = 9;
                return this.signalling.isConnected();

              case 9:
                _context2.next = 11;
                return this.signalling.start(room, info);

              case 11:

                this.id = this.signalling.id;

                this.peerConnection = new RTCPeerConnection(this.iceServers);
                this.sendChannel = this.peerConnection.createDataChannel('clientSendChannel');

                addEventListeners();

                _context2.next = 17;
                return this.peerConnection.createOffer();

              case 17:
                offer = _context2.sent;
                _context2.next = 20;
                return this.peerConnection.setLocalDescription(offer);

              case 20:
                this.signalling.send('request', offer);

                _context2.next = 23;
                return this.signalling.message('response');

              case 23:
                response = _context2.sent;
                _context2.next = 26;
                return this.peerConnection.setRemoteDescription(response.data);

              case 26:
                _context2.next = 28;
                return this.connection();

              case 28:
                this._send(MESSAGE_TYPES.CLIENT_INFO, info, TYPE.BROADCAST);
                _context2.next = 31;
                return this._receive(TYPE.NETWORK_INFO);

              case 31:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function connect(_x, _x2) {
        return _ref.apply(this, arguments);
      }

      return connect;
    }()
  }, {
    key: '_onMessage',
    value: function _onMessage(evt) {
      var message = JSON.parse(evt.data);
      this._resolvePromises('message', message);
      this._resolvePromises(message.type, message);
      if (message.type === MESSAGE_TYPES.DATA && message.customType) {
        this._resolvePromises(message.type + '/' + message.customType, message);
      }
      if (this.clients[message.from]) {
        this._resolveClientPromise(message.from, 'message', message);
        this._resolveClientPromise(message.from, message.type, message);
        if (message.type === MESSAGE_TYPES.DATA && message.customType) {
          this._resolveClientPromise(message.from, message.type + '/' + message.customType, message);
        }
      }

      switch (message.type) {
        case MESSAGE_TYPES.NETWORK_INFO:
          var newClients = mapValues(message.data.clients, function (client) {
            client.promises = {};
            return client;
          });
          this.clients = _Object$assign({}, this.clients, newClients);
          break;
        case MESSAGE_TYPES.CLIENT_INFO:
          this.clients[message.from].info = message.data;
          break;
        case MESSAGE_TYPES.DATA:
          break;
        case MESSAGE_TYPES.NEW_CONNECTION:
          this.clients[message.data.id] = {
            info: undefined,
            promises: {}
          };
          break;
      }
    }
  }, {
    key: '_send',
    value: function _send(type, data, to, customType) {
      var message = {
        type: type,
        data: data,
        to: to,
        customType: customType
      };
      this.sendChannel.send(_JSON$stringify(message));
    }
  }, {
    key: '_receive',
    value: function _receive() {
      var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'message';
      var from = arguments[1];

      if (from) {
        return this._addClientPromise(from, type);
      } else {
        return this._addPromise(type);
      }
    }

    // promise handlers

  }, {
    key: '_addPromise',
    value: function _addPromise(type) {
      var _this2 = this;

      return new _Promise(function (resolve, reject) {
        _this2.promises = addPromise(_this2.promises, type, resolve, reject);
      });
    }
  }, {
    key: '_addClientPromise',
    value: function _addClientPromise(clientId, type) {
      var _this3 = this;

      if (this.clients[clientId]) {
        return new _Promise(function (resolve, reject) {
          _this3.clients[clientId].promises = addPromise(_this3.clients[clientId].promises, type, resolve, reject);
        });
      } else {
        return _Promise.reject('');
      }
    }
  }, {
    key: '_resolvePromises',
    value: function _resolvePromises(type, data) {
      this.promises = resolvePromises(this.promises, type, data);
    }
  }, {
    key: '_resolveClientPromise',
    value: function _resolveClientPromise(clientId, type, data) {
      this.clients[clientId].promises = resolvePromises(this.clients[clientId].promises, type, data);
    }
    // end of promise handlers

  }]);

  return Client;
}();

function log(type, message, data) {
  console.log('[' + type + '] - ' + message, data);
}
/**
 * Server library
 * @class
 */

var Server = function () {
  /**
   * Creates new instance of Server8
   * @param  {string} signallingServerURL url of signalling server which allows clients to connect, client must use same signalling server
   * @param  {object[]} [iceServers=defualt ICE servers] array of public ICE servers, if null uses default ones
   * @param  {number} maxConnections maximum number of connections
   */
  function Server(signallingServerURL, iceServers, maxConnections) {
    _classCallCheck(this, Server);

    this.maxConnections = maxConnections;
    this.iceServers = iceServers || ICE_SERVERS;

    this.signalling = new SignallingService(signallingServerURL, true);

    this.clients = {};
    this.onopen = undefined;

    /**
     * 
     * @member {string} room room id which is used for clients to connect to server
     */
    this.room = null;

    this.onMessage = this._onMessage.bind(this);

    this.promises = {
      initialization: [],
      newClient: []
    };
  }

  /**
   * Returns promise which gets fulfilled when server has finished initialization handshake with signalling server
   * Server is now in state in which it can accept incoming connections
   * @returns {promise<string>} Contains room id obtained from signalling server
   */


  _createClass(Server, [{
    key: 'initialization',
    value: function initialization() {
      if (!this.room) {
        return this._addPromise('initialization');
      }
    }

    /**
     * Returns promise which gets fulfilled when new client has connected to server
     * @returns {promise<clientId>} Contains clientm id obtained from signalling server
     */

  }, {
    key: 'newClient',
    value: function newClient() {
      return this._addPromise('newClient');
    }
    /**
     * Returns promise which gets fullfiled when server receives info message from client
     * 
     * @param {promise<object>} from message object with client info
     */

  }, {
    key: 'clientInfo',
    value: function clientInfo(from) {
      return this._receive(from, MESSAGE_TYPES.CLIENT_INFO);
    }

    /**
     * Returns promise which waits for message from specified clients in `to` parameter
     * 
     * @param {clientId|clientId[]|null} [from=null] from who to receive message, if null waits for message from anyone
     * @param {string|null} [customType=null] wait for specific type of message, if null waits for any type
     * @returns {Promise<object>} contains received message from client/s
     */

  }, {
    key: 'receive',
    value: function receive(from, customType) {
      if (customType) {
        return this._receive(from, MESSAGE_TYPES.DATA + '/' + customType);
      } else {
        return this._receive(from, MESSAGE_TYPES.DATA);
      }
    }

    /**
     * Sends message to specified clients
     * 
     * @param {object} data 
     * @param {clientId|clientId[]|null} to can be single TYPE.BROADCAST or client id or array of user id to which to send the message
     * @param {string|null} [customType=null] info for receiving side to specify what kind of message it is sending, if null sends message without custom type
     */

  }, {
    key: 'send',
    value: function send(data, to, customType) {
      this._send(MESSAGE_TYPES.DATA, data, to, TYPE.SERVER, customType);
    }

    /**
     * Disconnects client from server
     * @param {clientId} clientId 
     */

  }, {
    key: 'disconnect',
    value: function disconnect(clientId) {
      this.clients[clientId].peerConnection.close();
      this.clients[clientId].receiveChannel.close();
      this.clients[clientId].sendChannel.close();
    }

    /**
     * @returns {number} number of connected clients
     */

  }, {
    key: 'listen',


    /**
     * Initializes and starts the server
     * Accepts incoming connections
     * 
     * @returns {promise} gets fulfilled when maximum number of clients is reached
     */
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
        var _this = this;

        var onDataChannel, addEventListeners, onSendChannelOpen, onReceiveChannelOpen, onIceCandidate, onIncomingIceCandidate, _loop;

        return _regeneratorRuntime.wrap(function _callee2$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                onDataChannel = function onDataChannel(clientId) {
                  return function (evt) {
                    log('data channel', 'new data channel', evt.channel);
                    var receiveChannel = evt.channel;
                    receiveChannel.onmessage = _this._onMessage(clientId);
                    receiveChannel.onopen = onReceiveChannelOpen(clientId);

                    _this.clients[clientId].receiveChannel = receiveChannel;
                    window.receiveChannel = receiveChannel;
                  };
                };

                addEventListeners = function addEventListeners(clientId) {
                  log('event listener', 'adding event listeners');
                  onIncomingIceCandidate(clientId).then(function () {
                    console.log('done');
                  });
                  _this.clients[clientId].peerConnection.onicecandidate = onIceCandidate(clientId);
                  _this.clients[clientId].peerConnection.ondatachannel = onDataChannel(clientId);
                  _this.clients[clientId].sendChannel.onopen = onSendChannelOpen(clientId);
                };

                onSendChannelOpen = function onSendChannelOpen(clientId) {
                  return function (evt) {
                    log('send channel', 'send channel open');
                    _this.clients[clientId].sendChannelOpen = true;
                    if (_this.clients[clientId].receiveChannelOpen && !_this.clients[clientId].connected) {
                      _this.clients[clientId].connected = true;
                      _this._resolvePromises('newClient', clientId);
                    }
                  };
                };

                onReceiveChannelOpen = function onReceiveChannelOpen(clientId) {
                  return function (evt) {
                    log('receive channel', 'receive channel open');
                    _this.clients[clientId].receiveChannelOpen = true;
                    if (_this.clients[clientId].receiveChannelOpen && !_this.clients[clientId].connected) {
                      _this.clients[clientId].connected = true;
                      _this._resolvePromises('newClient', clientId);
                    }
                  };
                };

                onIceCandidate = function onIceCandidate(clientId) {
                  return function (evt) {
                    if (evt.candidate) {
                      log('ice', 'got ice candidate', evt.candidate);
                      _this.signalling.send('ice', evt.candidate, clientId);
                    }
                  };
                };

                onIncomingIceCandidate = function () {
                  var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(clientId) {
                    var message;
                    return _regeneratorRuntime.wrap(function _callee$(_context) {
                      while (1) {
                        switch (_context.prev = _context.next) {
                          case 0:
                            log('ice', 'starting to expect ice candidate message');
                            _context.next = 3;
                            return _this.signalling.message('ice');

                          case 3:
                            message = _context.sent;

                            log('ice', 'received ice candidate from client', message.data);
                            console.log('received ice candidate but it does not really matter');
                            _this.clients[clientId].peerConnection.addIceCandidate(message.data);

                          case 7:
                          case 'end':
                            return _context.stop();
                        }
                      }
                    }, _callee, _this);
                  }));

                  return function onIncomingIceCandidate(_x) {
                    return _ref2.apply(this, arguments);
                  };
                }();

                _context3.next = 8;
                return this.signalling.isConnected();

              case 8:
                _context3.next = 10;
                return this.signalling.start();

              case 10:

                this.room = this.signalling.room;
                this.id = this.signalling.id;

                this._resolvePromises('initialization', this.room);

                _loop = /*#__PURE__*/_regeneratorRuntime.mark(function _loop() {
                  var initialMessage, client, id, answer;
                  return _regeneratorRuntime.wrap(function _loop$(_context2) {
                    while (1) {
                      switch (_context2.prev = _context2.next) {
                        case 0:
                          log('initialization', 'waiting for initial request message');
                          _context2.next = 3;
                          return _this.signalling.message('request');

                        case 3:
                          initialMessage = _context2.sent;

                          log('initialization', 'got initialization message', initialMessage);
                          client = {
                            promises: {
                              message: []
                            },
                            info: undefined
                          };
                          id = initialMessage.from;

                          _this.clients[id] = client;

                          client.peerConnection = new RTCPeerConnection(_this.iceServers);
                          log('peer connection', 'created RTCPeerConnection');
                          client.sendChannel = client.peerConnection.createDataChannel('sendChannel');
                          log('peer connection', 'created sendChannel');
                          addEventListeners(id);
                          log('event listener', 'added event listeners');
                          _context2.next = 16;
                          return client.peerConnection.setRemoteDescription(initialMessage.data);

                        case 16:
                          log('peer connection', 'set remote description');
                          _context2.next = 19;
                          return client.peerConnection.createAnswer();

                        case 19:
                          answer = _context2.sent;

                          log('peer connection', 'created answer');
                          _context2.next = 23;
                          return client.peerConnection.setLocalDescription(answer);

                        case 23:
                          log('peer connection', 'set localDescription');
                          _this.signalling.send('response', answer, id);
                          log('peer connection', 'sent response');

                          _this._receive(id, TYPE.CLIENT_INFO).then(function (infoMessage) {
                            console.log('received info message');
                            _this.clients[id].info = infoMessage.data;
                            // TODO add resolve promise to let know that user is ready
                          });
                          _context2.next = 29;
                          return _this.newClient();

                        case 29:

                          _this._send(MESSAGE_TYPES.NETWORK_INFO, {
                            clients: pickBy(_this.clientsInfo, function (client, clientId) {
                              return clientId !== id;
                            })
                          }, id);

                          _this._send(MESSAGE_TYPES.NEW_CONNECTION, {
                            id: id
                          }, TYPE.BROADCAST, id);

                        case 31:
                        case 'end':
                          return _context2.stop();
                      }
                    }
                  }, _loop, _this);
                });

              case 14:
                if (!(this.activeClients < this.maxConnections)) {
                  _context3.next = 18;
                  break;
                }

                return _context3.delegateYield(_loop(), 't0', 16);

              case 16:
                _context3.next = 14;
                break;

              case 18:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee2, this);
      }));

      function listen() {
        return _ref.apply(this, arguments);
      }

      return listen;
    }()
  }, {
    key: '_processMessage',
    value: function _processMessage(message, clientId) {
      message.from = clientId;
      this._resolvePromises('message', message);
      this._resolvePromises(message.type, message);
      if (message.type === MESSAGE_TYPES.DATA && message.customType) {
        this._resolvePromises(message.type + '/' + message.customType, message);
      }
      if (this.clients[clientId]) {
        this._resolveClientPromise(clientId, 'message', message);
        this._resolveClientPromise(clientId, message.type, message);
        if (message.type === MESSAGE_TYPES.DATA && message.customType) {
          this._resolveClientPromise(clientId, message.type + '/' + message.customType, message);
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
  }, {
    key: '_onMessage',
    value: function _onMessage(clientId) {
      var _this2 = this;

      return function (evt) {
        var message = JSON.parse(evt.data);

        // Handle to who is message meant to
        var to = message.to;

        if (typeof to === 'string') {
          if (to === TYPE.SERVER) {
            _this2._processMessage(message, clientId);
          } else if (to === TYPE.BROADCAST) {
            _this2._processMessage(message, clientId);
            _this2._send(message.type, message.data, to, clientId);
          } else {
            _this2._send(message.type, message.data, to, clientId);
          }
        } else if ((typeof to === 'undefined' ? 'undefined' : _typeof(to)) === 'object') {
          if (to.includes(TYPE.SERVER)) {
            _this2._processMessage(message, clientId);
            _this2._send(message.type, message.data, to, clientId);
          } else {
            _this2._send(message.type, message.data, to, clientId);
          }
        }
      };
    }
  }, {
    key: '_send',
    value: function _send(type, data, to) {
      var _this3 = this;

      var from = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : TYPE.SERVER;
      var customType = arguments[4];

      var message = {
        type: type,
        data: data,
        from: from,
        customType: customType
      };
      var serializedMessage = _JSON$stringify(message);
      if ((typeof to === 'undefined' ? 'undefined' : _typeof(to)) === 'object') {
        forEach(to, function (recipient) {
          if (recipient !== TYPE.SERVER) {
            _this3.clients[recipient].sendChannel.send(serializedMessage);
          }
        });
      } else if (to == TYPE.BROADCAST) {
        forEach(this.clients, function (client, clientId) {
          if (from !== clientId) {
            client.sendChannel.send(serializedMessage);
          }
        });
      } else {
        this.clients[to].sendChannel.send(serializedMessage);
      }
    }
  }, {
    key: '_receive',
    value: function _receive(from, type) {
      if (from) {
        return this._addClientPromise(from, type);
      } else {
        return this._addPromise(type);
      }
    }

    // Promise handlers

  }, {
    key: '_addPromise',
    value: function _addPromise(type) {
      var _this4 = this;

      return new _Promise(function (resolve, reject) {
        _this4.promises = addPromise(_this4.promises, type, resolve, reject);
      });
    }
  }, {
    key: '_addClientPromise',
    value: function _addClientPromise(clientId, type) {
      var _this5 = this;

      return new _Promise(function (resolve, reject) {
        _this5.clients[clientId].promises = addPromise(_this5.clients[clientId].promises, type, resolve, reject);
      });
    }
  }, {
    key: '_resolveClientPromise',
    value: function _resolveClientPromise(clientId, type, data) {
      this.clients[clientId].promises = resolvePromises(this.clients[clientId].promises, type, data);
    }
  }, {
    key: '_resolvePromises',
    value: function _resolvePromises(type, data) {
      this.promises = resolvePromises(this.promises, type, data);
    }
    // end of promise handlers

  }, {
    key: 'activeClients',
    get: function get() {
      var numOfActiveClients = 0;
      forEach(this.clients, function (client) {
        if (client.state !== STATUS.DISCONNECTED) {
          numOfActiveClients++;
        }
      });
      return numOfActiveClients;
    }

    /**
     * @returns {object} object containing connected clients and their info
     */

  }, {
    key: 'clientsInfo',
    get: function get() {
      return mapValues(this.clients, function (client, clientId) {
        return {
          info: client.info
        };
      });
    }
  }]);

  return Server;
}();

var index = {
  Server: Server, Client: Client, constants: constants
};

export default index;
