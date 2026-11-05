import { S, esc, wordPic, wordById, speak, sfx, addStars, markStep, celebrate, burst, shuffle, save, $, $$, ICON, viewTimers, paperArt } from '../lib.js';
import { grade } from '../srs.js';
import { UNITS, EPISODES, episodeById, unitOf } from '../course.js';
import { spotlight, clearSpotlights, HOLD_MS } from './play.js';

// #/path — Amelie's route through the textbook; #/ep/<id> — one 5–7 minute episode.
// Steps: meet the words → choose from two pictures (help ladder on a miss) → do something → calm ending.

export const episodeRecord = (id) => S.episodes.find((r) => r.id === 'ep-' + id);
export function episodeStatus(id) {
  const r = episodeRecord(id);
  return !r ? 'new' : r.lastClean ? 'mastered' : 'practising';
}
export const nextEpisode = () => EPISODES.find((e) => episodeStatus(e.id) !== 'mastered') || EPISODES[EPISODES.length - 1];
const STATUS = { new: 'новый', practising: 'ещё потренируемся', mastered: 'получается' };

export function path(el) {
  const next = nextEpisode();
  el.innerHTML = `
    <span class="studio-label">Spotlight 2 · по-своему</span>
    <h1 class="hello" style="font-size:32px">My path</h1>
    <p class="sub">Мой путь по учебнику: короткие встречи по 5 минут. Сначала слушаем, потом выбираем и делаем.</p>
    <a class="card path-next" href="#/ep/${next.id}">${paperArt(next.art, 'lg')}<span><span class="studio-label">Дальше</span><b class="en">${esc(next.en)}</b><span class="ru">${esc(next.ru)}</span></span></a>
    ${UNITS.map((u) => `<section class="path-unit"><div class="h2">${esc(u.ru)}${u.pages ? ` <small>· стр. ${esc(u.pages)}</small>` : ''}</div>
      <div class="path-list">${u.episodes.map((e) => { const st = episodeStatus(e.id); return `<a class="path-step ${st}" href="#/ep/${e.id}">${paperArt(e.art)}<span class="path-text"><b class="en">${esc(e.en)}</b><small>${esc(e.ru)}</small></span><span class="path-status">${st === 'mastered' ? paperArt('check') : ''}<small>${STATUS[st]}</small></span></a>`; }).join('')}</div></section>`).join('')}`;
}

