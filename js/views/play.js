import { S, esc, wordPic, speak, sfx, addStars, markStep, celebrate, burst, shuffle, $, $$, ICON, viewTimers } from '../lib.js';
import { seenWords } from '../srs.js';

const ROUNDS = 8;

// Words to play with: the ones Amelie has already met; until then — colours and art studio.
function playPool(topics = null) {
  let pool = seenWords();
  if (pool.length < 6) pool = S.words.filter((w) => ['colours', 'art', 'picture', 'hello'].includes(w.topic));
  if (topics) {
    const t = S.words.filter((w) => topics.includes(w.topic));
    pool = t.filter((w) => pool.includes(w)).length >= 4 ? t.filter((w) => pool.includes(w)) : t;
  }
  return pool;
}

export function playHub(el) {
  const games = [
    ['listen', '👂', 'Listen & find', 'Послушай и найди картинку', '#FFD23F'],
    ['spell', '🔤', 'Spell it', 'Собери слово из букв', '#7FD1AE'],
    ['sensei', '🥋', 'Sensei says', 'Сенсей говорит — айкидо', '#B9A3FF'],
    ['paint', '🖍️', 'Colour it', 'Раскрась по-английски', '#FFB3CF'],
  ];
  el.innerHTML = `
    <div class="hello" style="font-size:34px">Let's play!</div>
    <div class="sub">Давай поиграем · за каждый правильный ответ — звезда ⭐</div>
    <div class="grid2" style="margin-top:16px">
      ${games.map(([r, e, t, s, c]) => `<a class="tile painted" href="#/${r}" style="--c:${c};min-height:150px"><span class="big" style="font-size:50px">${e}</span><span class="t en">${t}</span><span class="s">${s}</span></a>`).join('')}
    </div>`;
}

// Shared engine: hear a phrase → tap the right picture out of four.
function choiceGame(el, { title, sub, pool, phrase, step = 'play' }) {
  const timers = viewTimers(); const after = timers.after;
  const words = shuffle(pool).slice(0, Math.min(ROUNDS, pool.length));
  let i = 0; let right = 0; let missed = false; let locked = false;

  function round() {
    timers.clear(); locked = false;
    if (i >= words.length) return finish();
    const w = words[i]; missed = false;
    const others = shuffle(pool.filter((x) => x.id !== w.id && x.en !== w.en)).slice(0, 3);
    const opts = shuffle([w, ...others]);
    el.innerHTML = `
      <div class="progress"><i style="width:${(i / words.length) * 100}%"></i></div>
      <div class="prompt">${title}<span class="ru" style="display:block;font-size:14px">${sub}</span></div>
      <button class="listen-btn pulse" id="hear" aria-label="Послушать ещё раз">🔊</button>
      <div class="opts">${opts.map((o) => `<button class="opt" data-id="${o.id}">${wordPic(o, 'lg')}</button>`).join('')}</div>`;
    const say = () => speak(phrase(w));
    $('#hear', el).onclick = say;
    after(say, 250);
    $$('.opt', el).forEach((b) => b.addEventListener('click', () => {
      if (locked) return;
      if (b.dataset.id === w.id) {
        locked = true; b.classList.add('right'); b.insertAdjacentHTML('beforeend', `<span class="lab">${esc(w.en)}</span>`);
        sfx.ok(); burst(b); if (!missed) right++; addStars(1, step);
        $$('.opt', el).forEach((x) => { x.disabled = true; });
        after(() => { i++; round(); }, 1100);
      } else {
        b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong');
        sfx.bad(); missed = true; after(say, 400);
      }
    }));
  }

  function finish() {
    markStep(step);
    el.innerHTML = `<div class="card flash"><div style="font-size:84px">${right === words.length ? '🏆' : '🌟'}</div>
      <div class="word" style="font-size:36px">${right === words.length ? 'Perfect!' : 'Great job!'}</div>
      <div class="word-ru">${right} из ${words.length} с первого раза</div>
      <button class="btn" id="again" style="--c:#FFD23F">🔁 Ещё раз</button><a class="btn white" href="#/play">🎲 Другие игры</a></div>`;
    $('#again', el).onclick = () => { i = 0; right = 0; words.splice(0, words.length, ...shuffle(pool).slice(0, Math.min(ROUNDS, pool.length))); round(); };
    addStars(3, step); celebrate(`${right} из ${words.length}! +3 ⭐`, '🎉');
  }
  round();
  return () => timers.stop();
}

