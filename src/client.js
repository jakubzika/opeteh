import SignallingService from "./signalling";

class Client {
  constructor(signallingServerURL, iceServers) {
    this.iceServers = iceServers;

    this.signalling = new SignallingService(signallingServerURL, false);

    this.sendChannelOpen = false;
    this.receiveChannelOpen = false;
    this.connected = false;

    this.onopen = undefined;
  }

  onIceCandidate(evt) {
    if(evt.candidate) {
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
    this.send('open', true);
    if(this.receiveChannelOpen && !this.connected) {
      this.connected = true;
      if(typeof this.onopen === 'function') {
        this.onopen();
      }
    }
  }

  onReceiveChannelOpen() {
    console.log('receiveChannel open');
    this.receiveChannelOpen = true;
    if(this.sendChannelOpen && !this.connected) {
      this.connected = true;
      if(typeof this.onopen === 'function') {
        this.onopen();
      }
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
    console.log(message.data);
  }

  addEventListeners() {
    this.peerConnection.onicecandidate = this.onIceCandidate.bind(this);
    this.peerConnection.ondatachannel = this.onDataChannel.bind(this);
    this.sendChannel.onopen = this.onSendChannelOpen.bind(this);
    this.onIncomingIceCandidate();
  }

  async connect(room) {
    await this.signalling.isConnected();
    await this.signalling.start(room);

    this.peerConnection = new RTCPeerConnection(this.iceServers);
    this.sendChannel = this.peerConnection.createDataChannel('clientSendChannel');

    this.addEventListeners();

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.signalling.send('request', offer);

    const response = await this.signalling.message('response');
    await this.peerConnection.setRemoteDescription(response.data);
  }

  send(type, data) {
    const message = {
      type,
      data,
    };
    this.sendChannel.send(JSON.stringify(message));
  }

  close() {
    this.peerConnection.close();
    this.sendChannel.close();
    this.receiveChannel.close();
  }

  receive(type) {
    return new Promise((resolve, reject) => {
      const evtListener = this.receiveChannel.addEventListener('message', (evt) => {
        const message = JSON.parse(evt.data);
        if(message.type === type) {
          resolve(message.data);
          this.receiveChannel.removeEventListener('message', evtListener);
        }
      })
    });
  }
}

export default Client;
