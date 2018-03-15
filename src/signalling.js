import _ from 'lodash';
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
          this.room = message.data.room
        })
    } else {
      this.send('info', {
        type: 'CLIENT',
      });
      this.message('session')
        .then((message) => {
          console.log('[session] -',message);
        })
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
    _.forEach(additionalData, (value, key) => {
      dataToSend[key] = value
    });

    this.connection.send(JSON.stringify(dataToSend));
  }
}

export default SignallingService;
