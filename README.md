
# node-red-contrib-grpc

## The all in one gRPC contribution package for Node-RED.

[Node-RED][1] contribution package for [gRPC][2]

Based on [gRPC][2] 

Provides server and client side implementation of gRPC.


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

This package provides a node (grpc-call) for a client side implementation of a gRPC service.
It will connect to a gRPC server according to the server configuration (grpc-server node) and call the method of the service configured on the node.

[1]:https://nodered.org
[2]:https://www.npmjs.com/package/grpc
