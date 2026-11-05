import { S, esc, speak, sfx, addStars, markStep, celebrate, burst, shuffle, save, uid, $, $$, ICON, viewTimers, paperArt } from '../lib.js';
import { loadUpload, render } from '../colouring/upload.js';
import { regionAt } from '../colouring/trace.js';
import { drawingSignature } from '../colouring/gallery.js';

// #/colour/u-… — the same lesson as the built-in pictures, on a page Mum uploaded:
// listen "Colour the cat orange", choose the crayon, tap the cat. Free painting afterwards.
const colours = () => S.words.filter((w) => w.topic === 'colours');

export async function paintUpload(el, upload, mode) {
  const timers = viewTimers(); const after = timers.after;
  el.innerHTML = '<div class="card"><p class="sub" style="margin:0">Готовим картинку…</p></div>';
  let model;
  try { model = await loadUpload(upload); } catch (error) { el.innerHTML = `<div class="card"><p>${esc(error.message)}</p><a class="btn" href="#/paint">К раскраскам</a></div>`; return; }
  const byN = new Map(upload.regions.map((r) => [r.n, r]));
  const words = [...new Map(upload.regions.map((r) => [r.en, r])).values()];
  const fills = {};
  let free = mode === 'free' || !words.length;
  let crayon = null; let tasks = []; let t = 0; let misses = 0; let firstTry = 0; let saving = false;

  const drawing = () => ({ pic: upload.id, fills: { ...fills } });
  const alreadySaved = () => S.gallery.some((item) => drawingSignature(item) === drawingSignature(drawing()));
  const regionsOf = (en) => upload.regions.filter((r) => r.en === en).map((r) => r.n);

  function makeTasks() {
    const cs = colours().filter((c) => c.en !== 'white');
    let last = '';
    tasks = shuffle(words).map((r) => {
      let c = cs.find((x) => x.en === r.colour && x.en !== last);
      if (!c) do { c = cs[Math.floor(Math.random() * cs.length)]; } while (cs.length > 1 && c.en === last);
      last = c.en; return { en: r.en, ru: r.ru, colour: c };
    });
  }
  const sayTask = () => { const k = tasks[t]; if (k) speak(`Colour the ${k.en} ${k.colour.en}.`); };

  function paintCanvas() {
    const k = tasks[t];
    render($('#cv canvas', el), model, fills, !free && k && misses >= 2 ? new Set(regionsOf(k.en)) : null);
  }

  function saveState() {
    const button = $('#save', el); if (!button) return;
    const empty = !Object.keys(fills).length; const saved = !empty && alreadySaved();
    button.disabled = saving || empty || saved;
    button.textContent = saving ? 'Сохраняем…' : saved ? 'Уже в галерее' : 'В галерею';
    $('#save-note', el).textContent = empty ? 'Выбери цвет и раскрась первую деталь.' : saved ? 'Можно раскрасить ещё и сохранить новый вариант.' : 'Сохрани свой рисунок, когда захочешь.';
  }

  function view() {
    const k = tasks[t];
    el.innerHTML = `
      ${free ? `<div class="task"><div class="tx"><span class="en">Free painting</span><span class="ru">Раскрашивай как хочешь!</span></div></div>`
        : `<div class="progress"><i style="width:${(t / tasks.length) * 100}%"></i></div>
          <div class="task"><button class="icon-btn" id="hear" aria-label="Послушать задание">${ICON.sound}</button>
            <div class="tx"><span class="en">Colour the ${esc(k.en)} ${esc(k.colour.en)}.</span></div></div>
          ${misses >= 2 ? `<div class="hint-box">${esc(k.ru)} → ${esc(k.colour.ru)}</div>` : ''}`}
      <div class="colouring-heading"><b>${esc(upload.en)}</b><span>${esc(upload.ru)}</span></div>
      <div class="canvas upload-canvas" id="cv"><canvas role="img" aria-label="${esc(upload.ru)}"></canvas></div>
      <div class="palette">${colours().map((c) => `<button class="crayon ${crayon === c.en ? 'on' : ''}" data-c="${c.en}" style="--c:${c.color}" aria-label="${c.en}"><span>${c.en}</span></button>`).join('')}</div>
      <div class="row" style="margin-top:34px;gap:12px">
        ${free ? `<button class="btn grow" id="save" style="--c:#7FD1AE">В галерею</button><button class="btn white" id="reset">${paperArt('eraser')} Заново</button>`
          : `<button class="hint-btn grow" id="hint">${paperArt('bulb')} Подсказка</button><a class="btn white" href="#/colour/${upload.id}/free">${paperArt('palette')} Свободно</a>`}
      </div>${free ? '<p class="save-note" id="save-note" role="status"></p>' : ''}`;
    paintCanvas(); wire(); saveState();
  }

  function wire() {
    $('#hear', el)?.addEventListener('click', sayTask);
    $('#hint', el)?.addEventListener('click', () => { misses = 2; view(); });
    $$('.crayon', el).forEach((b) => b.addEventListener('click', () => {
      crayon = b.dataset.c; sfx.pop(); speak(crayon);
      $$('.crayon', el).forEach((x) => x.classList.toggle('on', x === b));
    }));
    $('#cv canvas', el).addEventListener('click', (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const n = regionAt(model.labels, model.w, model.h, (e.clientX - rect.left) * model.w / rect.width, (e.clientY - rect.top) * model.h / rect.height);
      if (!n) return;
      if (!crayon) { speak('Choose a colour!'); $('.palette', el).animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], 400); return; }
      const c = colours().find((x) => x.en === crayon);
      if (free) { fills['r' + n] = c.color; sfx.pop(); paintCanvas(); saveState(); return; }
      const k = tasks[t]; const here = byN.get(n);
      if (here?.en === k.en && crayon === k.colour.en) {
        for (const m of regionsOf(k.en)) fills['r' + m] = c.color;
        sfx.ok(); burst(e.currentTarget); addStars(1, 'art'); if (!misses) firstTry++;
        t++; misses = 0;
        if (t >= tasks.length) return done();
        paintCanvas();
        after(() => { view(); sayTask(); }, 700);
      } else {
        sfx.bad(); misses++;
        if (here?.en === k.en) speak(`Good! Now choose ${k.colour.en}.`);
        else if (here) speak(`This is the ${here.en}. Find the ${k.en}.`);
        else speak(`Find the ${k.en}.`);
        if (misses >= 2) view();
      }
    });
    $('#save', el)?.addEventListener('click', async () => {
      if (saving || !Object.keys(fills).length || alreadySaved()) return;
      saving = true; saveState();
      try {
        await save('gallery', { id: uid(), ...drawing(), ts: Date.now() });
        markStep('art'); addStars(2, 'art'); celebrate('Рисунок в галерее! +2 ⭐', '🖼️');
      } finally { saving = false; saveState(); }
    });
    $('#reset', el)?.addEventListener('click', () => { for (const r of Object.keys(fills)) delete fills[r]; view(); });
  }

  function done() {
    markStep('art'); addStars(5, 'art');
    celebrate(`Beautiful! ${firstTry} из ${tasks.length} с первого раза. +5 ⭐`, '🎨');
    free = true; view();
  }

  if (!free) makeTasks();
  view();
  if (!free) after(sayTask, 400);
  return () => timers.stop();
}
