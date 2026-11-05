const fs = require('fs');
const http = require('http');
const https = require('https');

function isHttpsEnabled(value) {
  return String(value).trim().toLowerCase() !== 'false';
}

function createServer(app, useHttps) {
  if (!useHttps) {
    return http.createServer(app);
  }

  const sslOptions = {
    key: fs.readFileSync('./certs/localhost-key.pem'),
    cert: fs.readFileSync('./certs/localhost.pem'),
  };
  return https.createServer(sslOptions, app);
}

module.exports = { createServer, isHttpsEnabled };