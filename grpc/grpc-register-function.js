module.exports = function(RED) {
	"use strict";
    var utils = require('../utils/utils');

	function getGRPCServer(node, config, protoFunctions, callback) {
		if (!server) {
			let serverConf = RED.nodes.getNode(config.server);
			createGRPCServer(serverConf);
		}
		callback(protoFunctions);
	}

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
                var methodeName = utils.getMethodeName(config.service, config.method);
                server.protoFunctions[methodeName] = function(call, callback) {
                    node.send({
                        call : call,
                        callback : callback,
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