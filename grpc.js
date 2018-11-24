module.exports = function(RED) {
	"use strict";
	
	let grpc = require("grpc");
	var protoLoader = require("@grpc/proto-loader");
	var fs = require('fs')
	var os = require('os')
	var server;
	var protoFunctions = {};
	
	function gRpcServerNode(config) {
		var node = this;
        RED.nodes.createNode(node, config);
        node.server = "0.0.0.0";
        node.port = config.port || 5001;
        node.name = config.name;
		node.protoFile = config.protoFile;

		// read the package name from the protoFile
		var package = config.protoFile.match('package ([^;]*);');
		if (package && package.length == 2) {
			console.log("Package found", package);
			node.protoPackage = package[2];
		}
	}	
   
	function getMethodeName(service, method) {
		return service + "_" + method + "_callback";
	}

	function generateFunction(service, method, methodes) {
		console.log("functions", methodes);
		var methodeName = utils.getMethodeName(service, method);
		var body = 'console.log("Calling '+ service + '_' + method + '");';
		body +=  'console.log("this", this);';
		body += 'if (this["'+ methodeName +'"]){ this["'+ methodeName +'"](arguments) }';
		var func = new Function(body);
		func.bind(methodes);
		return func;
	}

	function stopServer() {
		if (server) {
			server.stop();
			server = null;
		}
	}

	function createGRPCServer(serverConf) {
		console.log("##createGRPCServer##")
		server = new grpc.Server();
		var fileName =  tempFile('proto.txt', serverConf.protoFile)
			
		let proto = grpc.loadPackageDefinition(
			protoLoader.loadSync(fileName, {
				keepCase: true,
				longs: String,
				enums: String,
				defaults: true,
				oneofs: true
			})
		);

		var services = Object.keys(proto[serverConf.protoPackage]); 
		for(var i in services) {
			var methodes = Object.keys(proto[serverConf.protoPackage][services[i]].service);
			for(var j in methodes) {
				protoFunctions[methodes[j]] = generateFunction(services[i], methodes[j], protoFunctions);
			}
		}
		console.log("protoFunctions", protoFunctions);
		server.addService(proto.example.Chat.service, protoFunctions)		
		server.bind(serverConf.server + ":" + serverConf.port, grpc.ServerCredentials.createInsecure());
		server.start();
		console.log("Server started");
		return server;		
	}

	function getGRPCServer(node, config, protoFunctions, callback) {
		if (!server) {
			console.log("PAS DE SERVER ")
			let serverConf = RED.nodes.getNode(config.server);
			createGRPCServer(serverConf);
		} else {
			console.log("SERVER ")
		}
		callback(protoFunctions);
	}

	function tempFile (name = 'temp_file', data = '', encoding = 'utf8') {
		const fs = require('fs');
		const os = require('os');   
	
		var dirName = `${os.tmpdir()}/foobar-`;
		dirName = fs.mkdtempSync(dirName);
		var file_name = `${dirName}/${name}`
		fs.writeFileSync(file_name, data, encoding);
		return file_name;
	}

	
	
	/****************************** gRpc register function *******************************/
		
    function gRpcRegisterFuctionNode(config) {
        var node = this;
		RED.nodes.createNode(node, config);
		node.status({fill:"grey",shape:"ring",text:"connecting"});
		getGRPCServer(node, config, protoFunctions,  function(protoFunctions) {
			try {
				console.log("getGRPCServer", protoFunctions);				
				node.status({fill:"green",shape:"dot",text:"connected"});
				var methodeName = utils.getMethodeName(config.service, config.method);
				protoFunctions[methodeName] = function(call, callback) {
					console.log("toto")
					node.send({
						call : call,
						callback : callback,
						payload: call.request
					});
				};
				console.log("getGRPCServer", protoFunctions);
			} catch(err) {
				node.error(err);
			}
		});
				
		node.on("error", function(error) {
			node.error("gRpcRegisterFuctionNode Error - " + error);
        });
		
        node.on("close", function(done) {
			stopServer();
            done();
        });
	}
	
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
	RED.nodes.registerType("grpc-server", gRpcServerNode, {});	
	RED.nodes.registerType("grpc-register-function",gRpcRegisterFuctionNode);
	RED.nodes.registerType("grpc-response",gRpcResponseNode);
};