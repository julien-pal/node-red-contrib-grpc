module.exports = function(RED) {
	"use strict";
	
	let grpc = require("grpc");
	var protoLoader = require("@grpc/proto-loader");
	var fs = require('fs')
	var os = require('os')
	var server;
	var protoFunctions = {};
	
	
   
	function getMethodeName(service, method) {
		return service + "_" + method + "_callback";
	}

	function generateFunction(service, method, methodes) {
		console.log("functions", methodes);
		var methodeName = getMethodeName(service, method);
		var body = 'console.log("Calling '+ service + '_' + method + '");';
		body +=  'console.log("this", this);';
		body += 'if (this["'+ methodeName +'"]){ this["'+ methodeName +'"](arguments[0]) }';
		var func = new Function('call', body);
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
        console.log("serverConf", serverConf)
        
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
				var methodeName = getMethodeName(config.service, config.method);
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
    	
	/****************************** Register *******************************/	
	RED.nodes.registerType("grpc-register-function",gRpcRegisterFuctionNode);
};