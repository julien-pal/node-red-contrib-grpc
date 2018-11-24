module.exports = function (RED) {
    'use strict'
    let grpc = require("grpc");
    let utils = require('../utils/utils');
	var protoLoader = require("@grpc/proto-loader");

    function gRpcServerNode(config) {
        var node = this;
        RED.nodes.createNode(node, config);
        node.server = "0.0.0.0";
        node.port = config.port || 5001;
        node.name = config.name;
        node.protoFile = config.protoFile;

        // read the package name from the protoFile
        var packageName = config.protoFile.match(new RegExp(/package ([^;]*);/));
        if (packageName && packageName.length == 2) {
            node.protoPackage = packageName[1];
        }

        createGRPCServer(node);
        
        node.on("error", function(error) {
            node.error("gRPC Server Error - " + error);
            console.log(error);
        });
		
        node.on("close", function(done) {
            stopServer(this);
            console.log("### gRPC server stopped ###");
            done();
        });
    }	

    function createGRPCServer(node) {
        try {
            var server = new grpc.Server();
            var protoFunctions = {};
            var fileName =  utils.tempFile('proto.txt', node.protoFile)
			
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
            if (node.protoPackage) {
                services = proto[node.protoPackage];
            }
            var servicesNames = Object.keys(services); 
            // For each service
            for(var i in servicesNames) {
                var methodes = Object.keys(services[servicesNames[i]].service);
                // For each method of the service
                for(var j in methodes) {
                    protoFunctions[methodes[j]] = generateFunction(node, servicesNames[i], methodes[j], protoFunctions);
                }
                // Add stub methodes for each methods and services declared in the proto file
                server.addService(services[servicesNames[i]].service, protoFunctions)		
            }

            server.bind(node.server + ":" + node.port, grpc.ServerCredentials.createInsecure());
            server.start();

            console.log("### GRPC Server started ### ");
            node.protoFunctions = protoFunctions;
            node.grpcServer = server;		
        } catch (err) {
            node.error("createGRPCServer - " + err);
            console.log(err);
        }
    }

    function generateFunction(node, service, method) {
        try {
            var methodeName = utils.getMethodeName(service, method);
            var body = 'console.log("Calling '+ service + '_' + method + '");';
            body += 'if (this["'+ methodeName +'"]){ this["'+ methodeName +'"](arguments[0])}';
            var func = new Function('call', body);
            return func;
        } catch (err) {
            node.error("generateFunction - " + err);
            console.log(err);
        }
        return null;
	}
   
    function stopServer(node) {
        try {
            if (node.grpcServer) {
                node.grpcServer.forceShutdown();
                delete node.grpcServer;
            }
        } catch (err) {
            node.error("stopServer - " + err);
            console.log(err);
        }
	}

    RED.nodes.registerType("grpc-server", gRpcServerNode, {});	
}