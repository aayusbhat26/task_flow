'use strict';

// Single entrypoint for Render's $PORT. Proxies /socket.io to the Socket.IO
// server and everything else to Next.js. Replaces Caddy because exec of the
// copied Caddy binary fails with EPERM on Render's container security policy.

const http = require('http');
const net = require('net');

const PORT = Number(process.env.PORT || 10000);
const WEB = { host: '127.0.0.1', port: Number(process.env.WEB_PORT || 3000) };
const SOCKET = { host: '127.0.0.1', port: Number(process.env.SOCKET_PORT || 3002) };

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'SAMEORIGIN',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(self), microphone=(self), display-capture=(self)',
};

function targetFor(url) {
  return url.startsWith('/socket.io') ? SOCKET : WEB;
}

function requestHeaders(req) {
  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (!HOP_BY_HOP.has(key)) headers[key] = value;
  }
  const remote = req.socket.remoteAddress || '';
  headers['x-forwarded-for'] = headers['x-forwarded-for']
    ? `${headers['x-forwarded-for']}, ${remote}`
    : remote;
  headers['x-forwarded-proto'] = headers['x-forwarded-proto'] || 'https';
  headers['x-forwarded-host'] = headers['x-forwarded-host'] || req.headers.host || '';
  return headers;
}

function responseHeaders(upstreamRes) {
  const headers = {};
  for (const [key, value] of Object.entries(upstreamRes.headers)) {
    if (!HOP_BY_HOP.has(key) && key !== 'server') headers[key] = value;
  }
  return Object.assign(headers, SECURITY_HEADERS);
}

const server = http.createServer((req, res) => {
  const target = targetFor(req.url || '/');
  const upstream = http.request(
    {
      host: target.host,
      port: target.port,
      method: req.method,
      path: req.url,
      headers: requestHeaders(req),
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, responseHeaders(upstreamRes));
      upstreamRes.pipe(res);
    },
  );

  upstream.on('error', (error) => {
    console.error(`[proxy] ${req.method} ${req.url} failed: ${error.message}`);
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain' });
    res.end('Bad gateway');
  });

  req.on('aborted', () => upstream.destroy());
  req.pipe(upstream);
});

server.on('upgrade', (req, socket, head) => {
  const target = targetFor(req.url || '/');
  const upstream = net.connect(target.port, target.host, () => {
    const lines = Object.entries(req.headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\r\n');
    upstream.write(`${req.method} ${req.url} HTTP/1.1\r\n${lines}\r\n\r\n`);
    if (head && head.length) upstream.write(head);
    upstream.pipe(socket);
    socket.pipe(upstream);
  });

  upstream.on('error', (error) => {
    console.error(`[proxy] upgrade ${req.url} failed: ${error.message}`);
    socket.destroy();
  });
  socket.on('error', () => upstream.destroy());
  socket.setTimeout(0);
  socket.setKeepAlive(true, 30000);
});

server.on('clientError', (error, socket) => {
  if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[proxy] listening on ${PORT} -> web:${WEB.port}, socket:${SOCKET.port}`);
});
