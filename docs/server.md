## Classes

<dl>
<dt><a href="#Server">Server</a></dt>
<dd><p>Server library</p>
</dd>
</dl>

## Members

<dl>
<dt><a href="#room">room</a> : <code>string</code></dt>
<dd><p>room id which is used for clients to connect to server</p>
</dd>
</dl>

<a name="Server"></a>

## Server
Server library

**Kind**: global class  

* [Server](#Server)
    * [new Server(signallingServerURL, [iceServers], maxConnections)](#new_Server_new)
    * [.activeClients](#Server+activeClients) ⇒ <code>number</code>
    * [.clientsInfo](#Server+clientsInfo) ⇒ <code>object</code>
    * [.initialization()](#Server+initialization) ⇒ <code>promise.&lt;string&gt;</code>
    * [.newClient()](#Server+newClient) ⇒ <code>promise.&lt;clientId&gt;</code>
    * [.clientInfo(from)](#Server+clientInfo)
    * [.receive([from], [customType])](#Server+receive) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.send(data, to, [customType])](#Server+send)
    * [.disconnect(clientId)](#Server+disconnect)
    * [.listen()](#Server+listen) ⇒ <code>promise</code>

<a name="new_Server_new"></a>

### new Server(signallingServerURL, [iceServers], maxConnections)
Creates new instance of Server


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| signallingServerURL | <code>string</code> |  | url of signalling server which allows clients to connect, client must use same signalling server |
| [iceServers] | <code>Array.&lt;object&gt;</code> | <code>defualt ICE servers</code> | array of public ICE servers, if null uses default ones |
| maxConnections | <code>number</code> |  | maximum number of connections |

<a name="Server+activeClients"></a>

### server.activeClients ⇒ <code>number</code>
**Kind**: instance property of [<code>Server</code>](#Server)  
**Returns**: <code>number</code> - number of connected clients  
<a name="Server+clientsInfo"></a>

### server.clientsInfo ⇒ <code>object</code>
**Kind**: instance property of [<code>Server</code>](#Server)  
**Returns**: <code>object</code> - object containing connected clients and their info  
<a name="Server+initialization"></a>

### server.initialization() ⇒ <code>promise.&lt;string&gt;</code>
Returns promise which gets fulfilled when server has finished initialization handshake with signalling serverServer is now in state in which it can accept incoming connections

**Kind**: instance method of [<code>Server</code>](#Server)  
**Returns**: <code>promise.&lt;string&gt;</code> - Contains room id obtained from signalling server  
<a name="Server+newClient"></a>

### server.newClient() ⇒ <code>promise.&lt;clientId&gt;</code>
Returns promise which gets fulfilled when new client has connected to server

**Kind**: instance method of [<code>Server</code>](#Server)  
**Returns**: <code>promise.&lt;clientId&gt;</code> - Contains clientm id obtained from signalling server  
<a name="Server+clientInfo"></a>

### server.clientInfo(from)
Returns promise which gets fullfiled when server receives info message from client

**Kind**: instance method of [<code>Server</code>](#Server)  

| Param | Type | Description |
| --- | --- | --- |
| from | <code>promise.&lt;object&gt;</code> | message object with client info |

<a name="Server+receive"></a>

### server.receive([from], [customType]) ⇒ <code>Promise.&lt;object&gt;</code>
Returns promise which waits for message from specified clients in `to` parameter

**Kind**: instance method of [<code>Server</code>](#Server)  
**Returns**: <code>Promise.&lt;object&gt;</code> - contains received message from client/s  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [from] | <code>clientId</code> \| <code>Array.&lt;clientId&gt;</code> \| <code>null</code> | <code></code> | from who to receive message, if null waits for message from anyone |
| [customType] | <code>string</code> \| <code>null</code> | <code>null</code> | wait for specific type of message, if null waits for any type |

<a name="Server+send"></a>

### server.send(data, to, [customType])
Sends message to specified clients

**Kind**: instance method of [<code>Server</code>](#Server)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| data | <code>object</code> |  |  |
| to | <code>clientId</code> \| <code>Array.&lt;clientId&gt;</code> \| <code>null</code> |  | can be single TYPE.BROADCAST or client id or array of user id to which to send the message |
| [customType] | <code>string</code> \| <code>null</code> | <code>null</code> | info for receiving side to specify what kind of message it is sending, if null sends message without custom type |

<a name="Server+disconnect"></a>

### server.disconnect(clientId)
Disconnects client from server

**Kind**: instance method of [<code>Server</code>](#Server)  

| Param | Type |
| --- | --- |
| clientId | <code>clientId</code> | 

<a name="Server+listen"></a>

### server.listen() ⇒ <code>promise</code>
Initializes and starts the serverAccepts incoming connections

**Kind**: instance method of [<code>Server</code>](#Server)  
**Returns**: <code>promise</code> - gets fulfilled when maximum number of clients is reached  
<a name="room"></a>

## room : <code>string</code>
room id which is used for clients to connect to server

**Kind**: global variable  
