// The course: a map of modules → lessons, and the lesson player.
// Each lesson runs the methodical loop: look & listen → say → find → trap (help ladder) → check → result.
import { S, esc, wordPic, speak, sfx, addStars, markStep, celebrate, burst, shuffle, save, profile, saveProfile, $, $$, ICON } from '../lib.js';
import { grade, seen } from '../srs.js';
import { spotlight, clearSpotlights, HOLD_MS } from './play.js';
import { NAMES } from './abc.js';

const lessonProg = (id) => S.progress.find((p) => p.id === `lesson-${id}`);
export const allLessons = () => S.course.flatMap((m) => m.lessons.map((l) => ({ ...l, module: m })));
export const findLesson = (id) => allLessons().find((l) => l.id === id);
export const lessonStatus = (id) => lessonProg(id)?.status || 'new'; // new | retry | mastered
export const homeworkList = () => (profile().homework || []).filter((h) => findLesson(h.lesson));
export const pendingHomework = () => homeworkList().filter((h) => !h.doneAt);
// Next lesson to do: homework first, then the first not-mastered lesson in course order.
export function nextLesson() {
  const hw = pendingHomework()[0];
  if (hw) return { lesson: findLesson(hw.lesson), homework: hw };
  const l = allLessons().find((x) => lessonStatus(x.id) !== 'mastered');
  return l ? { lesson: l } : null;
}
const STATUS = { mastered: ['✓', 'Освоено'], retry: ['↺', 'Повторить'], new: ['', 'Новый'] };

// #/course
export function courseMap(el) {
  const next = nextLesson();
  const hw = new Set(pendingHomework().map((h) => h.lesson));
  el.innerHTML = `
    <div class="hello" style="font-size:34px">My lessons</div>
    <div class="sub">Мои уроки · по шагам, как в учебнике, только про рисование и айкидо</div>
    ${next ? `<a class="btn full" href="#/lesson/${next.lesson.id}" style="margin:16px 0 6px;--c:#FFD447">${next.homework ? '📌 Домашка: ' : '▶︎ Дальше: '}${esc(next.lesson.en)}</a>` : '<div class="note" style="margin-top:14px">🏆 Все уроки освоены!</div>'}
    ${S.course.map((m) => {
      const done = m.lessons.filter((l) => lessonStatus(l.id) === 'mastered').length;
      return `<section class="card mod" style="--c:${m.color}">
        <div class="mod-h"><span class="mod-ic">${m.icon}</span><div style="min-width:0">
          <div class="mod-t">${m.bridge ? 'Start here · ' : `Module ${m.n} · `}${esc(m.en)}</div>
          <div class="sub" style="font-size:14px">${esc(m.ru)} · ${done}/${m.lessons.length}</div></div></div>
        <div class="stones">${m.lessons.map((l, i) => {
          const st = lessonStatus(l.id);
          return `<a class="stone ${st} ${hw.has(l.id) ? 'hw' : ''}" href="#/lesson/${l.id}">
            <span class="stone-n">${st === 'mastered' ? '✓' : hw.has(l.id) ? '📌' : i + 1}</span>
            <span class="stone-t"><b>${l.icon} ${esc(l.en)}</b><span>${esc(l.ru)}</span></span></a>`;
        }).join('')}</div></section>`;
    }).join('')}`;
}

