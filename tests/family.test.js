import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { createApp } from '../server.js';
import { openStore } from '../server/store.js';
import { openFamily } from '../server/family.js';
import { importChildFile } from '../scripts/import-child-progress.js';

test('family sessions enforce parent permissions, child isolation, stale-tab scope and password revocation', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'amelie-family-'));
  const legacy = openStore(join(dir, 'amelie.sqlite'));
  legacy.put('profile', { id: 'amelie', stars: 7 });
  const family = openFamily({ dir, parentPassword: 'parent-test-password' });
  const app = createApp({ store: legacy, family });
  await new Promise((r) => app.listen(0, '127.0.0.1', r));
  t.after(async () => { await new Promise((r) => app.close(r)); family.close(); legacy.close(); rmSync(dir, { recursive: true, force: true }); });
  const base = `http://127.0.0.1:${app.address().port}`;
  const request = (path, { cookie = '', scope = '', value, headers = {} } = {}) => fetch(base + '/api/' + path, { method: value === undefined ? 'GET' : 'POST', headers: { Cookie: cookie, 'X-Amelie-Scope': scope, 'Content-Type': 'application/json', ...headers }, ...(value === undefined ? {} : { body: JSON.stringify(value) }) });
  const login = async (login, password) => {
    const response = await request('auth/login', { value: { login, password } });
    assert.equal(response.status, 200);
    const cookie = response.headers.get('set-cookie');
    assert.match(cookie, /HttpOnly; SameSite=Strict/);
    return cookie.split(';')[0];
  };
  assert.equal((await request('db/profile')).status, 401);
  assert.equal((await request('db/profile', { headers: { Authorization: 'Basic ' + Buffer.from('parent:parent-test-password').toString('base64') } })).status, 401);
  assert.equal((await request('auth/login', { value: { login: 'parent', password: 'wrong' } })).status, 401);
  assert.equal((await request('auth/login', { value: { login: 'parent', password: 'parent-test-password' }, headers: { Origin: 'https://unrelated.example' } })).status, 403);
  const parentCookie = await login('parent', 'parent-test-password');
  const parent = { cookie: parentCookie, scope: 'parent:amelie' };
  assert.equal((await (await request('auth/session', parent)).json()).role, 'parent');
  for (const id of ['amelie', 'demo', 'sandbox']) {
    await request('auth/profile', { ...parent, value: { profile: id } });
    assert.deepEqual(await (await request('db/profile', { ...parent, scope: 'parent:' + id })).json(), []);
  }
  await request('auth/profile', { ...parent, value: { profile: 'amelie' } });
  const access = await (await request('auth/password', { ...parent, value: { account: 'amelie' } })).json();
  const childCookie = await login(access.login, access.password);
  const child = { cookie: childCookie, scope: 'amelie:amelie' };
  const exportFile = { app: 'amelie-art-studio', version: 1, data: { progress: [{ id: 'hello-hello', box: 1, reps: 1, due: 2000000000000 }], log: [], profile: [{ id: 'amelie', stars: 305, stickers: [], days: {}, newPerDay: 6 }], gallery: [{ id: 'drawing-1', pic: 'house', fills: { sun: '#FF4D4F' }, ts: 1 }], words: [] } };
  const preview = await (await request('progress/preview', { ...parent, value: exportFile })).json();
  assert.equal(preview.summary.stars, 305);
  assert.equal(family.store({ profile: 'amelie' }).list('profile').length, 0);
  assert.equal((await request('progress/import', { ...parent, value: exportFile })).status, 200);
  assert.equal(readdirSync(join(dir, 'backups')).length, 1);
  assert.equal((await (await request('db/profile', child)).json())[0].stars, 305);
  for (const path of ['progress/import', 'progress/preview', 'content/import', 'db/words', 'db/topics', 'db/assignments', 'auth/profile', 'auth/password']) assert.equal((await request(path, { ...child, value: {} })).status, 403, path);
  assert.equal((await request('progress/export', child)).status, 403);
  assert.equal((await request('auth/access', child)).status, 403);
  assert.equal((await request('db/profile', { ...child, value: { id: 'amelie', newPerDay: 10 } })).status, 403);
  assert.equal((await request('db/profile', { ...child, value: { id: 'amelie', stars: 306 } })).status, 200);
  await request('auth/profile', { ...parent, value: { profile: 'demo' } });
  assert.equal((await request('db/profile', { ...parent, value: { id: 'amelie', stars: 999 } })).status, 409);
  const demo = { ...parent, scope: 'parent:demo' };
  assert.deepEqual(await (await request('db/profile', demo)).json(), []);
  await request('db/profile', { ...demo, value: { id: 'amelie', stars: 1 } });
  assert.equal((await (await request('db/profile', child)).json())[0].stars, 306);
  assert.equal(legacy.get('profile', 'amelie').stars, 7);
  await request('auth/password', { ...parent, value: { account: 'amelie' } });
  assert.equal((await request('db/profile', child)).status, 401);
  assert.equal((await request('auth/login', { value: access })).status, 401);
  assert.equal((await request('auth/logout', { ...parent, value: {} })).status, 200);
  assert.equal((await request('auth/session', parent)).status, 401);
  const bytes = readFileSync(join(dir, 'accounts.sqlite'));
  assert.equal(bytes.includes(Buffer.from('parent-test-password')), false);
  assert.equal(bytes.includes(Buffer.from(access.password)), false);
});

