// Minimaler statischer Dev-Server fuer die kolifox.de-Startseite (kein Build-Schritt noetig).
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 8753;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

// Die Sicherheits-Header der Live-Seite (_headers) mitsenden, damit lokal unter derselben CSP geprueft wird.
const HEADER = {};
fs.readFileSync(path.join(ROOT, '_headers'), 'utf8').split(/\r?\n/).forEach(z => {
  const m = z.match(/^\s+([A-Za-z-]+):\s*(.+)$/);
  if (m) HEADER[m[1]] = m[2];
});

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  if (!path.extname(urlPath)) urlPath += '.html';
  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found: ' + urlPath); }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream', ...HEADER });
    res.end(data);
  });
}).listen(PORT, () => console.log('kolifox-landing dev server on http://localhost:' + PORT));
