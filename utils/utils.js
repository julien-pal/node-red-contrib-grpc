'use strict';
var fs = require('fs');
var os = require('os');

function tempFile (name = 'temp_file', data = '', encoding = 'utf8') {
    try {
        var dirName = `${os.tmpdir()}/foobar-`;
        dirName = fs.mkdtempSync(dirName);
        var file_name = `${dirName}/${name}`
        fs.writeFileSync(file_name, data, encoding);
        return file_name;
    } catch (err) {
        node.error("tempFile - " + err);
        console.log(err);
    }
}

function getMethodName(service, method) {
    return service + "_" + method + "_callback";
}


module.exports = {
    tempFile: tempFile,
    getMethodName: getMethodName
}