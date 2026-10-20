import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore } from '../server/store.js';
import { createApp } from '../server.js';

const topic = { id: 'test-topic', en: 'My dojo', ru: 'Мой зал', icon: '🥋', color: '#3FA796', order: 15 };
const word = { id: 'test-bow', topic: topic.id, en: 'bow', ru: 'поклон', pic: '🙇', order: 0 };
const profile = { id: 'amelie', stars: 7, newPerDay: 4, days: {}, stickers: [] };
const progress = () => ({ app: 'amelie-art-studio', version: 1, data: { progress: [{ id: 'hello-hello', box: 1, reps: 1, due: Date.now() }], log: [], profile: [profile], gallery: [], words: [] } });

test('SQLite keeps state across restart and seeds content only once', () => {
  const dir = mkdtempSync(join(tmpdir(), 'amelie-test-'));
  try {
    let store = openStore(join(dir, 'test.sqlite'));
    assert.equal(store.list('words').length, 110);
    store.put('profile', profile);
    store.importContent({ topics: [topic], words: [word] });
    store.close();
    store = openStore(join(dir, 'test.sqlite'));
    assert.equal(store.list('topics').length, 13);
    assert.equal(store.list('words').length, 111);
    assert.equal(store.get('profile', 'amelie').stars, 7);
    store.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('content dry-run validates references and rolls back; import updates by id', () => {
  const store = openStore(':memory:');
  try {
    assert.deepEqual(store.importContent({ topics: [topic], words: [word] }, { dryRun: true }), { topics: 1, words: 1 });
    assert.equal(store.get('topics', topic.id), undefined);
    store.importContent({ topics: [topic], words: [word] });
    store.importContent({ topics: [topic], words: [{ ...word, ru: 'Поклон' }] });
    assert.equal(store.list('words').length, 111);
    assert.equal(store.get('words', word.id).ru, 'Поклон');
    assert.throws(() => store.importContent({ topics: [{ ...topic, id: 'rollback' }], words: [{ ...word, topic: 'missing' }] }));
    assert.equal(store.get('topics', 'rollback'), undefined);
    assert.throws(() => store.importContent({ topics: [topic, topic], words: [] }));
  } finally { store.close(); }
});

test('progress import is atomic and round-trips old browser exports', () => {
  const store = openStore(':memory:');
  try {
    const original = progress();
    store.importProgress(original);
    assert.deepEqual(store.exportProgress().data, { ...original.data, profile: [{ rate: 0.85, ...profile }] });
    const broken = progress(); broken.data.words = [{ ...word, topic: 'missing' }];
    assert.throws(() => store.importProgress(broken));
    assert.equal(store.get('profile', 'amelie').stars, 7);
    assert.equal(store.list('progress').length, 1);
    assert.throws(() => store.importProgress({ app: 'amelie-art-studio', version: 1, data: {} }));
    assert.equal(store.list('progress').length, 1);
  } finally { store.close(); }
});

test('HTTP requires family auth, rejects cross-site writes and hides private files', async (t) => {
  const store = openStore(':memory:');
  const server = createApp({ store, user: 'family', password: 'test-password-only' });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  t.after(async () => { await new Promise((r) => server.close(r)); store.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const authorization = 'Basic ' + Buffer.from('family:test-password-only').toString('base64');
  const get = (path) => fetch(base + path, { headers: { authorization } });
  const post = (path, value, extra = {}) => fetch(base + path, { method: 'POST', headers: { authorization, 'Content-Type': 'application/json', ...extra }, body: JSON.stringify(value) });
  assert.equal((await fetch(base + '/api/db/profile')).status, 401);
  assert.equal((await fetch(base + '/', { headers: { authorization: 'Basic invalid' } })).status, 401);
  assert.equal((await get('/')).status, 200);
  assert.equal((await get('/js/lib.js')).headers.get('Content-Type'), 'text/javascript; charset=utf-8');
  for (const path of ['/.env', '/.git/config', '/server.js', '/server/store.js', '/.local/amelie.sqlite', '/js/../server.js']) assert.equal((await get(path)).status, 404, path);
  assert.equal((await post('/api/db/profile', profile, { Origin: 'https://unrelated.example' })).status, 403);
  assert.equal((await post('/api/db/profile', profile)).status, 200);
  assert.equal((await post('/api/db/profile', { id: 'amelie', rate: 0.7 })).status, 200);
  assert.equal((await (await get('/api/db/profile')).json())[0].stars, 7);
  assert.equal((await get('/api/db/profile')).status, 200);
  assert.equal((await post('/api/db/profile', { ...profile, stars: -1 })).status, 400);
  assert.equal((await post('/api/db/topics', { ...topic, id: undefined })).status, 400);
  assert.equal((await post('/api/db/profile', { rate: 0.8 })).status, 400);
  assert.equal((await post('/api/db/words', { ...word, pic: '<img onerror=alert(1)>' })).status, 400);
  assert.equal((await post('/api/content/import', { topics: [topic], words: [word] })).status, 200);
  assert.equal((await post('/api/progress/import', progress())).status, 200);
  assert.equal((await get('/api/progress/export')).status, 200);
  assert.equal((await post('/api/db/progress', [])).status, 400);
  assert.equal((await post('/api/db/unknown', {})).status, 404);
});
