import { S, esc, speak, sfx, addStars, markStep, celebrate, burst, shuffle, save, uid, $, $$, ICON } from '../lib.js';

// Colouring pictures. Every region (<g class="rg" data-w="…">) is named by its English noun.
// Decorations (eyes, rays, stems) are pointer-events:none so taps go to the region underneath.
export { PICTURES, svgOf } from '../colouring/pictures.js';
import { PICTURES, svgOf, availablePictures, pictureForProfile } from '../colouring/pictures.js';
import { SESSION } from '../auth.js';
import { drawingSignature } from '../colouring/gallery.js';


const colours = () => S.words.filter((w) => w.topic === 'colours');
const wordFor = (en) => S.words.find((w) => w.en === en);

// #/paint — choose a picture
export function paintHub(el) {
  const pictures = availablePictures(SESSION?.profile);
  const fresh = pictures.filter((p) => p.profile);
  const card = (p) => `<a class="tile colouring-tile" href="#/colour/${p.id}">${p.preview === undefined ? svgOf(p) : previewOf(p)}<span class="t en">${esc(p.en)}</span><span class="s">${esc(p.ru)}</span></a>`;
  el.innerHTML = `
    <div class="hello" style="font-size:34px">Colour it!</div>
    <div class="sub">Синие линии, бумага и твои цвета. Послушай задание или рисуй свободно.</div>
    ${fresh.length ? `<section class="new-colouring"><span class="studio-label">Новые рисунки для тебя</span><h2>Маленькие приключения</h2><p class="sub">Котёнок на айкидо, динозавр и ещё четыре истории. Можно начать с любой.</p><div class="pics">${fresh.map(card).join('')}</div></section><div class="h2">Знакомые рисунки</div>` : ''}
    <div class="pics" style="margin-top:16px">
      ${pictures.filter((p) => !p.profile).map(card).join('')}
      <a class="tile painted" href="#/gallery" style="--c:#FF70A6"><span class="colour-study familiar-study" style="--study-x:100%;--study-y:100%" aria-hidden="true"></span><span class="t">Моя галерея</span><span class="s">сохранённые рисунки</span></a>
    </div>`;
}

function previewOf(pic) {
  const classic = pic.study === 'familiar';
  const columns = classic ? 2 : 3;
  return `<span class="colour-study ${classic ? 'familiar-study' : ''}" role="img" aria-label="${esc(pic.ru)}" style="--study-x:${(pic.preview % columns) * 100 / (columns - 1)}%;--study-y:${Math.floor(pic.preview / columns) * 100}%"></span>`;
}

