import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore } from '../server/store.js';
import { openFamily } from '../server/family.js';
import { createApp } from '../server.js';
import { PICTURES, svgOf } from '../js/colouring/pictures.js';
import { drawingSignature, groupDrawings } from '../js/colouring/gallery.js';

test('new and legacy drawings retain fills through export, import and SQLite restart', () => {
  const dir = mkdtempSync(join(tmpdir(), 'amelie-colouring-'));
  let store;
  try {
    store = openStore(join(dir, 'drawing.sqlite'));
    const drawings = [
      { id: 'old-house', pic: 'house', fills: { sun: '#FF4D4F', roof: '#3A86FF' }, ts: 1 },
      { id: 'old-pets', pic: 'pets', fills: { cat: '#FFD23F', ball: '#3BB273' }, ts: 2 },
      { id: 'old-night', pic: 'night', fills: { moon: '#FFD23F', star: '#FF70A6' }, ts: 3 },
      { id: 'new-dinosaur', pic: 'dino-garden', fills: { dinosaur: '#3BB273', sun: '#FFD23F' }, ts: 4 },
      { id: 'new-cat', pic: 'cat-dojo', artVersion: 'ink-v2', fills: { cat: '#FF9F1C', belt: '#FFD23F', pieceh: '#FF70A6' }, ts: 5 },
      { id: 'new-art', pic: 'art-studio', fills: { palette: '#3A86FF' }, ts: 6 },
      { id: 'new-boat', pic: 'paper-boat', fills: { sail: '#FFD23F' }, ts: 7 },
      { id: 'new-bunny', pic: 'bunny-picnic', fills: { carrot: '#FF9F1C' }, ts: 8 },
      { id: 'new-space', pic: 'space-friends', fills: { rocket: '#FF4D4F' }, ts: 9 },
    ];
    for (const drawing of drawings) store.put('gallery', drawing);
    store.put('profile', { id: 'amelie', stars: 305 });
    const backup = store.exportProgress(); store.importProgress(backup);
    store.close(); store = openStore(join(dir, 'drawing.sqlite'));
    assert.deepEqual(store.list('gallery'), drawings);
    assert.equal(store.get('profile', 'amelie').stars, 305);
    for (const drawing of drawings) {
      const svg = svgOf(PICTURES.find((p) => p.id === drawing.pic), drawing.fills, drawing.artVersion || 'legacy');
      for (const [region, colour] of Object.entries(drawing.fills)) assert.match(svg, new RegExp(`data-${region.startsWith('piece') ? 'part' : 'w'}="${region}"[^>]*fill="${colour}"`));
    }
    assert.throws(() => store.put('gallery', { id: 'unknown', pic: 'unpublished', fills: {}, ts: 1 }));
  } finally { store?.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('gallery groups repeated compositions without removing records or mixing artwork versions', () => {
  const original = [
    { id: 'first', pic: 'house', fills: { sun: '#FFD23F', roof: '#FF4D4F' }, ts: 1 },
    { id: 'repeat', pic: 'house', fills: { roof: '#FF4D4F', sun: '#FFD23F' }, ts: 2 },
    { id: 'new-contours', pic: 'house', artVersion: 'ink-v2', fills: { sun: '#FFD23F', roof: '#FF4D4F' }, ts: 3 },
  ];
  const snapshot = structuredClone(original);
  assert.equal(drawingSignature(original[0]), drawingSignature(original[1]));
  const groups = groupDrawings(original);
  assert.equal(groups.length, 2);
  assert.equal(groups[1].drawing.id, 'repeat');
  assert.deepEqual(groups[1].saves.map((x) => x.id), ['repeat', 'first']);
  assert.deepEqual(original, snapshot);
});

test('personal colouring pack saves for Amelie and is rejected for other profiles through direct API and import', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'amelie-personal-art-'));
  const family = openFamily({ dir, parentPassword: 'personal-art-test-password' });
  const store = openStore(':memory:'); const app = createApp({ store, family });
  await new Promise((r) => app.listen(0, '127.0.0.1', r));
  t.after(async () => { await new Promise((r) => app.close(r)); family.close(); store.close(); rmSync(dir, { recursive: true, force: true }); });
  const base = `http://127.0.0.1:${app.address().port}/api/`;
  const request = (path, cookie, scope, value) => fetch(base + path, { method: value === undefined ? 'GET' : 'POST', headers: { Cookie: cookie, 'X-Amelie-Scope': scope, 'Content-Type': 'application/json' }, ...(value === undefined ? {} : { body: JSON.stringify(value) }) });
  const login = async (id, password) => { const response = await request('auth/login', '', '', { login: id, password }); assert.equal(response.status, 200); return response.headers.get('set-cookie').split(';')[0]; };
  const parentCookie = await login('parent', 'personal-art-test-password');
  const access = await (await request('auth/password', parentCookie, '', { account: 'amelie' })).json();
  const childCookie = await login(access.login, access.password);
  const drawing = { id: 'new-cat', pic: 'cat-dojo', fills: { belt: '#FFD23F' }, ts: 1 };
  assert.equal((await request('db/gallery', childCookie, 'amelie:amelie', drawing)).status, 200);
  assert.equal((await request('db/gallery', childCookie, 'amelie:amelie', { ...drawing, pic: 'unpublished' })).status, 403);
  const backup = family.store({ profile: 'amelie' }).exportProgress();
  await family.importProgress({ account: 'parent', profile: 'amelie' }, backup);
  for (const profile of ['demo', 'sandbox']) {
    await request('auth/profile', parentCookie, '', { profile });
    assert.equal((await request('db/gallery', parentCookie, 'parent:' + profile, drawing)).status, 403);
    await assert.rejects(family.importProgress({ account: 'parent', profile }, backup), /недоступен/);
    assert.deepEqual(family.store({ profile }).list('gallery'), []);
    assert.equal((await request('db/gallery', parentCookie, 'parent:' + profile, { ...drawing, id: 'classic', pic: 'house', fills: { sun: '#FFD23F' } })).status, 200);
  }
  assert.deepEqual(family.store({ profile: 'amelie' }).get('gallery', drawing.id), drawing);
});
