module.exports = function(RED) {
	"use strict";
    var utils = require('../utils/utils');

    function gRpcRegisterFuctionNode(config) {
        var node = this;
		RED.nodes.createNode(node, config);
        node.status({fill:"grey",shape:"ring",text:"connecting"});

        try {
            // Get the gRPC server from the server config Node
            var server = RED.nodes.getNode(config.server)
            if (server) {
                node.status({fill:"green",shape:"dot",text:"connected"});
                var methodName = utils.getMethodName(config.service, config.method);
                server.protoFunctions[methodName] = function() {
                    var message = {};
                    var args = null

                    if (arguments && arguments.length == 1) {
                        args = arguments [0];
                    }
                    // Stream (call) or message (call and callback)
                    if (args && args.length == 2) {
                        message = {
                            call : args[0],
                            callback: args[1],
                            payload: args[0].request
                        }
                    } else {
                        message = {
                            call : args[0],
                            payload: args[0].request
                        }
                    }
                    node.send(message);
                };
            }
        } catch(err) {
            node.error("gRpcRegisterFunctionNode - getGRPCServrt" + err);
            node.status({fill:"red",shape:"dot",text:"error"});
        }
				
        node.on("error", function(error) {
            node.error("gRpcRegisterFuctionNode Error - " + error);
            console.log(error);
        });
    }

    RED.nodes.registerType("grpc-register-function",gRpcRegisterFuctionNode);
};