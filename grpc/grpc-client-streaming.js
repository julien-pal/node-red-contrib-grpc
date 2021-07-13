module.exports = function (RED) {
    "use strict";
    let grpc = require("@grpc/grpc-js");
    let utils = require('../utils/utils');
    let getByPath = require('lodash.get');
    let fs = require("fs");

    function gClientStreamingNode(config) {
        try {
            var node = this;
            RED.nodes.createNode(node, config);

            // Get the gRPC server from the server config Node
            var serverNode = RED.nodes.getNode(config.server)
            node.on("input", function (msg) {    
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
                        //return;
                    } 
                    else if (!proto[config.service].service[config.method]) {
                        node.status({fill:"red",shape:"dot",text: "Method " + config.method + " not in proto file for service " +  config.service });
                        //return;
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
                        if (!node.client) {
                            // Initialize connection
                            node.client = new proto[config.service](
                                REMOTE_SERVER,
                                credentials || grpc.credentials.createInsecure()
                            );
                            
                            if (!node.client[config.method]) {
                                node.status({fill:"red",shape:"dot",text: "Method " + config.method + " not in proto file"});
                                return;
                            }
                        }
                    }
                    
                    
                    
                    if (!node.call) {
                        // Get Client Stream
                        var call = node.client[config.method](function(error, data) {
                            // Wait for disconnect
                            if (error) {
                                node.status({fill:"red",shape:"dot",text: "Connection to stream " + REMOTE_SERVER + " lost"});
                            } else {
                                node.status({fill:"green",shape:"dot",text: "Connection to stream " + REMOTE_SERVER + " closed"});
                            }
                            msg.payload = data;
                            msg.error = error;
                            node.send(msg);
                            node.call = undefined
                        });
                        // Save reference for next payload and close
                        node.call = call;
                    }
                    if (msg.topic == "close") {
                        node.call.end();
                        return;
                    }
                    node.status({fill:"green",shape:"dot",text: "Connected to " +  REMOTE_SERVER });
                    node.call.write(msg.payload);
                } catch (err) {
                    node.error("onInput" + err);
                    console.log(err);
                }

            });

            node.on("error", function (error) {

                node.error("gClientStreamingNode Error - " + error);
                console.log(error);
            });

            node.on("close", function (done) {
                if (node.call) {
                    node.call.end();
                    delete node.call;
                }
                if (node.client) {
                    grpc.closeClient(node.client)
                    delete node.client;
                    delete node.channel;
                }
                done();
            });
        } catch (err) {
            node.error("gClientStreamingNode" + err);
            console.log(err);
        }
    }
    RED.nodes.registerType("grpc-client-streaming", gClientStreamingNode);
};