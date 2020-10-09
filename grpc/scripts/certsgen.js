function test(){
  console.log("worked");
}

var length = 2048;
var caName = 'self-declared-certificate-authority.org';
var caOrgName = 'Self-Declared CA';

function caCertGen (){
  var pki = forge.pki;
  var cakeys = pki.rsa.generateKeyPair(length);
  var cacert = pki.createCertificate();
  cacert.publicKey = cakeys.publicKey;

  cacert.serialNumber = '01';
  cacert.validity.notBefore = new Date();
  cacert.validity.notAfter = new Date();
  cacert.validity.notAfter.setFullYear(cacert.validity.notBefore.getFullYear() + 1);
  var attrs = [{
    name: 'commonName',
    value: caName
  }, {
    name: 'countryName',
    value: 'CA'
  }, {
    shortName: 'ST',
    value: 'BC'
  }, {
    name: 'localityName',
    value: 'Vancouver'
  }, {
    name: 'organizationName',
    value: caOrgName
  }, {
    shortName: 'OU',
    value: 'CA Dept.'
  }];
  cacert.setSubject(attrs);
  cacert.setIssuer(attrs);
  cacert.setExtensions([{
    name: 'basicConstraints',
    cA: true
  }, {
    name: 'keyUsage',
    keyCertSign: true,
    digitalSignature: true,
    nonRepudiation: true,
    keyEncipherment: true,
    dataEncipherment: true
  }, {
    name: 'extKeyUsage',
    serverAuth: true,
    clientAuth: true,
    codeSigning: true,
    emailProtection: true,
    timeStamping: true
  }, {
    name: 'nsCertType',
    client: true,
    server: true,
    email: true,
    objsign: true,
    sslCA: true,
    emailCA: true,
    objCA: true
  }]);

  cacert.sign(cakeys.privateKey);

  return {cacert: pki.certificateToPem(cacert), caPrivateKey: toPem(cakeys.privateKey)};
}

function certGen(caCert, caPrivateKey, commonName, orgName){
  var pki = forge.pki;
  var keys = pki.rsa.generateKeyPair(length);
  var csr = csrGen(keys, commonName, orgName);

  var cert = pki.createCertificate();
  cert.publicKey = csr.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
  cert.setSubject(csr.subject.attributes);
  cert.setIssuer(pki.certificateFromPem(caCert).subject.attributes);
  cert.sign(fromPem(caPrivateKey));
  
  return {cert: pki.certificateToPem(cert), privateKey: toPem(keys.privateKey)};
}

function csrGen(keys, commonName, orgName){
  var pki = forge.pki;
  var csr = pki.createCertificationRequest();
  csr.publicKey = keys.publicKey;
  csr.setSubject([{
    name: 'commonName',
    value: commonName
  }, {
    name: 'countryName',
    value: 'CA'
  }, {
    shortName: 'ST',
    value: 'BC'
  }, {
    name: 'localityName',
    value: 'Vancouver'
  }, {
    name: 'organizationName',
    value: orgName
  }, {
    shortName: 'OU',
    value: "IT"
  }]);

  // sign certification request
  csr.sign(keys.privateKey);

  return csr;
}

function toPem(key){
  return forge.pki.privateKeyToPem(key);
}

function fromPem(pem){
  return forge.pki.privateKeyFromPem(pem);
}