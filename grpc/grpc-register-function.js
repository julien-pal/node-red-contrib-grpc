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
		var methodeName = getMethodeName(service, method);
		var body = 'console.log("Calling '+ service + '_' + method + '");';
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

        // Parse the proto file
        var services = proto;
        if (serverConf.protoPackage) {
            services = proto[serverConf.protoPackage];
        }
        var servicesNames = Object.keys(services); 
        // For each service
		for(var i in servicesNames) {
            var methodes = Object.keys(services[servicesNames[i]].service);
            // For each method of the service
			for(var j in methodes) {
				protoFunctions[methodes[j]] = generateFunction(servicesNames[i], methodes[j], protoFunctions);
            }
            // Add stub methodes for each methods and services declared in the proto file
            server.addService(services[servicesNames[i]].service, protoFunctions)		
		}
		server.bind(serverConf.server + ":" + serverConf.port, grpc.ServerCredentials.createInsecure());
		server.start();
		console.log("### GRPC Server started ### ");
		return server;		
	}

	function getGRPCServer(node, config, protoFunctions, callback) {
		if (!server) {
			let serverConf = RED.nodes.getNode(config.server);
			createGRPCServer(serverConf);
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
				node.status({fill:"green",shape:"dot",text:"connected"});
				var methodeName = getMethodeName(config.service, config.method);
				protoFunctions[methodeName] = function(call, callback) {
					node.send({
						call : call,
						callback : callback,
						payload: call.request
					});
				};
			} catch(err) {
				node.error("gRpcRegisterFunctionNode - getGRPCServrt" + err);
			}
		});
				
		node.on("error", function(error) {
			node.error("gRpcRegisterFuctionNode Error - " + error);
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