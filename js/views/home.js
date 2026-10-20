import { S, esc, wordPic, speak, profile, todayKey, DAY, $, STAR_STEP, topicOf, MODE, isStandalone } from '../lib.js';
import { todayQueue, seenWords, learned, activeAssignments, assignmentQueue } from '../srs.js';

const GAMES = [['listen', '👂', 'Listen & find', 'Послушай и найди'], ['spell', '🔤', 'Spell it', 'Собери слово'], ['sensei', '🥋', 'Sensei says', 'Сенсей говорит']];

export default function home(el) {
  const p = profile();
  const day = (p.days || {})[todayKey()] || {};
  const q = todayQueue();
  const game = GAMES[Math.floor(Date.now() / DAY) % GAMES.length];
  const pool = seenWords().length ? seenWords() : S.words.filter((w) => w.topic === 'colours' || w.topic === 'art');
  const wod = pool[Math.floor(Date.now() / DAY) % pool.length];
  const toNext = STAR_STEP - ((p.stars || 0) % STAR_STEP);
  const learnedN = S.words.filter((w) => learned(w.id)).length;
  const complete = day.words && day.play && day.art;
  const next = !day.words ? '#/learn' : !day.play ? `#/${game[0]}` : '#/paint';

  const step = (done, href, ico, c, title, sub) => `<a class="step ${done ? 'done' : ''}" href="${href}" style="--c:${c}">
    <span class="ico">${ico}</span><span class="tx"><b>${title}</b><span>${sub}</span></span><span class="ok">${done ? '✓' : ''}</span></a>`;

  el.innerHTML = `
    <section class="welcome" aria-labelledby="welcome-title">
      <span class="studio-label">Твой альбом английского</span>
      <h1 class="hello" id="welcome-title">Hello, Amelie!</h1>
      <p class="welcome-copy">Немного слов, немного красок.<br>Большие открытия маленькими шагами.</p>
      <img class="welcome-art" src="assets/studio-cat.webp" width="1536" height="1024" alt="Бумажный котёнок в кимоно рисует солнышко" fetchpriority="high">
      <a class="btn full welcome-cta" href="${next}">${complete ? 'Порисуем ещё? →' : day.words ? 'Продолжим играть →' : 'Откроем альбом →'}</a>
      <p class="welcome-footnote">${complete ? 'Ты сегодня столько попробовала. Здорово!' : 'Можно заниматься в своём темпе'}</p>
    </section>

    ${activeAssignments().length ? `<section class="school-section" aria-label="Задания из учебника"><div class="h2">My school · <small>Из учебника</small></div>${activeAssignments().map((a) => {
      const count = assignmentQueue(a).length;
      return `<article class="card homework-card"><b>${esc(a.book)} · стр. ${esc(a.pages)}</b>${a.task ? `<p>${esc(a.task)}</p>` : ''}${a.dueDate ? `<p class="ru">К ${esc(a.dueDate.split('-').reverse().join('.'))}</p>` : ''}<a class="btn sm full" href="#/homework/${encodeURIComponent(a.id)}">${count ? `Повторить слова · ${count}` : 'На сегодня достаточно ✓'}</a></article>`;
    }).join('')}</section>` : ''}

    <div class="h2">Today · <small>Выбери занятие</small></div>
    <div class="plan">
      ${step(day.words, '#/learn', '📒', '#FFD23F', 'Words · Слова', q.length ? `${q.length} карточек — посмотри и послушай` : 'На сегодня всё! Можно поиграть')}
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
