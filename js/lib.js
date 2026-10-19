// Shared helpers: data store, DOM, speech, sounds, rewards.

export const COLS = ['words', 'topics', 'progress', 'log', 'profile', 'gallery'];
export const STATE = ['progress', 'log', 'profile', 'gallery']; // Amelie's own data (everything else is content)
export const S = Object.fromEntries(COLS.map((c) => [c, []]));

// Two ways to run:
//   server — `node server.js` (local / VPS): data lives in data/*.json on the server;
//   static — GitHub Pages: content comes from data/*.json files, Amelie's progress lives in this browser (localStorage).
export let MODE = 'static';
const LS = 'amelie:v1:';
const lsGet = (col) => { try { return JSON.parse(localStorage.getItem(LS + col) || '[]'); } catch { return []; } };
const lsSet = (col, items) => { try { localStorage.setItem(LS + col, JSON.stringify(items)); } catch {} };

async function getJSON(url) {
  try { const r = await fetch(url, { cache: 'no-store' }); if (!r.ok) return null; const v = await r.json(); return Array.isArray(v) ? v : null; } catch { return null; }
}

// Static files + things saved in this browser, merged by id (local edits win: parents' own words, progress).
const mergeById = (base, extra) => { const m = new Map(base.map((x) => [x.id, x])); for (const x of extra) m.set(x.id, { ...(m.get(x.id) || {}), ...x }); return [...m.values()]; };

export async function loadAll() {
  MODE = (await getJSON('api/db/topics')) ? 'server' : 'static';
  await Promise.all(COLS.map(async (c) => {
    if (MODE === 'server') S[c] = (await getJSON(`api/db/${c}`)) || [];
    else S[c] = mergeById(STATE.includes(c) ? [] : (await getJSON(`data/${c}.json`)) || [], lsGet(c));
  }));
  S.topics.sort((a, b) => a.order - b.order);
  // Ask the browser not to evict our data (Chrome/Android honour it; on iPhone — add the site to the Home Screen).
  if (MODE === 'static') navigator.storage?.persist?.().catch(() => {});
}

export const uid = () => Math.random().toString(16).slice(2, 10) + Date.now().toString(16).slice(-4);

export async function save(col, item) {
  if (!item.id) item.id = uid();
  const i = S[col].findIndex((x) => x.id === item.id);
  if (i >= 0) S[col][i] = { ...S[col][i], ...item }; else S[col].push(item);
  const saved = S[col][i >= 0 ? i : S[col].length - 1];
  if (MODE === 'server') fetch(`api/db/${col}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
  else if (STATE.includes(col)) lsSet(col, S[col]);
  else lsSet(col, mergeById(lsGet(col), [saved])); // content: keep only local additions, not the whole static file
  return saved;
}

// Backup: one JSON file with Amelie's progress + words her parents added.
export function exportProgress() {
  return { app: 'amelie-art-studio', version: 1, exportedAt: new Date().toISOString(),
    data: { ...Object.fromEntries(STATE.map((c) => [c, S[c]])), words: S.words.filter((w) => w.custom) } };
}

export async function importProgress(file) {
  if (file?.app !== 'amelie-art-studio' || !file.data) throw new Error('Это не файл прогресса Амели');
  for (const c of STATE) {
    const items = Array.isArray(file.data[c]) ? file.data[c] : [];
    S[c] = items;
    if (MODE === 'server') await fetch(`api/db/${c}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(items) });
    else lsSet(c, items);
  }
  for (const w of file.data.words || []) await save('words', w);
}

// How to pin the site to the home screen on this phone (progress is safest that way in static mode).
export const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
export const isAndroid = () => /Android/i.test(navigator.userAgent);
export const installHint = () => (isAndroid()
  ? 'Chrome → меню ⋮ → «Установить приложение» (или «Добавить на главный экран»).'
  : 'Safari → «Поделиться» → «На экран „Домой“».');

export const profile = () => S.profile.find((p) => p.id === 'amelie') || { id: 'amelie', stars: 0, stickers: [], days: {}, rate: 0.85, newPerDay: 6 };
export const saveProfile = (patch) => save('profile', { ...profile(), ...patch, id: 'amelie' });

// ── DOM ──────────────────────────────────────────────────────
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const shuffle = (a) => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const DAY = 86400000;
export const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const startOfDay = (t = Date.now()) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };

export const topicOf = (id) => S.topics.find((t) => t.id === id);
export const wordById = (id) => S.words.find((w) => w.id === id);

// The "picture" of a word: emoji, a paint blob for colours, dots for numbers.
export function wordPic(w, size = '') {
  if (w.color) return `<span class="blob ${size}" style="--c:${w.color}"></span>`;
  if (w.num) return `<span class="num ${size}">${w.num}</span>`;
  return `<span class="emo ${size}">${w.pic || '❓'}</span>`;
}

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

// ── Rewards: stars → a sticker every STAR_STEP stars; daily plan of 3 steps ─────────
export const STICKERS = ['🦄', '🐱', '🌸', '🦋', '🐼', '🍓', '🌈', '🎀', '🐬', '🌻', '🦊', '🍭', '🐞', '⭐', '🐙', '🎨', '🦉', '🧁', '🐢', '🌙'];
export const STAR_STEP = 15;

export async function addStars(n, where) {
  const p = profile();
  const stars = (p.stars || 0) + n;
  const stickers = [...(p.stickers || [])];
  let gotSticker = null;
  while (Math.floor(stars / STAR_STEP) > stickers.length) {
    gotSticker = STICKERS[stickers.length % STICKERS.length];
    stickers.push({ s: gotSticker, ts: Date.now() });
  }
  await saveProfile({ stars, stickers });
  document.dispatchEvent(new CustomEvent('stars', { detail: { stars, gotSticker, where } }));
  if (gotSticker) celebrate(`Новая наклейка! ${gotSticker}`, gotSticker);
  return stars;
}

// Daily plan: words → game → paint/ABC. Completing all three earns a bonus sticker once a day.
export async function markStep(step) {
  const p = profile(); const k = todayKey();
  const days = { ...(p.days || {}) };
  const day = { ...(days[k] || {}) };
  if (day[step]) return;
  day[step] = Date.now(); days[k] = day;
  await saveProfile({ days });
  if (day.words && day.play && day.art && !day.bonus) {
    day.bonus = true; days[k] = day;
    const stickers = [...(profile().stickers || []), { s: '🏆', ts: Date.now(), bonus: true }];
    await saveProfile({ days, stickers });
    celebrate('Все три задания сделаны! Наклейка-кубок 🏆', '🏆');
  }
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
  sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
};