test('one-time file migration never overwrites later play or an occupied album', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'amelie-migration-'));
  const family = openFamily({ dir, parentPassword: 'migration-test-password' });
  try {
    const path = join(dir, 'source.json');
    const data = { app: 'amelie-art-studio', version: 1, data: { progress: [], log: [], profile: [{ id: 'amelie', stars: 20 }], gallery: [], words: [] } };
    writeFileSync(path, JSON.stringify(data));
    const session = { account: 'parent', profile: 'amelie' };
    assert.equal((await importChildFile(family, path)).dryRun, true);
    assert.equal(family.store(session).list('profile').length, 0);
    assert.equal((await importChildFile(family, path, { apply: true })).imported, true);
    family.store(session).put('profile', { id: 'amelie', stars: 21 });
    assert.equal((await importChildFile(family, path, { apply: true })).alreadyImported, true);
    assert.equal(family.store(session).get('profile', 'amelie').stars, 21);
    data.data.profile[0].stars = 22;
    writeFileSync(path, JSON.stringify(data));
    await assert.rejects(importChildFile(family, path, { apply: true }));
    family.store({ profile: 'demo' }).put('profile', { id: 'amelie', stars: 1 });
    await assert.rejects(importChildFile(family, path, { apply: true, profile: 'demo' }));
    assert.equal(readdirSync(join(dir, 'backups')).length, 1);
  } finally { family.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('family backup captures current WAL records and credentials without replacing existing backups', () => {
  const dir = mkdtempSync(join(tmpdir(), 'amelie-backup-'));
  const family = openFamily({ dir, parentPassword: 'backup-test-password' });
  const destination = join(dir, 'snapshot');
  try {
    family.store({ profile: 'amelie' }).put('profile', { id: 'amelie', stars: 42 });
    execFileSync(process.execPath, ['scripts/backup.js', '--family', destination], { env: { ...process.env, DATA_DIR: dir }, stdio: 'pipe' });
    const restored = openStore(join(destination, 'profiles', 'amelie.sqlite'));
    assert.equal(restored.get('profile', 'amelie').stars, 42); restored.close();
    const accounts = new DatabaseSync(join(destination, 'accounts.sqlite'), { readOnly: true });
    assert.equal(accounts.prepare('SELECT count(*) AS n FROM accounts').get().n, 4); accounts.close();
    assert.throws(() => execFileSync(process.execPath, ['scripts/backup.js', '--family', destination], { env: { ...process.env, DATA_DIR: dir }, stdio: 'pipe' }));
  } finally { family.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('import validates before backup or replacement and survives restart with empty test accounts', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'amelie-family-restart-'));
  let family;
  try {
    family = openFamily({ dir, parentPassword: 'initial-password' });
    const parent = { account: 'parent', profile: 'amelie' };
    const data = { app: 'amelie-art-studio', version: 1, data: { progress: [], log: [], profile: [{ id: 'amelie', stars: 23 }], gallery: [], words: [] } };
    await family.importProgress(parent, data);
    const bad = structuredClone(data); bad.data.gallery = [{ id: 'broken' }];
    await assert.rejects(family.importProgress(parent, bad));
    assert.equal(readdirSync(join(dir, 'backups')).length, 1);
    family.close();
    family = openFamily({ dir, parentPassword: 'different-environment-password' });
    assert.equal(family.store(parent).get('profile', 'amelie').stars, 23);
    assert.deepEqual(family.store({ profile: 'demo' }).list('profile'), []);
    assert.deepEqual(family.store({ profile: 'sandbox' }).list('gallery'), []);
    assert.ok(family.login('parent', 'initial-password'));
    assert.throws(() => family.login('parent', 'different-environment-password'));
  } finally { family?.close(); rmSync(dir, { recursive: true, force: true }); }
});
