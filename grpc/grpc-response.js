module.exports = function(RED) {
	'use strict';
	
	let grpc = require("@grpc/grpc-js");
	
	function gRpcResponseNode(config) {
        var node = this;
		RED.nodes.createNode(node, config);

		node.on("input", function(msg) {
			try {				
				if (!msg.call) {
					node.error('Error, no call in message');
					node.status({fill:"red",shape:"dot",text:"no call in msg"});
				} else {
					if (msg.err) {
                        if (msg.callback) {
                            msg.callback(msg.err);
                        } else {
                            msg.call.emmit('error', msg.err);
                            msg.end();
                        }
					} else {
                        if (msg.callback) {
                            msg.callback(null, msg.payload);
                        } else {
							if (Array.isArray(msg.payload)) {
								for (var i in msg.payload) {
									msg.call.write(msg.payload[i]);
								}
							} else {
								msg.call.write(msg.payload);
							}

                        }
					}
				}		 	
			} catch (err) {
                console.log("Error - gRpcResponseNode - onInput", err);
				node.error(err);
			}						
		});
		
		node.on("error", function(error) {
			node.error("gRpcResponseNode Error - " + error);
        });
    }

	RED.nodes.registerType("grpc-response",gRpcResponseNode);
};