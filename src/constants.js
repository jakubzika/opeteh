
export const STATUS = {
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
};

export const TYPE = {
  SERVER: 'SERVER',
  CLIENT: 'CLIENT',
  BROADCAST: 'BROADCAST',
};

export const NETWORK_CHANGE = {
  NEW_CONNECTION: 'NEW_CONNECTION',
  CLIENT_DISCONNECTED: 'CLIENT_DISCONNECTED',
};

export const MESSAGE_TYPES = {
  NEW_CONNECTION: 'NEW_CONNECTION',
  CLIENT_DISCONNECTED: 'CLIENT_DISCONNECTED',
  NEW_CLIENT: '',
  DATA: 'DATA',
  OPEN: 'OPEN',
  CLIENT_INFO: 'CLIENT_INFO',
  NETWORK_INFO: 'NETWORK_INFO',
}

export const SIGNALLING_MESSAGE_TYPES = {
};


export const ICE_SERVERS = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: 'stun:stun.services.mozilla.org'
    }
  ]
};