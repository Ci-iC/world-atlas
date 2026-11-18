import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../docs', import.meta.url));
const mount = '/world-atlas/';
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.png': 'image/png', '.avif': 'image/avif', '.gif': 'image/gif',
};

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/' || pathname === mount.slice(0, -1)) {
      response.writeHead(302, { Location: mount }).end();
      return;
    }
    if (!pathname.startsWith(mount)) {
      response.writeHead(404).end();
      return;
    }
    const file = resolve(root, pathname.slice(mount.length) || 'index.html');
    const type = types[extname(file).toLowerCase()];
    if (!file.startsWith(root + sep) || !type) {
      response.writeHead(404).end();
      return;
    }
    const contents = await readFile(file);
    response.writeHead(200, {
      'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    }).end(contents);
  } catch {
    response.writeHead(404).end();
  }
});

server.listen(Number(process.argv[2] ?? 4180), '127.0.0.1', () => {
  console.log(`三国大洲 · http://127.0.0.1:${server.address().port}${mount}`);
});
