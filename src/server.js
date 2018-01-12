import _ from 'lodash';

import SignallingService from './signalling';
import { status } from "./constants";

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
  }

  get activeClients() {
    let numOfActiveClients = 0;
    _.forEach(this.clients, (client) => {
      if(client.state !== status.DISCONNECTED) {
        numOfActiveClients++;
      }
    });
    return numOfActiveClients;
  }

  onSendChannelOpen(clientId) {
    return (evt) => {
      log('send channel', 'send channel open');
      this.send('open', true, clientId);
      this.clients[clientId].sendChannelOpen = true;
      if(this.clients[clientId].receiveChannelOpen && !this.clients[clientId].connected) {
        this.clients[clientId].connected = true;
        if(typeof this.onopen === 'function') {
          this.onopen(clientId);
        }
      }
    }
  }

  onReceiveChannelOpen(clientId) {
    return (evt) => {
      log('receive channel', 'receive channel open');
      this.clients[clientId].receiveChannelOpen = true;
      if(this.clients[clientId].receiveChannelOpen && !this.clients[clientId].connected) {
        this.clients[clientId].connected = true;
        if(typeof this.onopen === 'function') {
          this.onopen(clientId);
        }
      }
    }
  }

  onIceCandidate(clientId) {
    return (evt) => {
      if(evt.candidate) {
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

  onMessage(clientId) {
    return (evt) => {
      log('message', 'incoming message', JSON.parse(evt.data));
      const message= JSON.parse(evt.data);
      switch(message.type) {
        case 'open':

          break;
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

  close(id) {
    this.clients[clientId].peerConnection.close();
    this.clients[clientId].receiveChannel.close();
    this.clients[clientId].sendChannel.close();
  }

  async listen() {
    await this.signalling.isConnected();
    await this.signalling.start();
    while(this.activeClients < this.maxConnections) {
      log('initialization', 'waiting for initial request message');
      const initialMessage = await this.signalling.message('request');
      log('initialization', 'got initialization message', initialMessage);
      const client = {};
      const id = initialMessage.from;
      this.clients[id] = client;

      client.sendChannelConnected = false;
      client.receiveChannelConnected = false;

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
    }
  }

  send(type, data, id) {
    const message = {
      type,
      data,
    };
    this.clients[id].sendChannel.send(JSON.stringify(message));
  }

  receive(id) {
    return new Promise((resolve, reject) => {
      const evtListener = this.clients[id].receiveChannel.addEventListeners('message', (evt) => {
        const message = JSON.parse(evt.data);
        if(message.type === 'data') {
          resolve(message.data);
          this.clients[id].receiveChannel.removeEventListener('message', evtListener);
        }
      })
    });
  }
}

export default Server;
