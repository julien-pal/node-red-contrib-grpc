
# node-red-contrib-grpc

## The all in one gRPC contribution package for Node-RED.

[Node-RED][1] contribution package for [gRPC][2]

Based on [gRPC][2] 

Provides server and client side implementation of gRPC.

## Sample flow

    [{"id":"382dc006.1c745","type":"tab","label":"Flow 4","disabled":false,"info":""},{"id":"3ba93c69.fabff4","type":"grpc-register-function","z":"382dc006.1c745","name":"sayHello","server":"8c8e26a0.4a01e8","service":"Hello","method":"sayHello","x":100,"y":80,"wires":[["fd1f689f.bd3e78"]]},{"id":"b590389d.0b5f18","type":"grpc-response","z":"382dc006.1c745","name":"","x":600,"y":80,"wires":[]},{"id":"fd1f689f.bd3e78","type":"function","z":"382dc006.1c745","name":"sayHello","func":"name = msg.payload.name\nmsg.payload = { \"message\": \"Hello \" + name + \"!\" }\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","x":320,"y":80,"wires":[["b590389d.0b5f18"]]},{"id":"f4d9fd8.d9123","type":"grpc-call","z":"382dc006.1c745","name":"","server":"61ff2500.2e1d6c","service":"Hello","method":"sayHello","chain":"","key":"","x":550,"y":220,"wires":[["aa08bd2b.97c5b"]]},{"id":"1b4bbcda.9255a3","type":"inject","z":"382dc006.1c745","name":"","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"str","x":100,"y":220,"wires":[["83f9083f.6e5248"]]},{"id":"aa08bd2b.97c5b","type":"debug","z":"382dc006.1c745","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","statusVal":"","statusType":"auto","x":750,"y":220,"wires":[]},{"id":"83f9083f.6e5248","type":"function","z":"382dc006.1c745","name":"supply name","func":"msg.payload = {name: \"YOU\"}\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","x":300,"y":220,"wires":[["f4d9fd8.d9123"]]},{"id":"8c8e26a0.4a01e8","type":"grpc-server","port":"50081","name":"LocalHelloWorldRPC","server":"","protoFile":"syntax = \"proto3\";\n\npackage example;\n\nservice Hello {\n rpc sayHello (HelloRequest) returns (HelloResponse) {}\n}\n\nmessage HelloRequest {\n string name = 1;\n}\n\nmessage HelloResponse {\n string message = 1;\n}\n","ca":"","chain":"","key":"","mutualTls":false,"localServer":true},{"id":"61ff2500.2e1d6c","type":"grpc-server","port":"50081","name":"RemoteHelloWorldRPC","server":"","protoFile":"syntax = \"proto3\";\n\npackage example;\n\nservice Hello {\n rpc sayHello (HelloRequest) returns (HelloResponse) {}\n}\n\nmessage HelloRequest {\n string name = 1;\n}\n\nmessage HelloResponse {\n string message = 1;\n}\n","ca":"","chain":"","key":"","mutualTls":false,"localServer":false}]

## Install

Run the following command in the root directory of your Node-RED install

    npm install node-red-contrib-grpc

Run the following command for global install

    npm install -g node-red-contrib-grpc

# Server Side

This package provides some nodes (grpc-register-function, grpc-response and grpc-server) for a server side implementation of a gRPC service.
It will start a gRPC server according to the server configuration (grpc-server node) and register services methods (with grpc-register-function node) and provide a response to your gRPC client (with grpc-response node).

## grpc-server node

This node will be use to configure a local gRPC server with the following parameters :   
* server ip : 0.0.0.0 (not editable since it's a local server)
* server port : default value 5001;
* protoFile : proto buffer definition of the services to provide;

## grpc-register-function node

This node will be use to provide a service method implementation.
The node requires the following configuration :   
* server: a grpc-server configuration node
* service: the service name we will implement
* method: the methode name of the service we will implement

Each time a client call the specified method a the specified service, this node will send a msg containing:   
* payload : request parameters
* call : the call which we will answer to 


## grpc-response node

This node will be use to send the reponse to the gRPC client that called our service.
It will send the content of the msg.payload using the msg.call to write the data.

# Client Side

## grpc-call node
This package provides a node (grpc-call) for a client side implementation of a gRPC service.
It will connect to a gRPC server according to the server configuration (grpc-server node) and call the method of the service configured on the node.

## grpc-client-streaming node

It will connect to a gRPC server according to the server configuration (grpc-server node) and call the method of the service configured on the node.
This node opens a gRPC request, expects the streaming content at payload and returns the response if the stream is closed. 
The client streaming channel will be opened on the first payload that arrives. 
Further payloads use the existing client stream. If you send a message with the topic 'close'.
The client stream will close and publish the result of the server response. 
If any error occurs the connection will be closed and a message with the error property set will be published.

[1]:https://nodered.org
[2]:https://www.npmjs.com/package/grpc
