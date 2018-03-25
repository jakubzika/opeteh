<a name="Client"></a>

## Client
**Kind**: global class  

* [Client](#Client)
    * [new Client(signallingServerURL, [iceServers])](#new_Client_new)
    * [.connection()](#Client+connection) ⇒ <code>promise</code>
    * [.receive([from], [customType])](#Client+receive) ⇒ <code>promise.&lt;object&gt;</code>
    * [.send(data, to, [customType])](#Client+send)
    * [.disconnect()](#Client+disconnect)
    * [.connect(room, info)](#Client+connect) ⇒ <code>promise</code>

<a name="new_Client_new"></a>

### new Client(signallingServerURL, [iceServers])
Creates new instance of Client


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| signallingServerURL | <code>string</code> |  | url of signalling server which allows clients to connect, server must use same signalling server |
| [iceServers] | <code>Array.&lt;object&gt;</code> | <code>defualt ICE servers</code> | array of public ICE servers, if null uses default ones |

<a name="Client+connection"></a>

### client.connection() ⇒ <code>promise</code>
Returns promise which gets resolved when client has connected

**Kind**: instance method of [<code>Client</code>](#Client)  
<a name="Client+receive"></a>

### client.receive([from], [customType]) ⇒ <code>promise.&lt;object&gt;</code>
Returns promise which gets fulfilled when client receives message

**Kind**: instance method of [<code>Client</code>](#Client)  
**Returns**: <code>promise.&lt;object&gt;</code> - contains received message  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [from] | <code>clientId</code> \| <code>Array.&lt;clientId&gt;</code> \| <code>null</code> | <code></code> | waits for message from specified clients/server |
| [customType] | <code>string</code> \| <code>null</code> | <code>null</code> | wait for specific type of message, if null waits for any type |

<a name="Client+send"></a>

### client.send(data, to, [customType])
Sends message to specified clients(including server)Recipients can be specified in `to` param

**Kind**: instance method of [<code>Client</code>](#Client)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| data | <code>object</code> \| <code>string</code> |  | data to send |
| to | <code>clientId</code> \| <code>Array.&lt;clientId&gt;</code> \| <code>null</code> |  | can be client id or TYPE.SERVER or TYPE.BROADCAST |
| [customType] | <code>string</code> \| <code>null</code> | <code>null</code> | info for receiving side to specify what kind of message it is sending, if null sends message without custom type |

<a name="Client+disconnect"></a>

### client.disconnect()
Disconnects client from server

**Kind**: instance method of [<code>Client</code>](#Client)  
<a name="Client+connect"></a>

### client.connect(room, info) ⇒ <code>promise</code>
Connects the client to server

**Kind**: instance method of [<code>Client</code>](#Client)  
**Returns**: <code>promise</code> - is fulfilled when client is connected to server  

| Param | Type | Description |
| --- | --- | --- |
| room | <code>string</code> | room id given by server to which client will attempt to connect |
| info | <code>object</code> | info about the client which is broadcasted to everyone who is connected |

