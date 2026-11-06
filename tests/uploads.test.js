import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createApp } from '../server.js';
import { openStore } from '../server/store.js';
import { openFamily } from '../server/family.js';
import { openAI } from '../server/ai.js';
import { toLineArt, labelRegions, regionAt, inkFromPixels, paintPixels } from '../js/colouring/trace.js';
import { validateItem } from '../js/data-model.js';

// A tiny "photo": grey paper with a soft shadow, a dark square frame split by one vertical line.
function photo(w = 120, h = 90) {
  const px = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const paper = 225 - Math.round(x / w * 50); // shadow towards the right
    const line = ((x >= 20 && x <= 22) || (x >= 97 && x <= 99)) && y >= 15 && y <= 75 || ((y >= 15 && y <= 17) || (y >= 73 && y <= 75)) && x >= 20 && x <= 99 || (x >= 59 && x <= 60 && y >= 15 && y <= 75);
    const v = line ? 40 : paper;
    px.set([v, v, v, 255], (y * w + x) * 4);
  }
  return { px, w, h };
}

test('tracing a shaded photo finds the closed shapes and numbers them in reading order', () => {
  const { px, w, h } = photo();
  const ink = toLineArt(px, w, h);
  const { labels, regions } = labelRegions(ink, w, h);
  assert.equal(regions.length, 3); // outside, left box, right box
  const left = regionAt(labels, w, h, 40, 45); const right = regionAt(labels, w, h, 80, 45); const outside = regionAt(labels, w, h, 5, 5);
  assert.equal(new Set([left, right, outside]).size, 3);
  assert.ok(left < right, 'left box comes before the right one');
  assert.equal(regionAt(labels, w, h, 59, 45) > 0, true, 'a tap on the line picks a neighbour');
  const anchor = regions[left - 1];
  assert.equal(labels[anchor.y * w + anchor.x], left, 'number sits inside its region');
  // Re-tracing the saved black/white art gives the same numbers.
  const png = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < ink.length; i++) { const v = ink[i] ? 0 : 255; png.set([v, v, v, 255], i * 4); }
  assert.deepEqual(labelRegions(inkFromPixels(png, w, h), w, h).labels, labels);
  const out = paintPixels(new Uint8ClampedArray(w * h * 4), ink, labels, { ['r' + left]: '#FF0000' });
  assert.deepEqual([...out.slice((45 * w + 40) * 4, (45 * w + 40) * 4 + 3)], [255, 0, 0]);
});

const upload = (extra = {}) => ({ id: 'u-abc12345', en: 'My boxes', ru: 'Мои коробки', image: 'data:image/png;base64,iVBORw0KGgo=', width: 120, height: 90,
  regions: [{ n: 2, en: 'box', ru: 'коробка', colour: 'red' }, { n: 3, en: 'box', ru: 'коробка' }], ai: true, createdAt: 1, ...extra });

test('own pictures are validated, and drawings of them use region keys', () => {
  assert.equal(validateItem('uploads', upload()).id, 'u-abc12345');
  assert.throws(() => validateItem('uploads', upload({ regions: [{ n: 1, en: 'The Cat!', ru: 'кот' }] })));
  assert.throws(() => validateItem('uploads', upload({ image: 'data:image/jpeg;base64,AAAA' })));
  assert.throws(() => validateItem('uploads', upload({ regions: [{ n: 1, en: 'cat', ru: 'кот' }, { n: 1, en: 'dog', ru: 'собака' }] })));
  assert.ok(validateItem('gallery', { id: 'g1', pic: 'u-abc12345', fills: { r2: '#FF0000' }, ts: 1 }));
  assert.throws(() => validateItem('gallery', { id: 'g1', pic: 'u-abc12345', fills: { roof: '#FF0000' }, ts: 1 }));
});

function fakeClient(reply) {
  const calls = [];
  return { calls, beta: { messages: { create: async (params) => { calls.push(params); return typeof reply === 'function' ? reply(params) : reply; } } } };
}
const answer = (regions, extra = {}) => ({ model: 'claude-opus-5-5', stop_reason: 'end_turn', usage: { input_tokens: 2000, output_tokens: 800 },
  content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: JSON.stringify({ title_en: 'Two boxes', title_ru: 'Две коробки', regions }) }], ...extra });
const image = 'data:image/jpeg;base64,/9j/4AAQ';

test('AI labelling: structured request, cleaned answer, usage ledger and a hard monthly cap', async () => {
  const db = new DatabaseSync(':memory:');
  const client = fakeClient(answer([{ n: 2, en: 'The Box', ru: 'коробка', colour: 'red' }, { n: 3, en: '<script>', ru: 'x', colour: 'gold' }, { n: 9, en: 'cat', ru: 'кот', colour: '' }]));
  const ai = openAI({ db, client, limit: 0.22, now: () => new Date('2026-11-05T10:00:00Z') });
  const result = await ai.labelPicture({ image, numbers: [1, 2, 3], vocabulary: ['box', 'cat'], colours: ['red', 'blue'] });
  const call = client.calls[0];
  assert.equal(call.model, 'claude-opus-5-5');
  assert.equal(call.fallbacks, 'default');
  assert.deepEqual(call.betas, ['server-side-fallback-2026-07-01']);
  assert.equal(call.output_config.format.type, 'json_schema');
  assert.equal(call.messages[0].content[0].source.media_type, 'image/jpeg');
  assert.doesNotMatch(JSON.stringify(call), /amelie|Амели/i, 'no child data in the request');
  assert.deepEqual(result.regions, [{ n: 2, en: 'box', ru: 'коробка', colour: 'red' }, { n: 3, en: '', ru: '', colour: '' }]);
  assert.equal(result.title.en, 'Two boxes');
  assert.equal(result.cost, 0.03); // 2000 × $5/M + 800 × $25/M
  assert.equal(ai.status().spent, 0.03);
  // Each call reserves its full output allowance first, so the cap is never crossed.
  await ai.labelPicture({ image, numbers: [1] });
  await assert.rejects(ai.labelPicture({ image, numbers: [1] }), (e) => e.status === 402);
  assert.equal(client.calls.length, 2);
  assert.equal(openAI({ db, limit: 2, apiKey: '' }).enabled, false);
});

