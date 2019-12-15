/* eslint-disable no-console */
const { StringDecoder } = require('string_decoder');
const http = require('http');
const url = require('url');
const routes = require('./routes');

const server = {};
const parseJsonToObject = (str) => {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch (err) {
    return {};
  }
};

server.unifiedServer = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname.replace(/^\/+|\/+$/g, '');
  const queryStringObject = parsedUrl.query;
  const method = req.method.toLowerCase();
  const { headers } = req;
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', (data) => {
    buffer += decoder.write(data);
  });
  req.on('end', () => {
    buffer += decoder.end();
    const chosenHandler = routes[path] || routes.notFound;
    const data = {
      path,
      queryStringObject,
      method,
      headers,
      payload: {
        ...parseJsonToObject(buffer),
        ...queryStringObject,
      },
    };
    chosenHandler(data, (statusCode = 200, payload = {}) => {
      const payloadString = JSON.stringify(payload);
      res.setHeader('Content-type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.writeHead(statusCode);
      res.end(payloadString);
    });
  });
};

server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res);
});

server.init = () => {
  server.httpServer.listen(process.env.port || 3001, () => console.log(`server is listenning on port ${process.env.port || 3001}`));
};

module.exports = server;
