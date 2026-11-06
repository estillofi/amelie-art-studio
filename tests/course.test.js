import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { UNITS, EPISODES, BOOK } from '../js/course.js';
import { validateItem } from '../js/data-model.js';
import { pictureForProfile } from '../js/colouring/pictures.js';

const words = [...JSON.parse(readFileSync(new URL('../data/words.json', import.meta.url), 'utf8')), ...JSON.parse(readFileSync(new URL('../data/packs/spotlight-2-1.json', import.meta.url), 'utf8')).words];
const svgSource = readFileSync(new URL('../js/doodles-svg.js', import.meta.url), 'utf8');
const artSource = readFileSync(new URL('../js/art.js', import.meta.url), 'utf8');
const doodles = new Set([...artSource.match(/const POSITIONS = \{([\s\S]*?)\n\};/)[1].matchAll(/^\s*"?([a-z-]+)"?\s*:/gm)].map((m) => m[1]));
for (const m of svgSource.matchAll(/^  '?([a-z-]+)'?: /gm)) doodles.add(m[1]);

test('every episode follows the learning plan and uses only words and drawings that exist', () => {
  assert.ok(EPISODES.length >= 20);
  assert.equal(new Set(EPISODES.map((e) => e.id)).size, EPISODES.length);
  for (const e of EPISODES) {
    assert.ok(e.words.length >= 1 && e.words.length <= 2, `${e.id}: one or two new words`);
    for (const id of [...e.words, ...(e.review || [])]) assert.ok(words.some((w) => w.id === id), `${e.id}: word ${id}`);
    for (const name of [e.art, e.action.art].filter(Boolean)) assert.ok(name === 'numbers' || doodles.has(name), `${e.id}: drawing ${name}`);
    for (const key of ['en', 'ru', 'scene', 'can', 'sign', 'home']) assert.ok(e[key]?.length > 3, `${e.id}: ${key}`);
    assert.ok(e.trap.ru && e.trap.tip, `${e.id}: typical difficulty and help`);
    assert.ok(['move', 'colour', 'abc'].includes(e.action.kind));
    if (e.action.kind === 'colour') assert.ok(pictureForProfile(e.action.picture, 'amelie'), `${e.id}: picture ${e.action.picture}`);
    // "Set as homework" must produce a valid textbook assignment.
    const wordIds = [...new Set([...e.words, ...(e.review || [])])];
    validateItem('assignments', { id: 'a-' + e.id, book: BOOK, pages: e.pages || 'подготовка', task: `Эпизод «${e.en}» в разделе «Мой путь». ${e.home}`, wordIds, active: true, createdAt: 1, dueDate: '', ...(e.action.kind === 'colour' ? { picture: e.action.picture } : {}) });
  }
  assert.equal(UNITS[0].id, 'bridge', 'bridging content comes first');
  assert.ok(UNITS.find((u) => u.id === 'reading').episodes.every((e) => ['66', '67', '68'].includes(e.pages)));
});

test('episode records validate', () => {
  assert.ok(validateItem('episodes', { id: 'ep-b1', runs: 2, clean: 1, helped: 3, traps: 1, last: 1, lastClean: true }));
  assert.throws(() => validateItem('episodes', { id: 'ep-b1', runs: 1, clean: 2, helped: 0, traps: 0, last: 1, lastClean: true }));
  assert.throws(() => validateItem('episodes', { id: 'b1', runs: 1, clean: 1, helped: 0, traps: 0, last: 1, lastClean: true }));
});

test('every textbook pack word has a drawing', () => {
  const pack = JSON.parse(readFileSync(new URL('../data/packs/spotlight-2-1.json', import.meta.url), 'utf8'));
  for (const w of pack.words) {
    validateItem('words', w);
    assert.ok(doodles.has(w.pic.slice(7)), `${w.id}: drawing ${w.pic}`);
  }
});
