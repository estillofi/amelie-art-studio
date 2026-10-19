import { S, esc, wordPic, speak, profile, todayKey, streak, DAY, $, STAR_STEP, topicOf, MODE, isStandalone } from '../lib.js';
import { todayQueue, seenWords, learned } from '../srs.js';

const GAMES = [['listen', '👂', 'Listen & find', 'Послушай и найди'], ['spell', '🔤', 'Spell it', 'Собери слово'], ['sensei', '🥋', 'Sensei says', 'Сенсей говорит']];

export default function home(el) {
  const p = profile();
  const day = (p.days || {})[todayKey()] || {};
  const q = todayQueue();
  const game = GAMES[Math.floor(Date.now() / DAY) % GAMES.length];
  const pool = seenWords().length ? seenWords() : S.words.filter((w) => w.topic === 'colours' || w.topic === 'art');
  const wod = pool[Math.floor(Date.now() / DAY) % pool.length];
  const st = streak();
  const toNext = STAR_STEP - ((p.stars || 0) % STAR_STEP);
  const learnedN = S.words.filter((w) => learned(w.id)).length;

  const step = (done, href, ico, c, title, sub) => `<a class="step ${done ? 'done' : ''}" href="${href}" style="--c:${c}">
    <span class="ico">${ico}</span><span class="tx"><b>${title}</b><span>${sub}</span></span><span class="ok">${done ? '✓' : ''}</span></a>`;

  // A cut-paper plant in the style of the art studio's mural.
  const plant = `<svg class="mural" viewBox="0 0 90 140" style="right:-6px;top:-18px;width:64px" aria-hidden="true">
    <path d="M44 140 C44 100 46 70 52 40" stroke="#3FA796" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M46 96 C20 92 8 70 10 54 C30 58 44 76 46 96 Z" fill="#3FA796"/>
    <path d="M48 80 C70 74 84 54 82 38 C62 44 50 60 48 80 Z" fill="#5CC2AE"/>
    <path d="M52 40 C40 34 38 18 44 8 C48 16 52 22 54 26 C58 18 62 12 68 8 C70 22 64 36 52 40 Z" fill="#F0855B"/>
    <path d="M54 26 C52 18 52 10 56 4 C60 12 58 20 54 26 Z" fill="#F7A1C4"/></svg>`;

  el.innerHTML = `
    <div style="position:relative">${plant}
    <div class="hello">Hello, Amelie!</div>
    <div class="sub" style="margin-right:56px">${st ? `🔥 ${st} ${st === 1 ? 'день' : st < 5 ? 'дня' : 'дней'} подряд · ` : ''}Сегодня рисуем по-английски 🎨</div>
    </div>

    <div class="h2">Today · <small>План на сегодня</small></div>
    <div class="plan">
      ${step(day.words, '#/learn', '📒', '#FFD23F', 'Words · Слова', q.length ? `${q.length} карточек — посмотри и послушай` : 'Все карточки на сегодня пройдены!')}
      ${step(day.play, `#/${game[0]}`, game[1], '#7FD1AE', `${game[2]}`, game[3])}
      ${step(day.art, '#/paint', '🖍️', '#FFB3CF', 'Paint · Раскраска', 'Раскрась по-английски')}
    </div>
    ${day.words && day.play && day.art ? '<div class="note" style="margin-top:12px">🏆 Все три задания на сегодня сделаны! Можно рисовать сколько хочешь.</div>' : ''}

    <div class="h2">Word of the day · <small>Слово дня</small></div>
    ${wod ? `<button class="card hero" id="wod" style="width:100%;text-align:left">
      <span class="wash" style="width:170px;height:150px;right:-40px;top:-40px;background:${topicOf(wod.topic)?.color || '#FFD23F'}"></span>
      <span class="wash" style="width:120px;height:110px;left:-30px;bottom:-50px;background:#3A86FF"></span>
      <span class="row" style="gap:16px">${wordPic(wod, 'lg')}<span><span class="en" style="font-size:34px;display:block">${esc(wod.en)}</span><span class="ru">${esc(wod.ru)} · нажми и послушай 🔊</span></span></span>
      <span class="en" style="margin-top:10px;font-size:18px">${esc(wod.ex)}</span><span class="ru" style="font-size:14px">${esc(wod.exRu)}</span>
    </button>` : ''}

    <div class="grid2" style="margin-top:22px">
      <a class="tile painted" href="#/gallery" style="--c:#FF70A6"><span class="big">⭐</span><span class="t">${p.stars || 0} звёзд</span><span class="s">ещё ${toNext} до наклейки</span></a>
      <a class="tile painted" href="#/words" style="--c:#3BB273"><span class="big">📒</span><span class="t">${learnedN} слов</span><span class="s">уже знаю</span></a>
    </div>

    ${MODE === 'static' && !isStandalone() ? '<div class="note" style="margin-top:20px">📌 Попроси взрослого добавить меня на экран «Домой» — тогда звёзды и рисунки не потеряются.</div>' : ''}
    <p style="text-align:center;margin:28px 0 8px"><a class="ru" href="#/parents" style="text-decoration:underline">Для родителей</a></p>`;

  $('#wod', el)?.addEventListener('click', () => { speak(wod.en); setTimeout(() => speak(wod.ex), 1200); });
}