// ── Shared steps ────────────────────────────────────────────
// Choice with the help ladder: 1st miss → listen again slowly, 2nd → hint, 3rd → show the answer and say it aloud.
function choice(el, item, { title, onDone }) {
  let tries = 0; let finished = false;
  const say = (slow) => speak(item.say, slow ? { rate: 0.6 } : {});
  el.innerHTML = `
    <div class="prompt">${title}</div>
    <div class="card" style="text-align:center;padding:16px">
      <button class="listen-btn" id="hear" aria-label="Послушать">🔊</button>
      <div class="en" style="font-size:24px">${esc(item.q)}</div>
      <div class="ru" style="margin-top:4px">${esc(item.qru)}</div>
    </div>
    <div class="opts opts1" style="margin-top:16px">${item.options.map((o, i) => `<button class="opt txt" data-i="${i}">${esc(o)}</button>`).join('')}</div>
    <div id="ladder"></div>`;
  $('#hear', el).onclick = () => say(tries >= 1);
  setTimeout(() => say(false), 250);
  $$('.opt', el).forEach((b) => b.addEventListener('click', () => {
    if (finished) return;
    const i = Number(b.dataset.i);
    if (i === item.answer) {
      finished = true; sfx.ok(); burst(b); b.classList.add('right');
      $$('.opt', el).forEach((x) => { if (x !== b) x.classList.add('fade'); });
      setTimeout(() => onDone(tries === 0), 1400);
      return;
    }
    tries++; sfx.bad(); b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong');
    const lad = $('#ladder', el);
    if (tries === 1) { lad.innerHTML = '<div class="hint-box">🐢 Послушай ещё раз — медленно.</div>'; setTimeout(() => say(true), 400); }
    else if (tries === 2) { lad.innerHTML = `<div class="hint-box">💡 ${esc(item.hint)}</div>`; }
    else {
      finished = true;
      const right = $$('.opt', el)[item.answer];
      right.classList.add('right');
      $$('.opt', el).forEach((x) => { if (x !== right) x.classList.add('fade'); });
      lad.innerHTML = `<div class="hint-box">👉 Правильно так. Скажи вслух вместе со мной!</div><button class="btn full" id="go" style="margin-top:12px;--c:#9AD7C9">Дальше →</button>`;
      say(true);
      $('#go', el).onclick = () => onDone(false);
    }
  }));
}

// Listen-and-find rounds over lesson items (words or letters), with the spotlight reveal.
function findRounds(el, items, pool, { title, rounds, onDone }) {
  const list = shuffle(items).slice(0, rounds);
  let i = 0; let right = 0; let missed = false;
  function round() {
    if (i >= list.length) return onDone(right, list.length);
    const it = list[i]; missed = false;
    const opts = shuffle([it, ...shuffle(pool.filter((x) => x.id !== it.id)).slice(0, 3)]);
    el.innerHTML = `
      <div class="prompt">${title}<span class="ru" style="display:block;font-size:14px">Послушай и найди · ${i + 1} из ${list.length}</span></div>
      <button class="listen-btn pulse" id="hear" aria-label="Послушать ещё раз">🔊</button>
      <div class="opts">${opts.map((o) => `<button class="opt" data-id="${o.id}">${o.face}</button>`).join('')}</div>`;
    const say = () => speak(it.say);
    $('#hear', el).onclick = say; setTimeout(say, 250);
    $$('.opt', el).forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.id === it.id) {
        sfx.ok(); burst(b); if (!missed) right++;
        $$('.opt', el).forEach((x) => { x.disabled = true; if (x !== b) x.classList.add('fade'); });
        spotlight(b, it.card);
        setTimeout(() => { clearSpotlights(); i++; round(); }, HOLD_MS);
      } else { b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong'); sfx.bad(); missed = true; setTimeout(say, 400); }
    }));
  }
  round();
}

// Items for find rounds: words, or letters (said by their English names).
function itemsOf(L) {
  if (L.letters) {
    const all = Object.keys(NAMES).map((ch) => ({ id: `L-${ch}`, say: NAMES[ch], face: `<span class="en" style="font-size:54px">${ch}${ch.toLowerCase()}</span>`, card: { pic: ch, en: ch, ru: `«${NAMES[ch]}»` } }));
    return { items: all.filter((x) => L.letters.includes(x.id.slice(2))), pool: all };
  }
  const toItem = (w) => ({ id: w.id, say: w.en, face: wordPic(w, 'lg'), card: w });
  const items = L.words.map((id) => S.words.find((w) => w.id === id)).filter(Boolean).map(toItem);
  const topics = new Set(items.map((x) => x.card.topic));
  const pool = [...items, ...S.words.filter((w) => topics.has(w.topic) && !L.words.includes(w.id)).map(toItem)];
  return { items, pool };
}