test('AI labelling handles a refusal without leaking a reservation', async () => {
  const db = new DatabaseSync(':memory:');
  const ai = openAI({ db, client: fakeClient(answer([], { stop_reason: 'refusal', stop_details: { category: null }, content: [] })), limit: 2 });
  await assert.rejects(ai.labelPicture({ image, numbers: [1] }), (e) => e.status === 422);
  const row = db.prepare('SELECT status, cost FROM ai_usage').get();
  assert.equal(row.status, 'refused');
  assert.ok(ai.status().spent < 0.05);
  await assert.rejects(ai.labelPicture({ image: 'data:text/html;base64,AAAA', numbers: [1] }), (e) => e.status === 400);
});

test('family server: only a parent uploads and calls AI; the child paints and saves; export round-trips', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'amelie-uploads-'));
  const legacy = openStore(':memory:');
  const family = openFamily({ dir, parentPassword: 'parent-test-password' });
  const client = fakeClient(answer([{ n: 2, en: 'box', ru: 'коробка', colour: 'red' }]));
  const app = createApp({ store: legacy, family, ai: openAI({ db: family.db, client, limit: 2 }) });
  await new Promise((r) => app.listen(0, '127.0.0.1', r));
  t.after(async () => { await new Promise((r) => app.close(r)); family.close(); legacy.close(); rmSync(dir, { recursive: true, force: true }); });
  const base = `http://127.0.0.1:${app.address().port}`;
  const request = (path, { cookie = '', scope = '', value } = {}) => fetch(base + '/api/' + path, { method: value === undefined ? 'GET' : 'POST', headers: { Cookie: cookie, 'X-Amelie-Scope': scope, 'Content-Type': 'application/json' }, ...(value === undefined ? {} : { body: JSON.stringify(value) }) });
  const login = async (login, password) => (await request('auth/login', { value: { login, password } })).headers.get('set-cookie').split(';')[0];
  const parent = { cookie: await login('parent', 'parent-test-password'), scope: 'parent:amelie' };
  const access = await (await request('auth/password', { ...parent, value: { account: 'amelie' } })).json();
  const child = { cookie: await login(access.login, access.password), scope: 'amelie:amelie' };

  assert.equal((await request('db/uploads', { ...child, value: upload() })).status, 403);
  assert.equal((await request('ai/status', child)).status, 403);
  assert.equal((await request('ai/label-picture', { ...child, value: { image, numbers: [1] } })).status, 403);
  assert.equal((await request('db/gallery', { ...child, value: { id: 'g1', pic: 'u-abc12345', fills: { r2: '#FF0000' }, ts: 1 } })).status, 403, 'unknown own picture');

  assert.equal((await request('db/uploads', { ...parent, value: upload() })).status, 200);
  assert.equal((await (await request('ai/status', parent)).json()).enabled, true);
  const homework = { id: 'hw-own', book: 'Spotlight 2, часть 1', pages: '26', task: '', wordIds: ['hello-hello'], active: true, createdAt: 1, picture: 'u-abc12345' };
  assert.equal((await request('db/assignments', { ...parent, value: homework })).status, 200, 'own picture in a textbook assignment');
  assert.equal((await request('db/assignments', { ...parent, value: { ...homework, id: 'hw-missing', picture: 'u-missing99' } })).status, 403);
  const labelled = await (await request('ai/label-picture', { ...parent, value: { image, numbers: [1, 2, 3] } })).json();
  assert.equal(labelled.regions[0].en, 'box');
  assert.match(client.calls[0].messages[0].content[1].text, /Colours: .*red/);

  assert.equal((await request('db/gallery', { ...child, value: { id: 'g1', pic: 'u-abc12345', fills: { r2: '#FF0000' }, ts: 1 } })).status, 200);
  assert.equal((await (await request('db/uploads', child)).json()).length, 1);
  const exported = await (await request('progress/export', parent)).json();
  assert.equal(exported.data.uploads.length, 1);
  const preview = await request('progress/preview', { ...parent, value: exported });
  assert.equal(preview.status, 200);
  // An old file without uploads still imports.
  const old = { ...exported, data: { ...exported.data, uploads: undefined, gallery: [], assignments: [] } };
  delete old.data.uploads;
  assert.equal((await request('progress/preview', { ...parent, value: old })).status, 200);
  // A drawing whose own picture is missing from the file is rejected.
  const orphan = { ...exported, data: { ...exported.data, uploads: [] } };
  assert.equal((await request('progress/preview', { ...parent, value: orphan })).status, 403);
});