export function episode(el, id) {
  const ep = episodeById(id);
  if (!ep) { el.innerHTML = '<div class="card"><p>Такого эпизода нет.</p><a class="btn" href="#/path">Мой путь</a></div>'; return; }
  const timers = viewTimers(); const after = timers.after;
  const fresh = ep.words.map(wordById).filter(Boolean);
  const review = (ep.review || []).map(wordById).filter(Boolean);
  const all = [...fresh, ...review];
  const missed = new Set(); let helped = 0; let traps = 0; let locked = false;
  const unit = unitOf(ep);

  // Step 1 — meet each new word: picture, word, a tiny scene. Text is there, reading is not required.
  let meet = 0;
  function meetStep() {
    timers.clear();
    const w = fresh[meet];
    el.innerHTML = `
      <div class="progress"><i style="width:${(meet / (fresh.length + 2)) * 100}%"></i></div>
      <div class="card flash ep-meet">
        <span class="studio-label">${esc(unit.ru)}</span>
        ${meet === 0 ? `<p class="ep-scene en">${esc(ep.scene)}</p>` : ''}
        <div class="ep-pic">${wordPic(w, 'lg')}</div>
        <div class="word">${esc(w.en)}</div><div class="word-ru">${esc(w.ru)}</div>
        <div class="row" style="justify-content:center;gap:12px;margin-top:18px">
          <button class="icon-btn" id="again" aria-label="Послушать ещё раз">${ICON.sound}</button>
          <button class="btn" id="next" style="--c:#7FD1AE">Дальше</button>
        </div>
      </div>`;
    const say = () => speak(w.en);
    $('#again', el).onclick = say;
    $('#next', el).onclick = () => { meet++; meet < fresh.length ? meetStep() : chooseStep(); };
    if (meet === 0) { speak(ep.scene); after(say, Math.min(6000, 900 + ep.scene.length * 70)); } else after(say, 300);
  }

  // Step 2 — choose from two pictures. New words come twice, the second time against each other (the trap pair).
  const rounds = [];
  for (const w of fresh) rounds.push({ w, other: review[0] || fresh.find((x) => x !== w) || null });
  for (const w of shuffle(fresh)) rounds.push({ w, other: fresh.find((x) => x !== w) || review[0] || null, trap: fresh.length > 1 });
  for (const w of review) rounds.push({ w, other: fresh[Math.floor(Math.random() * fresh.length)] });
  let r = 0;
  function chooseStep() {
    timers.clear(); locked = false;
    if (r >= rounds.length) return doStep();
    const { w, other } = rounds[r];
    const opts = other ? shuffle([w, other]) : [w];
    let tries = 0;
    el.innerHTML = `
      <div class="progress"><i style="width:${((fresh.length + r / rounds.length) / (fresh.length + 2)) * 100}%"></i></div>
      <div class="prompt">${ep.reading ? `Read and find! <b class="ep-read en">${esc(w.en)}</b>` : 'Listen and find!'}<span class="ru" style="display:block;font-size:14px">${ep.reading ? 'Прочитай слово и найди картинку' : 'Послушай и найди картинку'}</span></div>
      <button class="listen-btn ${ep.reading ? '' : 'pulse'}" id="hear" aria-label="${ep.reading ? 'Подсказка: послушать слово' : 'Послушать ещё раз'}">${ICON.sound}</button>
      <p class="ep-help ru" id="help" role="status"></p>
      <div class="opts two">${opts.map((o) => `<button class="opt" data-id="${o.id}">${wordPic(o, 'lg')}</button>`).join('')}</div>`;
    const say = () => speak(w.en);
    $('#hear', el).onclick = () => { if (ep.reading && !tries) { tries = 1; helped++; missed.add(w.id); } say(); };
    if (!ep.reading) after(say, 250);
    $$('.opt', el).forEach((b) => b.addEventListener('click', () => {
      if (locked) return;
      if (b.dataset.id === w.id) {
        locked = true; sfx.ok(); burst(b); addStars(1, 'path');
        $$('.opt', el).forEach((x) => { x.disabled = true; if (x !== b) x.classList.add('fade'); });
        spotlight(b, w);
        after(() => { clearSpotlights(); r++; chooseStep(); }, HOLD_MS);
        return;
      }
      // Help ladder: 1 — hear it again; 2 — the right card glows and we say it together.
      tries++; missed.add(w.id); sfx.bad();
      if (rounds[r].trap && tries === 1) traps++;
      b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong');
      if (tries === 1) { $('#help', el).textContent = 'Послушай ещё раз'; after(say, 500); }
      else {
        helped++;
        const right = $(`.opt[data-id="${w.id}"]`, el);
        right.classList.add('glow');
        $('#help', el).innerHTML = `Скажем вместе: <b class="en">${esc(w.en)}</b>`;
        after(() => speak(w.en, { rate: 0.7 }), 400);
      }
    }));
  }

  // Step 3 — a small action with the same words: colour, move like in the dojo, find letters.
  function doStep() {
    timers.clear();
    const a = ep.action;
    const link = a.kind === 'colour' ? `#/colour/${a.picture}` : a.kind === 'abc' ? '#/abc' : '';
    el.innerHTML = `
      <div class="progress"><i style="width:${((fresh.length + 1) / (fresh.length + 2)) * 100}%"></i></div>
      <div class="card flash ep-do">
        <span class="studio-label">Let’s do it!</span>
        <div class="ep-pic">${paperArt(a.art || ep.art, 'lg')}</div>
        <div class="word" style="font-size:clamp(24px,7vw,34px)">${esc(a.en)}</div><div class="word-ru">${esc(a.ru)}</div>
        <div class="row" style="justify-content:center;gap:12px;margin-top:18px">
          <button class="icon-btn" id="again" aria-label="Послушать ещё раз">${ICON.sound}</button>
          <button class="btn" id="done" style="--c:#FFD23F">${link ? 'Потом' : 'Сделала!'}</button>
          ${link ? `<a class="btn" id="go" href="${link}" style="--c:#7FD1AE">${a.kind === 'abc' ? 'К буквам' : 'Раскрасить'}</a>` : ''}
        </div>
      </div>`;
    const say = () => speak(a.en);
    $('#again', el).onclick = say; after(say, 300);
    $('#done', el).onclick = () => finish(false);
    $('#go', el)?.addEventListener('click', () => finish(true));
  }

  // Step 4 — calm ending. One review per word feeds the shared spaced-repetition schedule.
  let finished = false;
  async function finish(leaving) {
    if (finished) return; finished = true;
    for (const w of all) grade(w.id, !missed.has(w.id));
    const prev = episodeRecord(ep.id) || { id: 'ep-' + ep.id, runs: 0, clean: 0, helped: 0, traps: 0 };
    const clean = missed.size === 0;
    await save('episodes', { ...prev, runs: prev.runs + 1, clean: prev.clean + (clean ? 1 : 0), helped: prev.helped + helped, traps: prev.traps + traps, last: Date.now(), lastClean: clean });
    markStep('words'); addStars(3, 'path');
    if (leaving) return;
    const next = EPISODES[EPISODES.indexOf(EPISODES.find((e) => e.id === ep.id)) + 1];
    el.innerHTML = `
      <div class="card flash ep-end">
        <div class="ep-pic">${paperArt(clean ? 'trophy' : 'smile', 'lg')}</div>
        <div class="word" style="font-size:34px">${clean ? 'Well done!' : 'Good work!'}</div>
        <div class="word-ru">${clean ? 'Всё получилось сама!' : 'Мы потренировались. В следующий раз будет легче.'}</div>
        <div class="ep-words">${all.map((w) => `<button class="school-word" data-say="${esc(w.id)}">${wordPic(w, 'mini')}<span><b>${esc(w.en)}</b><small>${esc(w.ru)}</small></span></button>`).join('')}</div>
        <div class="row" style="justify-content:center;gap:12px;margin-top:16px;flex-wrap:wrap">
          <button class="btn white" id="again">Ещё раз</button>
          ${next ? `<a class="btn" href="#/ep/${next.id}" style="--c:#7FD1AE">Дальше: ${esc(next.en)}</a>` : ''}
          <a class="btn white" href="#/path">Мой путь</a>
        </div>
      </div>`;
    celebrate(clean ? 'Well done! +3 ⭐' : 'Good work! +3 ⭐', clean ? '🏆' : '😊');
    $$('[data-say]', el).forEach((b) => b.addEventListener('click', () => speak(wordById(b.dataset.say).en)));
    $('#again', el).onclick = () => { timers.stop(); episode(el, ep.id); };
  }

  meetStep();
  return () => timers.stop();
}
