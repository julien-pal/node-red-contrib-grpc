module.exports = function (RED) {
    'use strict'

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
            console.log("Package found", packageName);
            console.log("Package", packageName[1]);
            node.protoPackage = packageName[1];
        }
    }	

    RED.nodes.registerType("grpc-server", gRpcServerNode, {});	
}