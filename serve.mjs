// Minimal static file server for local development: `node serve.mjs` then open http://localhost:8080
// (ES modules don't load from file://, so the app needs to be served over HTTP.)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = new URL('.', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const port = Number(process.env.PORT) || 8080;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };

function parseEnv(contents) {
  const env = {};
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([\w.-]+)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    env[match[1]] = value;
  }
  return env;
}

createServer(async (req, res) => {
  if (req.url === '/env.js') {
    try {
      const env = parseEnv(await readFile(join(root, '.env'), 'utf8'));
      const key = env.CARTODB_API_KEY || '';
      const styleUrl = env.CARTODB_STYLE_URL || '';
      res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' });
      res.end(`window.CARTODB_CONFIG = { apiKey: ${JSON.stringify(key)}, styleUrl: ${JSON.stringify(styleUrl)} };`);
      return;
    } catch {
      res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' });
      res.end('window.CARTODB_CONFIG = { apiKey: "", styleUrl: "" };');
      return;
    }
  }
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '') || 'index.html';
  if (path.startsWith('..')) return res.writeHead(403).end();
  try {
    const body = await readFile(join(root, path));
    res.writeHead(200, { 'Content-Type': types[extname(path)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, () => console.log(`Serving on http://localhost:${port}`));
