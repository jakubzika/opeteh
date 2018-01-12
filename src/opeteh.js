import { forEach } from 'lodash';

import Server from 'server';
import Client from 'client';
import iceServers from 'ice-servers';
import { status, type, networkChange } from 'constants';

const iceConfig = {
  iceServers,
};

const UnsuportedFunctionality = new Error('Server can only accept incoming connections');

class Opeteh {
  constructor(isServer, signallingServer, options) {
    this.type = isServer ? type.SERVER : type.CLIENT;

    this.onmessage = [];
    if(this.type === type.SERVER) {
      this.onclientchange = [];
      this.server = new Server(signallingServer, iceConfig, options.maxConnections);
      this.server.onopen = this.onNewConnection.bind(this);
    } else if (this.type === type.CLIENT) {
      this.client = new Client(signallingServer, iceConfig);
    }
  }

  /*
  client only
   */
  connect(room) {
    if (this.type === CLIENT) {
      this.client.connect(room);
    } else {
     throw UnsuportedFunctionality;
    }
  }

  /*
  server only
   */
  listen() {
    this.server.listen();
  }

  disconnect(clientId = undefined) {
    if (this.type === CLIENT) {
      this.client.close();
    }
    else if(clientId !== undefined && this.type === SERVER){
      this.server.close(clientId)
    }
    else {
      throw new Error.Value
    }
  }

  onNewConnection(id) {
    const clients = Object.keys(this.server.clients);
    this.clients = clients;
    forEach(this.server.clients, (client, clientId) => {
      this.server.send('network', { clients, client: id, type: networkChange.NEW_CONNECTION}, clientId);
    });
    forEach(this.onclientchange, (func, id) => {
      if(typeof func === 'function') {
        func(networkChange.NEW_CONNECTION, id);
        this.onclientchange[id] = null;
      }
    })
  }

  async networkChange() {
    if(this.type === type.CLIENT) {
      const message = await this.client.receive('network');
      return message.client
    } else if (this.type === type.SERVER) {
      return await new Promise((resolve, reject) => {
        this.server.onclientchange.push((id) => {
          resolve(id);
        });
      });
    }
  }

  async receiveMessage(from) {
    if(this.type === type.SERVER) {
      this.server.receive(from)
    } else if (this.type === type.CLIENT) {

    }
  }
}

export default Opeteh;