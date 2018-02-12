
let sendChannel;
let receiveChannel;
let id;

function formatMessage(type, data, to) {
  data = {
    type: type,
    data: data
  };
  if (to) {
    data.to = to;
  }
  return JSON.stringify(data);
}

const connectingTo = '';

let signallingConnection = new WebSocket('ws://localhost:7070');
const isServer = location.hash === '#s';


signallingConnection.onopen = () => {
  console.log('connected');
  signallingConnection.send(formatMessage('info', {
    type: location.hash === '#s' ? 'SERVER' : 'CLIENT'
  }));
  incomingMessage('info')
    .then((message) => {
      id = message.data.id;
      if(!isServer) {
        client();
      }
      else {
        server();
      }
    })
};

function incomingMessage(type) {
  return new Promise((resolve, reject) => {
    let evtListener = signallingConnection.addEventListener('message',(evt) => {
      let message = JSON.parse(evt.data);
      if(message.type === type) {
        signallingConnection.removeEventListener('message',evtListener);
        resolve(JSON.parse(evt.data));
      }
    });
  });
}

signallingConnection.onmessage = (evt) => {
};

const config = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: 'stun:stun.services.mozilla.org'
    }
  ]};

function onIceCandidate(to) {
  return (evt) => {
    if(evt.candidate) {
      console.log('sending ice candidate');
      signallingConnection.send(formatMessage('ice', evt.candidate, to));
    }
  }
}

async function iceCandidate(connection) {
  let message = await incomingMessage('ice');
  console.log('got ice candidate');
  connection.addIceCandidate(message.data);
}

function open() {
  sendChannel.send('connection successful');
}

function handleReceiveMessage(msg) {
  console.log(msg.data);
}

function handleOpenChannel() {
  console.log('new channel opened');
}

function dataChannel(evt) {
  receiveChannel = evt.channel;
  receiveChannel.onmessage = handleReceiveMessage;
  receiveChannel.onopen = handleOpenChannel;
}

function registerSendButton() {
  let sendButton = document.getElementById('send');
  sendButton.onclick = () => {
    sendChannel.send(document.getElementById('input').value)
  };
}

async function client() {
  let pc = new RTCPeerConnection(config);
  sendChannel = pc.createDataChannel('sendChannel');
  iceCandidate(pc);
  pc.onicecandidate = onIceCandidate(undefined);
  sendChannel.onopen = open;
  registerSendButton();
  pc.oniceconnectionstatechange = (evt) => {
    console.log('connection state change',pc.iceConnectionState);
  };
  pc.ondatachannel = dataChannel;
  let offer = await pc.createOffer();
  console.log('creating offer', offer);
  await pc.setLocalDescription(offer);
  signallingConnection.send(formatMessage('request', offer));
  let message = await incomingMessage('response');
  await pc.setRemoteDescription(message.data);
}

const clients = {};

function createRTCPeerConnection(config) {
  const pc = new RTCPeerConnetion(config);

}

async function server() {
  let i = 0;
  while (i < 5) {
    i++;
    let message = await incomingMessage('request');
    let pc = new RTCPeerConnection(config);
    sendChannel = pc.createDataChannel('sendChannel');
    sendChannel.onopen = open;
    registerSendButton();
    iceCandidate(pc);
    pc.onicecandidate = onIceCandidate(message.from);
    pc.oniceconnectionstatechange = (evt) => {
      console.log('connection state change',pc.iceConnectionState);
    };
    pc.ondatachannel = dataChannel;
    console.log('message', message);
    await pc.setRemoteDescription(message.data);
    let answer = await pc.createAnswer();
    console.log('answer', answer);
    await pc.setLocalDescription(answer);
    signallingConnection.send(formatMessage('response', answer, message.from));
  }
}