export function listen(el) {
  return choiceGame(el, { title: 'Listen and find!', sub: 'Послушай и найди картинку', pool: playPool(), phrase: (w) => w.en });
}

export function sensei(el) {
  // Aikido-style commands; body words become "Show me your …".
  const pool = playPool(['aikido', 'body', 'ican']);
  return choiceGame(el, {
    title: '🥋 Sensei says…', sub: 'Сенсей говорит — найди, что он просит', pool,
    phrase: (w) => (w.topic === 'body' ? `Show me your ${w.en}!` : w.topic === 'ican' ? `Can you ${w.en}?` : `Sensei says: ${w.en}!`),
  });
}

// Spell it: picture + sound → tap the letters in order.
export function spell(el) {
  const timers = viewTimers(); const after = timers.after;
  const pool = playPool().filter((w) => /^[a-z ]{2,8}$/.test(w.en));
  const words = shuffle(pool).slice(0, 6);
  let i = 0; let right = 0;
  const colors = ['#FFD23F', '#7FD1AE', '#FFB3CF', '#B9A3FF', '#9CC9FF', '#FFC48A'];

  function round() {
    timers.clear();
    if (i >= words.length) {
      markStep('play'); addStars(3, 'play');
      el.innerHTML = `<div class="card flash"><div style="font-size:84px">🔤</div><div class="word" style="font-size:36px">Super speller!</div>
        <div class="word-ru">${right} из ${words.length} без ошибок</div>
        <button class="btn" id="again" style="--c:#FFD23F">🔁 Ещё раз</button><a class="btn white" href="#/play">🎲 Другие игры</a></div>`;
      $('#again', el).onclick = () => { i = 0; right = 0; words.splice(0, 6, ...shuffle(pool).slice(0, 6)); round(); };
      celebrate(`Super speller! +3 ⭐`, '🔤');
      return;
    }
    const w = words[i]; const target = w.en; let pos = 0; let missed = false;
    const letters = shuffle([...target.replace(/ /g, '')].map((ch, k) => ({ ch, k })));
    el.innerHTML = `
      <div class="progress"><i style="width:${(i / words.length) * 100}%"></i></div>
      <div class="prompt">Spell it!<span class="ru" style="display:block;font-size:14px">Собери слово по буквам</span></div>
      <div class="card" style="text-align:center;padding:18px">
        <button class="icon-btn say" id="hear">${ICON.sound}</button>
        ${wordPic(w, 'lg')}<div class="ru" style="margin-top:6px">${esc(w.ru)}</div>
        <div class="slots">${[...target].map((ch) => `<span class="slot ${ch === ' ' ? 'gap' : ''}"></span>`).join('')}</div>
      </div>
      <div class="letters" style="margin-top:16px">${letters.map((l, n) => `<button class="letter" data-ch="${l.ch}" style="--c:${colors[n % colors.length]}">${l.ch}</button>`).join('')}</div>
      <p style="text-align:center;margin-top:16px"><button class="ru" id="hint" style="text-decoration:underline">💡 Подсказка</button></p>`;
    const slots = $$('.slot', el);
    const say = () => speak(w.en);
    $('#hear', el).onclick = say; after(say, 250);
    $('#hint', el).onclick = () => { missed = true; const s = target.replace(/ /g, ''); const next = $$('.letter:not(.used)', el).find((b) => b.dataset.ch === s[pos]); next?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], 500); };
    $$('.letter', el).forEach((b) => b.addEventListener('click', () => {
      const plain = target.replace(/ /g, '');
      if (b.disabled || b.classList.contains('used') || pos >= plain.length) return;
      if (b.dataset.ch === plain[pos]) {
        // fill the next non-space slot
        const free = slots.filter((s) => !s.classList.contains('gap') && !s.classList.contains('f'))[0];
        free.textContent = b.dataset.ch; free.classList.add('f'); b.classList.add('used'); b.disabled = true; sfx.pop(); pos++;
        if (pos === plain.length) { sfx.ok(); if (!missed) right++; addStars(1, 'play'); say(); after(() => { i++; round(); }, 1200); }
      } else { b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong'); sfx.bad(); missed = true; }
    }));
  }
  round();
  return () => timers.stop();
}
