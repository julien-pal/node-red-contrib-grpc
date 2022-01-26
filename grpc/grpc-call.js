module.exports = function (RED) {
    "use strict";
    let grpc = require("@grpc/grpc-js");
    let getByPath = require('lodash.get');
    let utils = require('../utils/utils');
    let fs = require("fs");

    function gRpcCallNode(config) {
        try {
            var node = this;
            RED.nodes.createNode(node, config);

            // Get the gRPC server from the server config Node
            var serverNode = RED.nodes.getNode(config.server)
            node.on("input", function (msg) {
                // overring config with msg content
                config.service = config.service || msg.service;
                config.method = config.method || msg.method;
                
                try {
                    const REMOTE_SERVER = serverNode.server + ":" + serverNode.port;
                    //Create gRPC client
                    var proto =  serverNode.proto;
                    if (serverNode.protoPackage) {
                        proto = getByPath(serverNode.proto, serverNode.protoPackage);
                    }
                    if (!proto[config.service]) {
                        node.status({fill:"red",shape:"dot",text: "Service " + config.service + " not in proto file"});
                    } else if (!proto[config.service].service[config.method]) {
                        node.status({fill:"red",shape:"dot",text: "Method " + config.method + " not in proto file for service " +  config.service });
                    } else {
                        node.status({});
                        node.chain = config.chain;
                        node.key = config.key;

                        let credentials;
                        if (serverNode.ssl){
                            if (!serverNode.selfsigned){
                                credentials = grpc.credentials.createSsl();
                            } else if (serverNode.caPath){
                                if (serverNode.mutualTls){
                                    var chain =  utils.tempFile('cchain.txt', node.chain)
                                    var key =  utils.tempFile('ckey.txt', node.key)
                        
                                    credentials = grpc.credentials.createSsl(
                                        fs.readFileSync(serverNode.caPath),
                                        fs.readFileSync(key),
                                        fs.readFileSync(chain),
                                    );
                                } else {
                                    credentials = grpc.credentials.createSsl(
                                        fs.readFileSync(serverNode.caPath),
                                    );
                                }
                            }
                        }

                        if (node.client) {
                            grpc.closeClient(node.client)
                        }

                        node.client = new proto[config.service](
                            REMOTE_SERVER,
                            credentials || grpc.credentials.createInsecure()
                        );
                    }

                    let metadata = new grpc.Metadata();
                    if (typeof msg.metadata === 'object'){
                        Object.keys(msg.metadata).forEach(key => {
                            try {
                                metadata.add(key, JSON.stringify(msg.metadata[key]));
                            } catch (e){
                                node.error(e);
                            }
                        });
                    }

                    if (node.client) {
                        if (!node.client[config.method]) {
                            node.status({fill:"red",shape:"dot",text: "Method " + config.method + " not in proto file"});
                        } else {
                            node.status({});
                            if (proto[config.service].service[config.method].responseStream) {
                                node.channel = node.client[config.method](msg.payload, metadata);
                                node.channel.on("data", function (data) {
                                    msg.payload = data;
                                    node.send(msg);
                                });

                                node.channel.on("error",function (error) {
                                    msg.error = error;
                                    node.send(msg);
                                });

                            } else {
                                node.client[config.method](msg.payload, metadata, function(error, data) {
                                    msg.payload = data;
                                    msg.error = error;
                                    node.send(msg);
                                })
                            }
                        }
                    }

                } catch (err) {
                    node.log("onInput" + err);
                    console.log(err);
                }

            });

            node.on("error", function (error) {
                node.error("gRpcCallNode Error - " + error);
                console.log(error);
            });

            node.on("close", function (done) {
                if (node.client) {
                    grpc.closeClient(node.client)
                    delete node.client;
                    delete node.channel
                }
                done();
            });
        } catch (err) {
            node.error("gRpcCallNode" + err);
            console.log(err);
        }
    }

    RED.nodes.registerType("grpc-call", gRpcCallNode);
};
