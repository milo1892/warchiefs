import { readFile } from 'node:fs/promises';
import { createServer, type ServerResponse } from 'node:http';
import { once } from 'node:events';
import { extname, resolve, sep } from 'node:path';

const TYPES: Record<string, string> = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png',
};

async function serve(url: string, response: ServerResponse, generation: number): Promise<void> {
  const root = resolve('dist');
  const pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname);
  const path = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!path.startsWith(root + sep)) { response.writeHead(403); response.end('Outside build directory.'); return; }
  const content = await readFile(path);
  response.writeHead(200, { 'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
  response.end(pathname === '/sw.js' ? Buffer.concat([content, Buffer.from(`\n// Test deployment ${generation}\n`)]) : content);
}

export async function startUpdateServer() {
  let generation = 1;
  const server = createServer((request, response) => {
    void serve(request.url ?? '/', response, generation).catch(error => {
      const missing = error instanceof Error && 'code' in error && error.code === 'ENOENT';
      if (!missing) console.error('Update-test server failed:', error);
      response.writeHead(missing ? 404 : 500);
      response.end(missing ? 'Not found.' : 'Static serving failed.');
    });
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server did not bind a TCP port.');
  return {
    origin: `http://127.0.0.1:${address.port}/`,
    deploy: () => { generation++; },
    close: () => new Promise<void>((accept, reject) => server.close(error => error ? reject(error) : accept())),
  };
}