// #/lesson/<id>
export function lessonPlayer(el, id) {
  const L = findLesson(id);
  if (!L) { location.hash = '#/course'; return; }
  const { items, pool } = itemsOf(L);
  const words = L.words.map((wid) => S.words.find((w) => w.id === wid)).filter(Boolean);
  const STEPS = [['look', '👀', 'Смотри'], ['say', '🗣️', 'Скажи'], ['find', '👂', 'Найди'], ['trap', '🧩', 'Задачка'], ['check', '⭐', 'Проверка']];
  let si = 0; let alive = true;
  const errors = {}; let checkRight = 0; let checkTotal = 0;
  const body = () => $('#lbody', el);

  el.innerHTML = `
    <div class="row" style="gap:12px;margin:2px 0 6px"><span style="font-size:40px">${L.icon}</span>
      <div style="min-width:0"><div class="hello" style="font-size:30px;margin:0">${esc(L.en)}</div><div class="sub">${esc(L.ru)}</div></div></div>
    <div class="stepbar" id="sb"></div>
    <div id="lbody"></div>`;

  function bar() {
    $('#sb', el).innerHTML = STEPS.map(([k, e, t], n) => `<span class="${n < si ? 'done' : n === si ? 'on' : ''}"><i>${n < si ? '✓' : e}</i>${t}</span>`).join('');
  }
  function next() { if (!alive) return; clearSpotlights(); si++; bar(); run(); }

  function run() {
    const k = STEPS[si]?.[0];
    window.scrollTo(0, 0);
    if (k === 'look') {
      body().innerHTML = `
        <div class="card" style="margin-top:12px"><div class="kicker-ru">🎯 Сегодня научимся</div><div style="font-size:17px;font-weight:800;margin-top:4px">${esc(L.can)}</div></div>
        ${L.letters ? `<div class="abc" style="margin-top:16px">${L.letters.map((ch) => `<button data-l="${ch}" style="--c:#FFE08A">${ch}${ch.toLowerCase()}</button>`).join('')}</div>` : ''}
        <div class="wgrid" style="margin-top:16px">${words.map((w) => `<button class="w" data-w="${w.id}">${wordPic(w)}<span class="en">${esc(w.en)}</span><span class="ru">${esc(w.ru)}</span></button>`).join('')}</div>
        <p class="sub" style="text-align:center;margin:12px 0 0">Нажми на каждую картинку и послушай</p>
        <button class="btn full" id="go" style="margin-top:14px;--c:#9AD7C9">Дальше →</button>`;
      $$('[data-w]', body()).forEach((b) => b.addEventListener('click', () => speak(S.words.find((w) => w.id === b.dataset.w).en)));
      $$('[data-l]', body()).forEach((b) => b.addEventListener('click', () => {
        const ch = b.dataset.l; const ex = words.find((w) => w.en[0].toUpperCase() === ch);
        speak(NAMES[ch]); if (ex) setTimeout(() => speak(`${NAMES[ch]} is for ${ex.en}`), 700);
      }));
      $('#go', body()).onclick = next;
    } else if (k === 'say') {
      body().innerHTML = `
        <div class="prompt" style="margin-top:12px">Listen and say!<span class="ru" style="display:block;font-size:14px">Нажми, послушай и повтори вслух</span></div>
        <div class="saylist">${L.chunks.map((c, n) => `<button class="card sayrow" data-n="${n}"><span class="icon-btn" aria-hidden="true">${ICON.sound}</span>
          <span style="min-width:0;text-align:left"><span class="en" style="font-size:22px;display:block">${esc(c.en)}</span><span class="ru">${esc(c.ru)}</span></span></button>`).join('')}</div>
        <button class="btn full" id="go" style="margin-top:16px;--c:#9AD7C9">🗣️ Я повторила →</button>`;
      $$('.sayrow', body()).forEach((b) => b.addEventListener('click', () => { speak(L.chunks[Number(b.dataset.n)].en); b.classList.add('said'); }));
      setTimeout(() => speak(L.chunks[0].en), 300);
      $('#go', body()).onclick = next;
    } else if (k === 'find') {
      findRounds(body(), items, pool, { title: L.letters ? 'Find the letter!' : 'Listen and find!', rounds: Math.min(4, items.length), onDone: () => next() });
    } else if (k === 'trap') {
      choice(body(), L.trap, { title: '🧩 A tricky one!', onDone: (first) => { if (!first) errors[L.trap.error] = (errors[L.trap.error] || 0) + 1; next(); } });
    } else if (k === 'check') {
      // Closing check: two fresh find items + the check question aimed at the second typical mistake.
      findRounds(body(), items, pool, {
        title: '⭐ Check!', rounds: Math.min(2, items.length),
        onDone: (r, n) => {
          checkRight += r; checkTotal += n;
          choice(body(), L.check, { title: '⭐ Last one!', onDone: (first) => { checkTotal++; if (first) checkRight++; else errors[L.check.error] = (errors[L.check.error] || 0) + 1; finish(); } });
        },
      });
    }
  }

  async function finish() {
    if (!alive) return;
    const mastered = checkRight >= checkTotal - 1;
    const prev = lessonProg(L.id);
    const allErr = { ...(prev?.errors || {}) };
    for (const [e, n] of Object.entries(errors)) allErr[e] = (allErr[e] || 0) + n;
    await save('progress', { id: `lesson-${L.id}`, kind: 'lesson', status: mastered ? 'mastered' : 'retry', score: `${checkRight}/${checkTotal}`, errors: allErr, last: Object.keys(errors), tries: (prev?.tries || 0) + 1, ts: Date.now() });
    // New words of the lesson go into the daily cards.
    for (const w of words) if (!seen(w.id)) grade(w.id, true);
    // Homework done?
    const hw = profile().homework || [];
    if (hw.some((h) => h.lesson === L.id && !h.doneAt)) await saveProfile({ homework: hw.map((h) => (h.lesson === L.id && !h.doneAt ? { ...h, doneAt: Date.now(), result: mastered ? 'mastered' : 'retry' } : h)) });
    markStep('play'); addStars(mastered ? 5 : 3, 'lesson');
    si = STEPS.length; bar();
    const doBtn = L.do?.kind === 'colour' ? `<a class="btn full" href="#/colour/${L.do.pic}" style="--c:#FFB3CF">🎨 Раскрась по-английски</a>`
      : L.do?.kind === 'sensei' ? '<a class="btn full" href="#/sensei" style="--c:#B9A3FF">🥋 Sensei says</a>' : '';
    body().innerHTML = `<div class="card flash" style="margin-top:12px"><div style="font-size:84px">${mastered ? '🏆' : '🌱'}</div>
      <div class="word" style="font-size:34px">${mastered ? 'You can do it!' : 'Good try!'}</div>
      <div class="word-ru">${mastered ? 'Теперь ты умеешь:' : 'Почти! Повторим этот урок ещё раз завтра.'}</div>
      ${mastered ? `<div class="ex" style="font-size:16px">${esc(L.can)}</div>` : ''}
      <div class="row" style="flex-direction:column;align-items:stretch;width:100%;gap:10px">${doBtn}<a class="btn white full" href="#/course">📚 К урокам</a></div></div>`;
    celebrate(mastered ? `Урок освоен! +5 ⭐` : 'Хорошая попытка! +3 ⭐', mastered ? '🏆' : '🌱');
  }

  bar(); run();
  return () => { alive = false; clearSpotlights(); };
}
