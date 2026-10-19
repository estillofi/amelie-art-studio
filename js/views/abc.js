import { S, esc, speak, sfx, addStars, markStep, celebrate, burst, shuffle, wordPic, $, $$, ICON } from '../lib.js';

// Letter names spelled so the speech engine says them right (British "zed").
const NAMES = { A: 'ay', B: 'bee', C: 'see', D: 'dee', E: 'ee', F: 'ef', G: 'jee', H: 'aitch', I: 'eye', J: 'jay', K: 'kay', L: 'el', M: 'em', N: 'en', O: 'oh', P: 'pee', Q: 'cue', R: 'ar', S: 'ess', T: 'tee', U: 'you', V: 'vee', W: 'double you', X: 'ex', Y: 'why', Z: 'zed' };
// Letters with no word in the app yet get a classic picture word.
const EXTRA = { Q: ['queen', 'королева', '👸'], U: ['umbrella', 'зонтик', '☂️'], V: ['violin', 'скрипка', '🎻'], X: ['fox', 'лиса (x в конце)', '🦊'], Z: ['zebra', 'зебра', '🦓'], I: ['ice cream', 'мороженое', '🍦'], J: ['juice', 'сок', '🧃'], K: ['kite', 'воздушный змей', '🪁'], N: ['nose', 'нос', '👃'], O: ['orange', 'оранжевый', '🟠'], E: ['eyes', 'глаза', '👀'], Y: ['yellow', 'жёлтый', '🟡'] };
const PREFER = ['art', 'colours', 'picture', 'animals', 'aikido'];
const COLORS = ['#FFD23F', '#7FD1AE', '#FFB3CF', '#B9A3FF', '#9CC9FF', '#FFC48A'];
const LETTERS = Object.keys(NAMES);

function exampleFor(L) {
  const ws = S.words.filter((w) => w.en[0].toUpperCase() === L && !w.en.includes(' '))
    .sort((a, b) => (PREFER.indexOf(a.topic) + 1 || 99) - (PREFER.indexOf(b.topic) + 1 || 99));
  if (ws.length) return ws[0];
  const [en, ru, pic] = EXTRA[L] || [L, '', '🔤'];
  return { en, ru, pic };
}

export default function abc(el, mode) {
  if (mode === 'quiz') return quiz(el);
  el.innerHTML = `
    <div class="hello" style="font-size:34px">ABC</div>
    <div class="sub">Английский алфавит · нажми на букву и послушай</div>
    <div id="card"></div>
    <a class="btn full" href="#/abc/quiz" style="margin:14px 0;--c:#7FD1AE">🔎 Игра «Найди букву»</a>
    <div class="abc">${LETTERS.map((L, i) => `<button data-l="${L}" style="--c:${COLORS[i % COLORS.length]}">${L}${L.toLowerCase()}<small>${exampleFor(L).pic || ''}</small></button>`).join('')}</div>`;

  function show(L) {
    const w = exampleFor(L);
    $('#card', el).innerHTML = `<div class="card abc-card" style="margin-top:14px">
      <button class="icon-btn say" id="again">${ICON.sound}</button>
      <div class="L">${L}<span>${L.toLowerCase()}</span></div>
      <div class="row" style="justify-content:center;gap:12px;margin-top:6px">${wordPic(w, 'lg')}<div style="text-align:left"><div class="en" style="font-size:28px">${esc(w.en)}</div><div class="ru">${esc(w.ru)}</div></div></div>
      <div class="en" style="margin-top:8px;font-size:18px">${L} is for ${esc(w.en)}.</div></div>`;
    const say = () => { speak(NAMES[L]); setTimeout(() => speak(`${NAMES[L]} is for ${w.en}`), 700); };
    $('#again', el).onclick = say; say();
    markStep('art');
  }
  $$('[data-l]', el).forEach((b) => b.addEventListener('click', () => { sfx.pop(); show(b.dataset.l); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
}

// Hear a letter name → tap it among four.
function quiz(el) {
  const rounds = shuffle(LETTERS).slice(0, 8);
  let i = 0; let right = 0; let missed = false;
  function round() {
    if (i >= rounds.length) {
      markStep('art'); addStars(3, 'abc');
      el.innerHTML = `<div class="card flash"><div style="font-size:84px">🔤</div><div class="word" style="font-size:36px">ABC star!</div><div class="word-ru">${right} из ${rounds.length} с первого раза</div>
        <button class="btn" id="again" style="--c:#FFD23F">🔁 Ещё раз</button><a class="btn white" href="#/abc">🔤 Алфавит</a></div>`;
      $('#again', el).onclick = () => quiz(el);
      celebrate(`ABC star! +3 ⭐`, '🔤');
      return;
    }
    const L = rounds[i]; missed = false;
    const opts = shuffle([L, ...shuffle(LETTERS.filter((x) => x !== L)).slice(0, 3)]);
    el.innerHTML = `
      <div class="progress"><i style="width:${(i / rounds.length) * 100}%"></i></div>
      <div class="prompt">Find the letter!<span class="ru" style="display:block;font-size:14px">Найди букву, которую слышишь</span></div>
      <button class="listen-btn pulse" id="hear">🔊</button>
      <div class="opts">${opts.map((x, n) => `<button class="opt" data-l="${x}" style="background:${COLORS[n]}"><span class="en" style="font-size:56px">${x}${x.toLowerCase()}</span></button>`).join('')}</div>`;
    const say = () => speak(NAMES[L]);
    $('#hear', el).onclick = say; setTimeout(say, 250);
    $$('.opt', el).forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.l === L) { b.classList.add('right'); sfx.ok(); burst(b); if (!missed) right++; addStars(1, 'abc'); setTimeout(() => { i++; round(); }, 900); }
      else { b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong'); sfx.bad(); missed = true; setTimeout(say, 400); }
    }));
  }
  round();
}
