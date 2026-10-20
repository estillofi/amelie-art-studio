import http from 'node:http';
import { RELEASE } from './js/release.js';
import { createHash, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { openStore, ROOT, COLLECTIONS, ValidationError } from './server/store.js';

const MIME = { html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8', json: 'application/json; charset=utf-8', webmanifest: 'application/manifest+json', png: 'image/png', svg: 'image/svg+xml', webp: 'image/webp', woff2: 'font/woff2', txt: 'text/plain; charset=utf-8' };
const digest = (v) => createHash('sha256').update(v).digest();
const send = (res, status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); };
async function body(req) {
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) throw Object.assign(new Error('Нужен application/json'), { status: 415 });
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > 8 * 1024 * 1024) throw Object.assign(new Error('Файл слишком большой'), { status: 413 }); chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new ValidationError('Некорректный JSON'); }
}

export function createApp({ store = openStore(), user = process.env.APP_USER, password = process.env.APP_PASSWORD } = {}) {
  if (Boolean(user) !== Boolean(password)) throw new Error('Задайте APP_USER и APP_PASSWORD вместе');
  const expected = user ? digest('Basic ' + Buffer.from(`${user}:${password}`).toString('base64')) : null;
  const server = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    if (expected && !timingSafeEqual(expected, digest(req.headers.authorization || ''))) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Amelie family", charset="UTF-8"');
      return send(res, 401, { error: 'Нужен семейный доступ' });
    }
    try {
      const url = new URL(req.url, 'http://localhost');
      const path = decodeURIComponent(url.pathname);
      if (!['GET', 'HEAD', 'POST'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD, POST'); return send(res, 405, { error: 'Метод не поддерживается' }); }
      if (req.method === 'POST') {
        const origin = req.headers.origin;
        if ((origin && new URL(origin).host !== req.headers.host) || req.headers['sec-fetch-site'] === 'cross-site') return send(res, 403, { error: 'Запрос с другого сайта запрещён' });
      }
      if (path === '/api/health' && req.method === 'GET') return send(res, 200, { status: 'ok', storage: 'sqlite', version: RELEASE });
      if (path === '/api/progress/export' && req.method === 'GET') return send(res, 200, store.exportProgress());
      if (path === '/api/progress/import' && req.method === 'POST') return send(res, 200, store.importProgress(await body(req)));
      if (path === '/api/content/import' && req.method === 'POST') return send(res, 200, store.importContent(await body(req)));
      const match = path.match(/^\/api\/db\/(\w+)$/);
      if (match && COLLECTIONS.includes(match[1])) {
        if (req.method === 'GET') return send(res, 200, store.list(match[1]));
        if (req.method === 'POST') return send(res, 200, store.put(match[1], await body(req)));
        return send(res, 405, { error: 'Метод не поддерживается' });
      }
      if (path.startsWith('/api/') || req.method === 'POST') return send(res, 404, { error: 'Адрес не найден' });
      // Only public app resources; never expose the database, source tools, credentials, or Git metadata.
      const publicFile = path === '/' ? 'index.html' : path.slice(1);
      if (!/^(?:index\.html|manifest\.webmanifest|(?:css|js|icons|assets)\/[a-zA-Z0-9_./-]+|data\/(?:topics|words)\.json)$/.test(publicFile) || publicFile.split('/').some((s) => s.startsWith('.'))) return send(res, 404, { error: 'Файл не найден' });
      const data = await readFile(join(ROOT, publicFile));
      res.writeHead(200, { 'Content-Type': MIME[publicFile.split('.').pop()] || 'application/octet-stream' });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch (error) {
      const status = error instanceof ValidationError || error instanceof URIError ? 400 : error.code === 'ENOENT' ? 404 : error.status || 500;
      if (status === 500) console.error('Request failed:', error.message);
      send(res, status, { error: status === 500 ? 'Не удалось сохранить данные. Попробуйте ещё раз.' : error.message });
    }
  });
  server.requestTimeout = 30000;
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const host = process.env.HOST || '127.0.0.1';
  if (!['127.0.0.1', 'localhost', '::1'].includes(host) && !(process.env.APP_USER && process.env.APP_PASSWORD)) throw new Error('Для внешнего доступа задайте APP_USER и APP_PASSWORD');
  const store = openStore();
  const app = createApp({ store });
  app.listen(Number(process.env.PORT || 3000), host, () => console.log(`Amelie listening on ${host}:${app.address().port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => app.close(() => { store.close(); process.exit(0); }));
}
