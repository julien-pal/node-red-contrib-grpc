module.exports = function(RED) {
	'use strict';
	
	let grpc = require("grpc");
	
	/****************************** gRpc response *******************************/ 
	function gRpcResponseNode(config) {
        var node = this;
		RED.nodes.createNode(node, config);

		node.on("input", function(msg) {
			try {				
				console.log("gRpcResponseNode on input")
				if (!msg.call) {
					node.error('Error, no call in message');
					node.status({fill:"red",shape:"dot",text:"no call in msg"});
				} else {
					if (msg.err) {
						msg.callback(msg.err);
					} else {
						msg.call.write(msg.payload);
						msg.call.end();
					}
				}		 	
			} catch (err) {
				node.error(err);
			}						
		});
		
		node.on("error", function(error) {
			node.error("gRpcResponseNode Error - " + error);
        });
    }

	
	/****************************** Register *******************************/
	RED.nodes.registerType("grpc-response",gRpcResponseNode);
};