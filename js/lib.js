import { art, wordArt } from './art.js';
import { SESSION } from './auth.js';
import { applyActivity } from './activity.js';
import { validateItem } from './data-model.js';
export { STICKERS } from './rewards.js';
// Shared helpers: data store, DOM, speech, sounds, rewards.

export const COLS = ['words', 'topics', 'progress', 'log', 'profile', 'gallery', 'assignments'];
export const STATE = ['progress', 'log', 'profile', 'gallery', 'assignments']; // Amelie's own data (everything else is content)
export const S = Object.fromEntries(COLS.map((c) => [c, []]));

// Two ways to run:
//   server — `node server.js` (local / VPS): data lives in a private SQLite database;
//   static — GitHub Pages: content comes from data/*.json files, Amelie's progress lives in this browser (localStorage).
export let MODE = 'static';
let LS = 'amelie:v1:';
export const storageKey = (col) => LS + col;
const scopeHeaders = () => SESSION ? { 'X-Amelie-Scope': SESSION.scope } : {};
const lsGet = (col) => { try { return JSON.parse(localStorage.getItem(LS + col) || '[]'); } catch { return []; } };
const lsSet = (col, items) => { try { localStorage.setItem(LS + col, JSON.stringify(items)); return true; } catch { return false; } };
let pending = lsGet('pending');
if (!Array.isArray(pending)) pending = [];
let sending = null;
let durableQueue = true;
export let SYNC = { pending: pending.length, error: '', durable: durableQueue };
const syncStatus = (error = '') => {
  SYNC = { pending: pending.length, error, durable: durableQueue };
  document.dispatchEvent(new CustomEvent('sync', { detail: SYNC }));
};

async function requestJSON(url, options = {}) {
  const r = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(10000), ...options, headers: { ...scopeHeaders(), ...options.headers } });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(data?.error || `Не удалось связаться с сервером (${r.status})`);
  return data;
}

