import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { route } from './lib/router.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

function loadEnv() {
  const envPath = join(__dirname, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const PORT = Number(process.env.PORT) || 3001;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

function serveStatic(req, res) {
  let path = req.url.split('?')[0];
  if (path === '/') path = '/index.html';
  const file = join(__dirname, path);
  if (!file.startsWith(__dirname) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404, 'Not Found');
    res.end('Not Found');
    return;
  }
  const ext = extname(file).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  res.end(readFileSync(file));
}

createServer(async (req, res) => {
  if (req.url.startsWith('/api')) {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', async () => {
      const body = Buffer.concat(chunks).toString();
      const out = await route({
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: body || undefined,
      });
      res.writeHead(out.status, out.headers);
      res.end(out.body);
    });
    return;
  }
  serveStatic(req, res);
}).listen(PORT, () => {
  console.log(`ANT POOL → http://localhost:${PORT}`);
  console.log(`Admin    → http://localhost:${PORT}/admin.html`);
});