// #/colour/<picture>[/free]
export function paint(el, picId, mode) {
  const pic = pictureForProfile(picId, SESSION?.profile);
  if (!pic) {
    el.innerHTML = `<div class="card"><div class="h2">Выберем другой рисунок?</div><p>Эта история сейчас недоступна в твоём альбоме.</p><a class="btn" href="#/paint">К раскраскам</a></div>`;
    return;
  }
  const regions = [...new Set([...pic.svg.matchAll(/data-w="(\w+)"/g)].map((m) => m[1]))];
  const fills = {};
  let free = mode === 'free';
  let crayon = null;
  let tasks = [];
  let t = 0; let misses = 0; let firstTry = 0;
  let saving = false;

  const drawing = () => ({ pic: pic.id, artVersion: pic.artVersion, fills: { ...fills } });
  const alreadySaved = () => S.gallery.some((item) => drawingSignature(item) === drawingSignature(drawing()));
  function saveState() {
    const button = $('#save', el);
    if (!button) return;
    const empty = !Object.keys(fills).length;
    const saved = !empty && alreadySaved();
    button.disabled = saving || empty || saved;
    button.textContent = saving ? 'Сохраняем…' : saved ? '✓ Уже в галерее' : 'В галерею';
    $('#save-note', el).textContent = empty ? 'Выбери цвет и раскрась первую деталь.' : saved ? 'Можно раскрасить ещё детали и сохранить новый вариант.' : 'Сохрани свой рисунок, когда захочешь.';
  }

  function colourRegion(group, colour, part) {
    if (part) {
      fills[part] = colour;
      group.querySelector(`[data-part="${part}"]`).setAttribute('fill', colour);
      group.querySelector(`[data-texture="${part}"]`).setAttribute('opacity', '.55');
    } else {
      fills[group.dataset.w] = colour;
      group.setAttribute('fill', colour);
      group.querySelectorAll('[data-part]').forEach((path) => {
        delete fills[path.dataset.part]; path.setAttribute('fill', colour);
      });
      group.querySelectorAll('[data-texture]').forEach((path) => path.setAttribute('opacity', '.55'));
    }
    saveState();
  }

  // Each region gets a colour; neighbours in the list never share one.
  function makeTasks() {
    const cs = colours().filter((c) => c.en !== 'white'); // white is invisible on white paper
    let last = '';
    tasks = shuffle(regions).map((r) => {
      let c; do { c = cs[Math.floor(Math.random() * cs.length)]; } while (c.en === last || (r === 'cloud' && c.en === 'black'));
      last = c.en; return { region: r, colour: c };
    });
  }

  function sayTask() { const k = tasks[t]; if (k) speak(`Colour the ${k.region} ${k.colour.en}.`); }

  function render() {
    const k = tasks[t];
    const rw = k && wordFor(k.region);
    const regionRu = k && (pic.labels?.[k.region] || rw?.ru || k.region);
    el.innerHTML = `
      ${free ? `<div class="task"><div class="tx"><span class="en">Free painting 🎨</span><span class="ru">Раскрашивай как хочешь!</span></div></div>`
        : k ? `<div class="progress"><i style="width:${(t / tasks.length) * 100}%"></i></div>
          <div class="task"><button class="icon-btn" id="hear" aria-label="Послушать задание">${ICON.sound}</button>
            <div class="tx"><span class="en">Colour the ${esc(k.region)} ${esc(k.colour.en)}.</span>
            <span class="ru" id="hint">${misses >= 2 ? `${rw?.pic || ''} ${esc(regionRu)} → ${esc(k.colour.ru)}` : '💡 нажми сюда для подсказки'}</span></div></div>` : ''}
      <div class="colouring-heading"><b>${esc(pic.en)}</b><span>${esc(pic.ru)}</span></div>
      <div class="canvas" id="cv">${svgOf(pic, fills)}</div>
      ${pic.preview === undefined ? '' : `<details class="colour-study-panel"><summary>Идея для раскраски</summary>${previewOf(pic)}<p class="sub">Это пример. В свободном рисовании выбирай любые цвета.</p></details>`}
      <div class="palette">${colours().map((c) => `<button class="crayon ${crayon === c.en ? 'on' : ''}" data-c="${c.en}" style="--c:${c.color}" aria-label="${c.en}"><span>${c.en}</span></button>`).join('')}</div>
      <div class="row" style="margin-top:34px;gap:10px">
        ${free ? `<button class="btn grow" id="save" style="--c:#7FD1AE">В галерею</button><button class="btn white" id="reset">🧽 Заново</button>`
          : `<a class="btn white grow" href="#/colour/${pic.id}/free">🎨 Свободно</a>`}
      </div>${free ? '<p class="save-note" id="save-note" role="status"></p>' : ''}`;
    wire(); saveState();
  }

  function wire() {
    $('#hear', el)?.addEventListener('click', sayTask);
    $('#hint', el)?.addEventListener('click', () => { misses = 2; render(); highlight(); });
    $$('.crayon', el).forEach((b) => b.addEventListener('click', () => {
      crayon = b.dataset.c; sfx.pop(); speak(crayon);
      $$('.crayon', el).forEach((x) => x.classList.toggle('on', x === b));
    }));
    $('#cv', el).addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const region = event.target.closest('.rg'); if (!region) return;
      event.preventDefault(); region.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    $('#cv', el).addEventListener('click', (e) => {
      const g = e.target.closest('.rg'); if (!g) return;
      if (!crayon) { speak('Choose a colour!'); $('.palette', el).animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], 400); return; }
      const c = colours().find((x) => x.en === crayon);
      if (free) { colourRegion(g, c.color, e.target.dataset.part); sfx.pop(); return; }
      const k = tasks[t];
      if (g.dataset.w === k.region && crayon === k.colour.en) {
        $$('#cv .rg', el).filter((group) => group.dataset.w === k.region).forEach((group) => colourRegion(group, c.color));
        sfx.ok(); burst(g); addStars(1, 'art'); if (!misses) firstTry++;
        t++; misses = 0;
        if (t >= tasks.length) return done();
        setTimeout(() => { render(); sayTask(); }, 700);
      } else {
        sfx.bad(); misses++;
        if (g.dataset.w === k.region) speak(`Good! Now choose ${k.colour.en}.`);
        else speak(`This is the ${g.dataset.w}. Find the ${k.region}.`);
        if (misses >= 2) { render(); highlight(); }
      }
    });
    $('#save', el)?.addEventListener('click', async () => {
      if (saving || !Object.keys(fills).length || alreadySaved()) return;
      saving = true; saveState();
      try {
        await save('gallery', { id: uid(), ...drawing(), ts: Date.now() });
        addStars(2, 'art'); celebrate('Рисунок в галерее! +2 ⭐', '🖼️');
      } finally { saving = false; saveState(); }
    });
    $('#reset', el)?.addEventListener('click', () => { for (const r of Object.keys(fills)) delete fills[r]; render(); });
  }

  function highlight() {
    const g = $(`#cv .rg[data-w="${tasks[t]?.region}"]`, el);
    g?.querySelectorAll('*').forEach((n) => n.classList.add('hint'));
    g?.classList.add('hint');
  }

  function done() {
    markStep('art'); addStars(5, 'art');
    celebrate(`Beautiful! ${firstTry} из ${tasks.length} с первого раза. +5 ⭐`, '🎨');
    free = true; render();
  }

  makeTasks(); render();
  if (!free) setTimeout(sayTask, 400);
}