// Keep writes on this device until the server acknowledges them, including across reloads.
export function flushSaves() {
  if (MODE !== 'server') return Promise.resolve(true);
  if (sending) return sending;
  if (!pending.length) { syncStatus(); return Promise.resolve(true); }
  sending = (async () => {
    try {
      while (pending.length) {
        const entry = pending[0];
        const result = await requestJSON(entry.col === 'activity' ? 'api/activity' : `api/db/${entry.col}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry.item) });
        pending.shift();
        if (entry.col === 'activity') {
          if (result.profile && !pending.some((x) => x.col === 'activity')) {
            const patches = pending.filter((x) => x.col === 'profile').map((x) => x.item);
            S.profile = [Object.assign({}, result.profile, ...patches)]; lsSet('profile', S.profile);
            document.dispatchEvent(new CustomEvent('stars', { detail: { stars: profile().stars, synced: true } }));
          }
          if (entry.item.kind === 'review' && !pending.some((x) => x.col === 'activity' && x.item.word === entry.item.word)) {
            S.progress = result.progress ? mergeById(S.progress, [result.progress]) : S.progress.filter((p) => p.id !== entry.item.word); lsSet('progress', S.progress);
          }
          if (entry.item.kind === 'review') { S.log = result.log ? mergeById(S.log, [result.log]) : S.log.filter((l) => l.id !== entry.item.id); lsSet('log', S.log); }
        }
        durableQueue = lsSet('pending', pending); syncStatus();
      }
      syncStatus(); return true;
    } catch (error) { syncStatus(error.message); return false; }
  })().finally(() => { sending = null; });
  return sending;
}
window.addEventListener('online', () => flushSaves());
setInterval(() => { if (pending.length && MODE === 'server') flushSaves(); }, 10000);

async function getJSON(url) {
  try { const r = await fetch(url, { cache: 'no-store' }); if (!r.ok) return null; const v = await r.json(); return Array.isArray(v) ? v : null; } catch { return null; }
}

// Static files + things saved in this browser, merged by id (local edits win: parents' own words, progress).
const mergeById = (base, extra) => { const m = new Map(base.map((x) => [x.id, x])); for (const x of extra) m.set(x.id, { ...(m.get(x.id) || {}), ...x }); return [...m.values()]; };

export async function loadAll() {
  const prefix = SESSION ? `amelie:v2:${SESSION.scope}:` : 'amelie:v1:';
  if (prefix !== LS) {
    LS = prefix;
    pending = lsGet('pending'); if (!Array.isArray(pending)) pending = [];
    durableQueue = true; syncStatus();
    // Offer only a genuine prototype backup. Never reuse the old server's adult test cache.
    if (SESSION?.role === 'parent' && SESSION.profile === 'amelie' && lsGet('serverUsed') !== true) {
      try {
        const old = (col) => JSON.parse(localStorage.getItem('amelie:v1:' + col) || '[]');
        if (old('serverUsed') !== true && STATE.some((c) => old(c).length)) lsSet('beforeServer', { app: 'amelie-art-studio', version: 1, data: { ...Object.fromEntries(STATE.map((c) => [c, old(c)])), words: old('words').filter((w) => w.custom) } });
      } catch { /* Keep malformed old storage untouched. */ }
    }
  }
  const probe = await fetch('api/db/topics', { cache: 'no-store', headers: scopeHeaders(), signal: AbortSignal.timeout(10000) });
  if (probe.status === 404) MODE = 'static';
  else if (probe.ok) MODE = 'server';
  else throw new Error('Сервер временно недоступен. Попробуйте открыть приложение ещё раз.');
  if (MODE === 'server' && lsGet('serverUsed') !== true) {
    if (STATE.some((c) => lsGet(c).length)) lsSet('beforeServer', { app: 'amelie-art-studio', version: 1, data: { ...Object.fromEntries(STATE.map((c) => [c, lsGet(c)])), words: lsGet('words').filter((w) => w.custom) } });
    lsSet('serverUsed', true);
  }
  await Promise.all(COLS.map(async (c) => {
    if (MODE === 'server') {
      const data = await requestJSON(`api/db/${c}`);
      if (!Array.isArray(data)) throw new Error('Сервер вернул некорректные данные');
      S[c] = mergeById(data, pending.filter((x) => x.col === c).map((x) => x.item));
    }
    else S[c] = mergeById(STATE.includes(c) ? [] : (await getJSON(`data/${c}.json`)) || [], lsGet(c));
  }));
  S.topics.sort((a, b) => a.order - b.order);
  // Rebuild the optimistic preview from still-unacknowledged activities after a reload.
  // A response may have been lost after commit; idempotent server replies reconcile the preview.
  if (MODE === 'server') for (const entry of pending.filter((x) => x.col === 'activity')) applyLocalActivity(entry.item);
  // Ask the browser not to evict our data (Chrome/Android honour it; on iPhone — add the site to the Home Screen).
  if (MODE === 'static') navigator.storage?.persist?.().catch(() => {});
  else { for (const c of COLS) lsSet(c, S[c]); flushSaves(); }
}

export const uid = () => globalThis.crypto?.randomUUID?.() || Math.random().toString(16).slice(2, 10) + Date.now().toString(16).slice(-4);

export async function save(col, item) {
  if (!item.id) item.id = uid();
  validateItem(col, col === 'profile' ? { ...profile(), ...item } : item);
  if (col === 'words' && !S.topics.some((topic) => topic.id === item.topic)) throw new Error('Сначала добавьте тему слова.');
  if (col === 'assignments' && !item.wordIds.every((id) => S.words.some((word) => word.id === id))) throw new Error('Сначала добавьте все слова задания.');
  const i = S[col].findIndex((x) => x.id === item.id);
  if (i >= 0) S[col][i] = { ...S[col][i], ...item }; else S[col].push({ ...(col === 'profile' ? profile() : {}), ...item });
  const saved = S[col][i >= 0 ? i : S[col].length - 1];
  if (MODE === 'server') {
    pending.push({ col, item: structuredClone(col === 'profile' ? item : saved) });
    durableQueue = lsSet('pending', pending); lsSet(col, S[col]); syncStatus(); flushSaves();
  }
  else if (STATE.includes(col)) lsSet(col, S[col]);
  else lsSet(col, mergeById(lsGet(col), [saved])); // content: keep only local additions, not the whole static file
  return saved;
}

// Device snapshot; downloadProgress obtains the authoritative full server export with receipts.
export function exportProgress() {
  return { app: 'amelie-art-studio', version: 1, contentSnapshot: true, exportedAt: new Date().toISOString(),
    data: { ...Object.fromEntries(STATE.map((c) => [c, S[c]])), topics: S.topics, words: S.words } };
}
export async function downloadProgress() {
  if (MODE !== 'server') return exportProgress();
  if (!(await flushSaves())) throw new Error('Сначала дождитесь подтверждения сервера. Очередь результатов остаётся на этом устройстве.');
  return requestJSON('api/progress/export');
}

export async function previewProgress(file) {
  if (!SESSION) return null;
  if (!(await flushSaves())) throw new Error('Сначала дождитесь сохранения текущего прогресса');
  return requestJSON('api/progress/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(file) });
}

export async function importProgress(file) {
  if (file?.data && file.data.assignments === undefined) file = { ...file, data: { ...file.data, assignments: [] } };
  if (file?.app !== 'amelie-art-studio' || file.version !== 1 || !file.data || [...STATE, 'words'].some((c) => !Array.isArray(file.data[c]) || file.data[c].some((item) => !item || typeof item.id !== 'string'))) throw new Error('Это не файл прогресса Амели');
  if (MODE === 'server') {
    if (!(await flushSaves())) throw new Error('Сначала дождитесь сохранения текущего прогресса');
    await requestJSON('api/progress/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(file) });
    lsSet('beforeServer', null);
    await loadAll();
    return;
  }
  for (const c of STATE) {
    const items = file.data[c];
    S[c] = items;
    lsSet(c, items);
  }
  for (const t of file.data.topics || []) await save('topics', t);
  for (const w of file.data.words || []) await save('words', w);
}

export const browserBackup = () => lsGet('beforeServer')?.app === 'amelie-art-studio' ? lsGet('beforeServer') : null;

export async function importContent(pack) {
  if (MODE !== 'server') throw new Error('Наборы тем можно добавлять в серверной версии');
  if (!(await flushSaves())) throw new Error('Сначала дождитесь сохранения прогресса');
  const result = await requestJSON('api/content/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pack) });
  await loadAll(); return result;
}

// How to pin the site to the home screen on this phone (progress is safest that way in static mode).
export const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
export const isAndroid = () => /Android/i.test(navigator.userAgent);
export const installHint = () => (isAndroid()
  ? 'Chrome → меню ⋮ → «Установить приложение» (или «Добавить на главный экран»).'
  : 'Safari → «Поделиться» → «На экран „Домой“».');

export const profile = () => S.profile.find((p) => p.id === 'amelie') || { id: 'amelie', stars: 0, stickers: [], days: {}, rate: 0.85, newPerDay: 4 };
export const saveProfile = (patch) => save('profile', { ...patch, id: 'amelie' });

// ── DOM ──────────────────────────────────────────────────────
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export function viewTimers() {
  const timers = new Set(); let stopped = false;
  const clear = () => { for (const id of timers) clearTimeout(id); timers.clear(); };
  return { clear, stop: () => { stopped = true; clear(); }, after: (fn, delay) => {
    const id = setTimeout(() => { timers.delete(id); if (!stopped) fn(); }, delay); timers.add(id); return id;
  } };
}
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const shuffle = (a) => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const DAY = 86400000;
export const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const startOfDay = (t = Date.now()) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };

export const topicOf = (id) => S.topics.find((t) => t.id === id);
export const wordById = (id) => S.words.find((w) => w.id === id);

// All pictures share the reference's blue contour and crayon hatching.
export const paperArt = art;
export const wordPic = wordArt;

// ── Speech ───────────────────────────────────────────────────
let voice = null;
function pickVoice() {
  const vs = speechSynthesis.getVoices();
  voice = vs.find((v) => v.lang === 'en-GB' && /Serena|Kate|Martha|Google UK English Female|Daniel/.test(v.name))
    || vs.find((v) => v.lang === 'en-GB') || vs.find((v) => v.lang.startsWith('en')) || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }

export function speak(text, { rate } = {}) {
  if (!('speechSynthesis' in window) || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.lang = voice?.lang || 'en-GB';
  u.rate = rate || profile().rate || 0.85;
  u.pitch = 1.05;
  speechSynthesis.speak(u);
}

// ── Sounds (tiny WebAudio chimes, no files) ─────────────────
let ac = null;
function tone(freqs, dur = 0.12, type = 'sine', gap = 0.09) {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    freqs.forEach((f, i) => {
      const o = ac.createOscillator(); const g = ac.createGain();
      o.type = type; o.frequency.value = f;
      const t = ac.currentTime + i * gap;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
    });
  } catch {}
}
export const sfx = {
  ok: () => tone([660, 880, 1175], 0.16),
  bad: () => tone([300, 240], 0.18, 'triangle', 0.12),
  pop: () => tone([520], 0.08, 'triangle'),
  win: () => tone([523, 659, 784, 1047, 1319], 0.2, 'sine', 0.1),
};

function applyLocalActivity(event) {
  const result = applyActivity(profile(), S.progress.find((p) => p.id === event.word), event);
  S.profile = [result.profile];
  if (result.progress) S.progress = mergeById(S.progress, [result.progress]);
  if (result.log) S.log = mergeById(S.log, [result.log]);
  return result;
}

export function recordActivity(fields) {
  const event = { id: uid(), ts: Date.now(), ...fields };
  const result = applyLocalActivity(event);
  for (const col of ['profile', 'progress', 'log']) lsSet(col, S[col]);
  if (MODE === 'server') {
    pending.push({ col: 'activity', item: event });
    durableQueue = lsSet('pending', pending); syncStatus(); flushSaves();
  }
  document.dispatchEvent(new CustomEvent('stars', { detail: { stars: result.profile.stars, gotSticker: result.awarded[0]?.s, where: fields.where } }));
  for (const sticker of result.awarded) celebrate(sticker.bonus ? 'Все три занятия сделаны! Кубок дня' : 'Новая наклейка!', sticker.s.startsWith('sketch:') ? art(sticker.s.slice(7)) : sticker.s);
  return result;
}
export const addStars = async (amount, where) => recordActivity({ kind: 'stars', amount, where }).profile.stars;
export async function markStep(step) {
  if (profile().days?.[todayKey()]?.[step]) return;
  recordActivity({ kind: 'step', step, day: todayKey() });
}

export function streak() {
  const days = profile().days || {};
  let d = new Date(); let n = 0;
  if (!days[todayKey(d)]) d = new Date(Date.now() - DAY);
  while (days[todayKey(d)]) { n++; d = new Date(d.getTime() - DAY); }
  return n;
}

// Confetti of paint drops + a big message.
export function celebrate(msg, emoji = '⭐') {
  sfx.win();
  const box = document.createElement('div');
  box.className = 'celebrate';
  const colors = ['#FF4D4F', '#FF9F1C', '#FFD23F', '#3BB273', '#3A86FF', '#8E5CF7', '#FF70A6'];
  box.innerHTML = `<div class="cel-card"><div class="cel-emo">${emoji}</div><div class="cel-msg">${esc(msg)}</div></div>`
    + Array.from({ length: 28 }, (_, i) => `<i style="--x:${Math.random() * 100}vw;--d:${0.6 + Math.random() * 0.9}s;--r:${Math.random() * 360}deg;background:${colors[i % colors.length]}"></i>`).join('');
  document.body.appendChild(box);
  box.addEventListener('click', () => box.remove());
  setTimeout(() => box.remove(), 2600);
}

export function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}

// Little star burst at an element (for each correct answer).
export function burst(el, text = '+1 ⭐') {
  const r = el.getBoundingClientRect();
  const b = document.createElement('div');
  b.className = 'burst'; b.textContent = text;
  b.style.left = `${r.left + r.width / 2}px`; b.style.top = `${r.top + window.scrollY}px`;
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 900);
}

export const ICON = {
  sound: art('speaker', 'control-art'),
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="#126c9a" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 4.5 11.8 8.1 7.3 12.2 11.7 15.7 15.2 19.5"/><path d="m7.6 12.1 11.8-.4" stroke-width="1.3"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="#126c9a" stroke-width="2.3" stroke-linecap="round"><path d="m18.1 5.8-6.4 6.4-5.8 5.9M6.2 6.1l6.2 5.7 5.5 6.3"/></svg>',
};
