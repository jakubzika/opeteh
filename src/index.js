import Client from './client';
import Server from './server';
import Opeteh from './opeteh';
// import Old from './old';

let signallingServerURL = 'ws://localhost:8002/';
let iceServerConfig = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: 'stun:stun.services.mozilla.org'
    }
  ]
};

function isServer() {
  const server = new Server(signallingServerURL, iceServerConfig, 8);
  server.listen();
  let sendButton = document.getElementById('send');
  sendButton.onclick = () => {
    server.send('message',document.getElementById('input').value, Object.keys(server.clients)[0]);
  };
}

async function isClient() {
  const client = new Client(signallingServerURL, iceServerConfig);
  client.onopen = () => {
  };
  let connectButton = document.getElementById('connect');
  connectButton.onclick = () => {
    client.connect(document.getElementById('room').value);
  };
  let sendButton = document.getElementById('send');
  sendButton.onclick = () => {
    client.send('message',document.getElementById('input').value);
  };
}

if (location.hash === '#s') {
  isServer();
} else {
  isClient();
}