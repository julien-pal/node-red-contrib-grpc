module.exports = function(RED) {
	"use strict";
    var utils = require('../utils/utils');

	/****************************** gRpc register function *******************************/
		
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
                server.protoFunctions[methodName] = function(call) {
                    node.send({
                        call : call,
                        payload: call.request
                    });
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
		
        node.on("close", function(done) {
            stopServer();
            console.log("gRPC server stopped");
            done();
        });
    }
    	
	/****************************** Register *******************************/	
	RED.nodes.registerType("grpc-register-function",gRpcRegisterFuctionNode);
};