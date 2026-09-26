// Winziger Static-Server nur fuer die Vorschau des Landing-Entwurfs.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = 4321;

const TYPEN = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/' || p === '') p = '/index.html';
  const datei = path.join(ROOT, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
  if (!datei.startsWith(ROOT)) { res.writeHead(403).end('verboten'); return; }
  fs.readFile(datei, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<p style="font-family:sans-serif">Nicht gefunden: ' + p +
              '<br>(Impressum/Datenschutz gehoeren zur echten Seite, nicht zum Entwurf.)</p>');
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPEN[path.extname(datei).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(buf);
  });
}).listen(PORT, () => console.log('Landing-Entwurf laeuft auf http://localhost:' + PORT));
