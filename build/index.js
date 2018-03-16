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

var constants = Object.freeze({
	STATUS: STATUS,
	TYPE: TYPE,
	NETWORK_CHANGE: NETWORK_CHANGE,
	MESSAGE_TYPES: MESSAGE_TYPES,
	SIGNALLING_MESSAGE_TYPES: SIGNALLING_MESSAGE_TYPES
});

var Client = function () {
  function Client(signallingServerURL, iceServers) {
    _classCallCheck(this, Client);

    this.iceServers = iceServers;

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

  _createClass(Client, [{
    key: 'addPromise',
    value: function addPromise$$1(type) {
      var _this = this;

      return new _Promise(function (resolve, reject) {
        _this.promises = addPromise(_this.promises, type, resolve, reject);
      });
    }
  }, {
    key: 'addClientPromise',
    value: function addClientPromise(clientId, type) {
      var _this2 = this;

      if (this.clients[clientId]) {
        return new _Promise(function (resolve, reject) {
          _this2.clients[clientId].promises = addPromise(_this2.clients[clientId].promises, type, resolve, reject);
        });
      } else {
        return _Promise.reject('');
      }
    }
  }, {
    key: 'resolvePromises',
    value: function resolvePromises$$1(type, data) {
      this.promises = resolvePromises(this.promises, type, data);
    }
  }, {
    key: 'resolveClientPromise',
    value: function resolveClientPromise(clientId, type, data) {
      this.clients[clientId].promises = resolvePromises(this.clients[clientId].promises, type, data);
    }
  }, {
    key: 'connection',
    value: function connection() {
      if (!this.connected) {
        return this.addPromise('connected');
      } else {
        return _Promise.resolve(true);
      }
    }
  }, {
    key: 'onIceCandidate',
    value: function onIceCandidate(evt) {
      if (evt.candidate) {
        this.signalling.send('ice', evt.candidate);
      }
    }
  }, {
    key: 'onIncomingIceCandidate',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
        var message;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.signalling.message('ice');

              case 2:
                message = _context.sent;

                console.log('new ice candidate');
                this.peerConnection.addIceCandidate(message.data);

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function onIncomingIceCandidate() {
        return _ref.apply(this, arguments);
      }

      return onIncomingIceCandidate;
    }()
  }, {
    key: 'onSendChannelOpen',
    value: function onSendChannelOpen() {
      console.log('sendChannel open');
      this.sendChannelOpen = true;
      if (this.receiveChannelOpen && !this.connected) {
        this.connected = true;
        console.log(this.sendChannel.readyState);
        this.resolvePromises('connected', true);
      }
    }
  }, {
    key: 'onReceiveChannelOpen',
    value: function onReceiveChannelOpen() {
      console.log('receiveChannel open');
      this.receiveChannelOpen = true;
      if (this.sendChannelOpen && !this.connected) {
        this.connected = true;
        this.resolvePromises('connected', true);
      }
    }
  }, {
    key: 'onDataChannel',
    value: function onDataChannel(evt) {
      var receiveChannel = evt.channel;
      receiveChannel.onmessage = this.onMessage.bind(this);
      receiveChannel.onopen = this.onReceiveChannelOpen.bind(this);
      this.receiveChannel = receiveChannel;
    }
  }, {
    key: 'onMessage',
    value: function onMessage(evt) {
      var message = JSON.parse(evt.data);
      this.resolvePromises('message', message);
      this.resolvePromises(message.type, message);
      if (message.type === MESSAGE_TYPES.DATA && message.customType) {
        this.resolvePromises(message.type + '/' + message.customType, message);
      }
      if (this.clients[message.from]) {
        this.resolveClientPromise(message.from, 'message', message);
        this.resolveClientPromise(message.from, message.type, message);
        if (message.type === MESSAGE_TYPES.DATA && message.customType) {
          this.resolveClientPromise(message.from, message.type + '/' + message.customType, message);
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
    key: 'addEventListeners',
    value: function addEventListeners() {
      this.peerConnection.onicecandidate = this.onIceCandidate.bind(this);
      this.peerConnection.ondatachannel = this.onDataChannel.bind(this);
      this.sendChannel.onopen = this.onSendChannelOpen.bind(this);
      this.onIncomingIceCandidate();
    }
  }, {
    key: 'connect',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(room, info) {
        var offer, response;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                this.info = info;
                _context2.next = 3;
                return this.signalling.isConnected();

              case 3:
                _context2.next = 5;
                return this.signalling.start(room, info);

              case 5:

                this.id = this.signalling.id;

                this.peerConnection = new RTCPeerConnection(this.iceServers);
                this.sendChannel = this.peerConnection.createDataChannel('clientSendChannel');

                this.addEventListeners();

                _context2.next = 11;
                return this.peerConnection.createOffer();

              case 11:
                offer = _context2.sent;
                _context2.next = 14;
                return this.peerConnection.setLocalDescription(offer);

              case 14:
                this.signalling.send('request', offer);

                _context2.next = 17;
                return this.signalling.message('response');

              case 17:
                response = _context2.sent;
                _context2.next = 20;
                return this.peerConnection.setRemoteDescription(response.data);

              case 20:
                _context2.next = 22;
                return this.connection();

              case 22:
                this._send(MESSAGE_TYPES.CLIENT_INFO, info, TYPE.BROADCAST);
                _context2.next = 25;
                return this._receive(TYPE.NETWORK_INFO);

              case 25:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function connect(_x, _x2) {
        return _ref2.apply(this, arguments);
      }

      return connect;
    }()
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
    key: 'send',
    value: function send(data, to, customType) {
      this._send(MESSAGE_TYPES.DATA, data, to, customType);
    }
  }, {
    key: 'close',
    value: function close() {
      this.peerConnection.close();
      this.sendChannel.close();
      this.receiveChannel.close();
    }
  }, {
    key: '_receive',
    value: function _receive() {
      var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'message';
      var from = arguments[1];

      if (from) {
        return this.addClientPromise(from, type);
      } else {
        return this.addPromise(type);
      }
    }
  }, {
    key: 'receive',
    value: function receive(from, customType) {
      if (customType) {
        return this._receive(MESSAGE_TYPES.DATA + '/' + customType, from);
      } else {
        return this._receive(MESSAGE_TYPES.DATA, from);
      }
    }
  }]);

  return Client;
}();

function log(type, message, data) {
  console.log('[' + type + '] - ' + message, data);
}

var Server = function () {
  function Server(signallingServerURL, iceServers, maxConnections) {
    _classCallCheck(this, Server);

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
      newClient: []
    };
  }

  // promise events


  _createClass(Server, [{
    key: 'addPromise',
    value: function addPromise$$1(type) {
      var _this = this;

      return new _Promise(function (resolve, reject) {
        _this.promises = addPromise(_this.promises, type, resolve, reject);
      });
    }
  }, {
    key: 'addClientPromise',
    value: function addClientPromise(clientId, type) {
      var _this2 = this;

      return new _Promise(function (resolve, reject) {
        _this2.clients[clientId].promises = addPromise(_this2.clients[clientId].promises, type, resolve, reject);
      });
    }
  }, {
    key: 'resolveClientPromise',
    value: function resolveClientPromise(clientId, type, data) {
      this.clients[clientId].promises = resolvePromises(this.clients[clientId].promises, type, data);
    }
  }, {
    key: 'resolvePromises',
    value: function resolvePromises$$1(type, data) {
      this.promises = resolvePromises(this.promises, type, data);
    }
  }, {
    key: 'initialization',
    value: function initialization() {
      if (!this.room) {
        return this.addPromise('initialization');
      }
    }
  }, {
    key: 'newClient',
    value: function newClient() {
      return this.addPromise('newClient');
    }
  }, {
    key: 'clientInfo',
    value: function clientInfo(from) {
      return this._receive(from, MESSAGE_TYPES.CLIENT_INFO);
    }
    //

  }, {
    key: 'onSendChannelOpen',
    value: function onSendChannelOpen(clientId) {
      var _this3 = this;

      return function (evt) {
        log('send channel', 'send channel open');
        _this3.clients[clientId].sendChannelOpen = true;
        if (_this3.clients[clientId].receiveChannelOpen && !_this3.clients[clientId].connected) {
          _this3.clients[clientId].connected = true;
          _this3.resolvePromises('newClient', clientId);
        }
      };
    }
  }, {
    key: 'onReceiveChannelOpen',
    value: function onReceiveChannelOpen(clientId) {
      var _this4 = this;

      return function (evt) {
        log('receive channel', 'receive channel open');
        _this4.clients[clientId].receiveChannelOpen = true;
        if (_this4.clients[clientId].receiveChannelOpen && !_this4.clients[clientId].connected) {
          _this4.clients[clientId].connected = true;
          _this4.resolvePromises('newClient', clientId);
        }
      };
    }
  }, {
    key: 'onIceCandidate',
    value: function onIceCandidate(clientId) {
      var _this5 = this;

      return function (evt) {
        if (evt.candidate) {
          log('ice', 'got ice candidate', evt.candidate);
          _this5.signalling.send('ice', evt.candidate, clientId);
        }
      };
    }
  }, {
    key: 'onIncomingIceCandidate',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(clientId) {
        var message;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                log('ice', 'starting to expect ice candidate message');
                _context.next = 3;
                return this.signalling.message('ice');

              case 3:
                message = _context.sent;

                log('ice', 'received ice candidate from client', message.data);
                console.log('received ice candidate but it does not really matter');
                this.clients[clientId].peerConnection.addIceCandidate(message.data);

              case 7:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function onIncomingIceCandidate(_x) {
        return _ref.apply(this, arguments);
      }

      return onIncomingIceCandidate;
    }()
  }, {
    key: 'processMessage',
    value: function processMessage(message, clientId) {
      message.from = clientId;
      this.resolvePromises('message', message);
      this.resolvePromises(message.type, message);
      if (message.type === MESSAGE_TYPES.DATA && message.customType) {
        this.resolvePromises(message.type + '/' + message.customType, message);
      }
      if (this.clients[clientId]) {
        this.resolveClientPromise(clientId, 'message', message);
        this.resolveClientPromise(clientId, message.type, message);
        if (message.type === MESSAGE_TYPES.DATA && message.customType) {
          this.resolveClientPromise(clientId, message.type + '/' + message.customType, message);
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
    key: 'onMessage',
    value: function onMessage(clientId) {
      var _this6 = this;

      return function (evt) {
        var message = JSON.parse(evt.data);

        // Handle to who is message meant to
        var to = message.to;

        if (typeof to === 'string') {
          if (to === TYPE.SERVER) {
            _this6.processMessage(message, clientId);
          } else if (to === TYPE.BROADCAST) {
            _this6.processMessage(message, clientId);
            _this6._send(message.type, message.data, to, clientId);
          } else {
            _this6._send(message.type, message.data, to, clientId);
          }
        } else if ((typeof to === 'undefined' ? 'undefined' : _typeof(to)) === 'object') {
          if (to.includes(TYPE.SERVER)) {
            _this6.processMessage(message, clientId);
            _this6._send(message.type, message.data, to, clientId);
          } else {
            _this6._send(message.type, message.data, to, clientId);
          }
        }
      };
    }
  }, {
    key: 'onDataChannel',
    value: function onDataChannel(clientId) {
      var _this7 = this;

      return function (evt) {
        log('data channel', 'new data channel', evt.channel);
        var receiveChannel = evt.channel;
        receiveChannel.onmessage = _this7.onMessage(clientId);
        receiveChannel.onopen = _this7.onReceiveChannelOpen(clientId);

        _this7.clients[clientId].receiveChannel = receiveChannel;
        window.receiveChannel = receiveChannel;
      };
    }
  }, {
    key: 'addEventListeners',
    value: function addEventListeners(clientId) {
      log('event listener', 'adding event listeners');
      this.onIncomingIceCandidate(clientId).then(function () {
        console.log('done');
      });
      this.clients[clientId].peerConnection.onicecandidate = this.onIceCandidate(clientId);
      this.clients[clientId].peerConnection.ondatachannel = this.onDataChannel(clientId);
      this.clients[clientId].sendChannel.onopen = this.onSendChannelOpen(clientId);
    }
  }, {
    key: 'close',
    value: function close(clientId) {
      this.clients[clientId].peerConnection.close();
      this.clients[clientId].receiveChannel.close();
      this.clients[clientId].sendChannel.close();
    }
  }, {
    key: 'listen',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
        var _this8 = this;

        var _loop;

        return _regeneratorRuntime.wrap(function _callee2$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this.signalling.isConnected();

              case 2:
                _context3.next = 4;
                return this.signalling.start();

              case 4:

                this.room = this.signalling.room;
                this.id = this.signalling.id;

                this.resolvePromises('initialization', this.room);
                _loop = /*#__PURE__*/_regeneratorRuntime.mark(function _loop() {
                  var initialMessage, client, id, answer;
                  return _regeneratorRuntime.wrap(function _loop$(_context2) {
                    while (1) {
                      switch (_context2.prev = _context2.next) {
                        case 0:
                          log('initialization', 'waiting for initial request message');
                          _context2.next = 3;
                          return _this8.signalling.message('request');

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

                          _this8.clients[id] = client;

                          // client.sendChannelConnected = false;
                          // client.receiveChannelConnected = false;


                          client.peerConnection = new RTCPeerConnection(_this8.iceServers);
                          log('peer connection', 'created RTCPeerConnection');
                          client.sendChannel = client.peerConnection.createDataChannel('sendChannel');
                          log('peer connection', 'created sendChannel');
                          _this8.addEventListeners(id);
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
                          _this8.signalling.send('response', answer, id);
                          log('peer connection', 'sent response');

                          _this8._receive(id, TYPE.CLIENT_INFO).then(function (infoMessage) {
                            console.log('received info message');
                            _this8.clients[id].info = infoMessage.data;
                            // TODO add resolve promise to let know that user is ready
                          });
                          _context2.next = 29;
                          return _this8.newClient();

                        case 29:

                          _this8._send(MESSAGE_TYPES.NETWORK_INFO, {
                            clients: pickBy(_this8.clientsInfo, function (client, clientId) {
                              return clientId !== id;
                            })
                          }, id);

                          _this8._send(MESSAGE_TYPES.NEW_CONNECTION, {
                            id: id
                          }, TYPE.BROADCAST, id);

                        case 31:
                        case 'end':
                          return _context2.stop();
                      }
                    }
                  }, _loop, _this8);
                });

              case 8:
                if (!(this.activeClients < this.maxConnections)) {
                  _context3.next = 12;
                  break;
                }

                return _context3.delegateYield(_loop(), 't0', 10);

              case 10:
                _context3.next = 8;
                break;

              case 12:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee2, this);
      }));

      function listen() {
        return _ref2.apply(this, arguments);
      }

      return listen;
    }()
  }, {
    key: '_send',
    value: function _send(type, data, to) {
      var _this9 = this;

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
            _this9.clients[recipient].sendChannel.send(serializedMessage);
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
    key: 'send',
    value: function send(data, to, customType) {
      this._send(MESSAGE_TYPES.DATA, data, to, TYPE.SERVER, customType);
    }
  }, {
    key: '_receive',
    value: function _receive(from, type) {
      if (from) {
        return this.addClientPromise(from, type);
      } else {
        return this.addPromise(type);
      }
    }
  }, {
    key: 'receive',
    value: function receive(from, customType) {
      if (customType) {
        return this._receive(from, MESSAGE_TYPES.DATA + '/' + customType);
      } else {
        return this._receive(from, MESSAGE_TYPES.DATA);
      }
    }
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

export { Server, Client, constants };
