# Opeteh 

> current version 0.2.0

JavaScript library which uses webRTC protocol to connect different browser instances.

Server is needed only to initiate connection between different instances.

Needs to be used with [opeteh-server](https://github.com/jakubzika/opeteh-server)

## Requirements

[NodeJS](https://nodejs.org/en/) = 8.9.4 or higher

[Yarn](https://yarnpkg.com/en/docs/install) = 1.3.2 or higher

[opeteh-server](https://github.com/jakubzika/opeteh-server) running on publically accessible address

For testing purposes you can use `opeteth.mooo.com:8802`

## Get started

Install the package into your node js project

```bash
yarn add git+https://github.com/jakubzika/opeteh.git
```

And Import into project

```javascript
import {Client, Server} from 'opeteh';
```

## Simple example

Consider that we have signalling server running at `localhost:8002`

**server.js**

```javascript
import {Server} from 'opeteh';
// create server instance
const server = new Server('ws://localhost:8002', null, 8);
// start to listen for clients
server.listen().then(() => {}); // NOTE: this function is asynchrnous
// display room id when we obtain it
server.initialization()
    .then((room) => {
    	alert(room);
})

async function handleIncomingClients() {
    while(true) {
        // wait for client to connect
		let clientId = await server.newClient();
        // wait for client to give us his info
      	await server.clientInfo(clientId);
        // send to client message with custom type 'hello-message'
        server.send('Its over', clientId, 'hello-message');
        
        //wait for confirmation message from client
        await server.receive(clientId, 'hello-message');
    }
}
```



**client.js**

```javascript
import {Client, constants} from 'opeteh';
// create client instance
const client = new Client('ws://localhost:8002');

async function start(room) {
    // connect to server
    await client.connect(room, {
    	// object containing info about client which is broadcasted to everyone connected
	});
    // wait for hello message from server
    const message = await client.receive(constants.TYPE.SERVER, 'hello-message')
    
    // sned response message to server
    client.send('I have the high ground', constants.TYPE.SERVER, 'hello-message')
}

// physically obtain room id from server and call start
start('890-890')
```



Documentation for [server](https://github.com/jakubzika/opeteh/blob/master/docs/server.md)

Documentation for [client](https://github.com/jakubzika/opeteh/blob/master/docs/client.md)

