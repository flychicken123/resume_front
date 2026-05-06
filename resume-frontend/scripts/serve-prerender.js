#!/usr/bin/env node
/**
 * Static production server for HiHired.
 *
 * Unlike `serve -s build`, this preserves prerendered nested HTML files such as
 * /guides/index.html and /guides/<slug>/index.html for no-JS SEO/GEO crawlers,
 * while still falling back to the React SPA shell for app routes.
 */
const fs = require('fs');
const http = require('http');
const path = require('path');
const { URL } = require('url');

const port = Number(process.env.PORT || 3000);
const buildDir = path.join(__dirname, '..', 'build');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

function sendFile(res, filePath) {
  fs.stat(filePath, (statErr, stat) => {
    if (statErr || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const headers = {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Content-Length': stat.size,
    };

    if (ext === '.html') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    } else if (filePath.includes(`${path.sep}static${path.sep}`)) {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    } else {
      headers['Cache-Control'] = 'public, max-age=300';
    }

    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
}

function safeJoin(root, requestPath) {
  const decoded = decodeURIComponent(requestPath);
  const normalized = path.normalize(decoded).replace(/^([/\\])+/, '');
  const filePath = path.join(root, normalized);
  return filePath.startsWith(root) ? filePath : null;
}

function resolveRequest(pathname) {
  const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
  const directPath = safeJoin(buildDir, cleanPath);
  const hasExtension = Boolean(path.extname(cleanPath));

  if (directPath && hasExtension && fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
    return directPath;
  }

  // Serve prerendered route HTML first, e.g. /guides and /guides/<slug>.
  if (directPath) {
    const prerenderedIndex = path.join(directPath, 'index.html');
    if (fs.existsSync(prerenderedIndex) && fs.statSync(prerenderedIndex).isFile()) {
      return prerenderedIndex;
    }
  }

  // Root and non-prerendered app routes fall back to the React app shell.
  return path.join(buildDir, 'index.html');
}

const server = http.createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method not allowed');
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const filePath = resolveRequest(url.pathname);
  sendFile(res, filePath);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`HiHired prerender-aware server listening on ${port}`);
});
