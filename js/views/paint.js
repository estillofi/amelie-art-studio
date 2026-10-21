import { S, esc, speak, sfx, addStars, markStep, celebrate, burst, shuffle, save, uid, $, $$, ICON } from '../lib.js';

// Colouring pictures. Every region (<g class="rg" data-w="…">) is named by an English word from the app.
// Decorations (eyes, rays, stems) are pointer-events:none so taps go to the region underneath.
const D = 'class="deco"';
export const PICTURES = [
  {
    id: 'house', en: 'My house', ru: 'Мой дом', icon: '🏠',
    svg: `
      <g class="rg" data-w="grass"><path d="M0 273 Q49 258 93 269 T190 267 T320 264 L320 320 0 320Z"/></g>
      <g class="rg" data-w="sun"><circle cx="58" cy="57" r="27"/></g>
      <g ${D}><path d="m58 16 2-11 m25 21 9-10 M98 53l12-1 M89 81l9 9 M58 96l1 12 M25 84l-9 9 M16 55l-11 2 M25 27l-8-8" fill="none"/><path d="M47 53q3-7 6 0m9 0q3-7 6 0M48 64q12 13 22-2" fill="none"/></g>
      <g class="rg" data-w="cloud"><path d="M202 72q-18 4-18-11t19-13q5-25 29-17 12-20 30-3 23-7 27 15 19 1 20 15 0 14-17 14Z"/></g>
      <g class="rg" data-w="roof"><path d="M86 161 117 137 171 91 227 137 252 164 198 158 139 161Z"/></g>
      <g class="rg" data-w="house"><path d="m100 160 140-1-2 108-139 1Z"/></g>
      <g class="rg" data-w="door"><path d="M153 268 154 215q14-22 31 0l2 53Z"/></g>
      <g class="rg" data-w="window"><path d="m111 177 32-2 2 29-33 1Zm84-2 33 3-2 28-32-2Z"/></g>
      <g ${D}><path d="m126 176 1 29m-15-15 32 1m67-14-1 28m-15-15 32 2M113 139l14 4 10-12m-1-7 12 5 11-13m10-13 14 21 12-2" fill="none"/><circle cx="178" cy="239" r="2" fill="#126c9a"/><path d="m43 255 2-81 8-1-1 84" fill="#dca34c"/></g>
      <g class="rg" data-w="tree"><path d="m48 124-22 37 14-4-21 32 16-3-22 34 30-5 33 5-19-32 14 4-20-34 14 5Z"/></g>
      <g ${D}><path d="m33 165 13-17m-18 39 22-24m-21 43 24-28m234 81 1-48m-1 31-12-10m14 19 11-10" fill="none"/></g>
      <g class="rg" data-w="flower"><path d="M287 214q-16 12-17-4-17-4-6-15-5-16 11-15 8-18 18-4 18-4 15 12 16 8 3 18-5 16-24 8Z"/></g>
      <g ${D}><circle cx="287" cy="195" r="7" fill="#f8d44a"/><path d="m4 292 12-12m9 19 11-12m22 14 8-13m31 17 10-14m99 13 10-16m22 16 12-11m35 10 8-12" fill="none"/></g>`,
  },
  {
    id: 'pets', en: 'My pets', ru: 'Мои питомцы', icon: '🐱',
    svg: `
      <g class="rg" data-w="bird"><path d="M33 74q-7-33 22-39 28-10 39 17 8 25-18 32-17 9-32-2l-17 9Z"/></g>
      <g ${D}><path d="m94 52 15 8-16 6M45 60q14-7 31 8-16 9-27-1m1 16-2 13m20-11 3 12" fill="none"/><circle cx="79" cy="52" r="3" fill="#126c9a"/></g>
      <g class="rg" data-w="fish"><path d="M200 76q30-36 80-3-24 40-77 16l-28 20 4-29-4-20Z"/></g>
      <g ${D}><circle cx="260" cy="75" r="3" fill="#126c9a"/><path d="M237 60q-13 17 0 34m-28-21 14 7-13 6" fill="none"/></g>
      <g class="rg" data-w="cat"><path d="M61 241q-4-49 43-57 53-2 66 51l-10 40-30-1-10-17-8 18-38-1Z"/><path d="m75 139 1-41 31 22 19-2 29-27-2 48q21 42-13 60-35 17-66-9-25-21 1-51Z"/><path d="M165 239q48-10 24-45" fill="none"/></g>
      <g ${D}><path d="m87 144 5 8m39-8-3 8m-25 10 11 1-6 6Zm5 7q-8 13-17 6m17-6q10 13 18 5m-60-21 23 4m-24 9 22-3m62-13-20 5m21 8-22-2m-44 64 5 20m37-20-2 19" fill="none"/></g>
      <g class="rg" data-w="heart"><path d="M210 158q5-20 23-8 10-19 27-4 19 18-19 44-11-5-27-17Z"/></g>
      <g class="rg" data-w="ball"><path d="M217 251q-2-29 30-34 32-3 39 28 4 30-28 35-32 4-41-29Z"/></g>
      <g ${D}><path d="m223 231q26 9 54-3m-57 29q31 8 63-5m-34-34q-13 24 0 60" fill="none"/></g>`,
  },
  {
    id: 'night', en: 'Good night', ru: 'Спокойной ночи', icon: '🌙',
    svg: `
      <g class="rg" data-w="moon"><path d="M96 28q-48 12-45 56 1 48 48 53 30 3 47-24-41 12-54-19-14-30 4-66Z"/></g>
      <g ${D}><path d="m79 79 1 7m-4 12q8 8 17 0m-29-33 6-13m-11 31 7-12m-5 32 7-13m0 25 6-13" fill="none"/></g>
      <g class="rg" data-w="star"><path d="m224 24 10 22 25 2-19 17 6 25-22-13-22 11 6-24-18-18 25-2Zm57 75 7 16 16 1-12 11 4 16-15-8-14 7 3-16-11-12 16-1Zm-118 0 5 12 14 1-11 9 3 13-11-7-11 6 3-12-10-10 13-1Z"/></g>
      <g ${D}><path d="m217 58 1 4m15-4-1 4m-14 5q6 6 11-1" fill="none"/></g>
      <g class="rg" data-w="cloud"><path d="M31 194q-20 4-19-13-1-18 19-17 4-25 28-18 16-15 31 5 23-3 23 16 16 8 5 22Z"/></g>
      <g class="rg" data-w="grass"><path d="M0 281q55-19 111-7 38 12 83 2 66-16 126-2v46H0Z"/></g>
      <g class="rg" data-w="roof"><path d="m165 202 65-55 65 57-38-5-54 2Z"/></g>
      <g class="rg" data-w="house"><path d="m180 201 101 1-2 77-99-1Z"/></g>
      <g class="rg" data-w="window"><path d="m194 215 29-1 1 27-29-1Zm43 0 29 2-2 26-27-2Z"/></g>
      <g ${D}><path d="m207 215 1 25m-13-13 28 1m28-11-1 24m-12-13 26 2m-79-33 14-1m12-11 11-1m11 1 12 5m-33 69 1-16q9-9 18 1l1 15" fill="none"/></g>
      <g class="rg" data-w="heart"><path d="M115 238q1-15 17-10 8-15 21-5 18 17-12 36-24-5-26-21Z"/></g>
      <g ${D}><path d="m15 296 9-12m13 16 11-12m20 15 9-13m18 14 10-14m39 13 10-13m116 12 10-11m17 11 10-13" fill="none"/></g>`,
  },
];

let drawingSerial = 0;
export function svgOf(pic, fills = {}) {
  const id = `crayon-hatch-${++drawingSerial}`;
  const hatching = [...pic.svg.matchAll(/<g class="rg" data-w="\w+">([\s\S]*?)<\/g>/g)].map((match) => `<g class="crayon-grain" fill="url(#${id})">${match[1]}</g>`).join('');
  return `<svg viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg">
    <defs><pattern id="${id}" width="19" height="23" patternUnits="userSpaceOnUse"><path d="m1 17 9-12m-3 16L18 4m-3 20 5-7" stroke="#126c9a" stroke-width="1.1" opacity=".18" fill="none"/></pattern></defs>
    <style>.rg *{stroke:#126c9a;stroke-width:3;stroke-linejoin:round;stroke-linecap:round}.deco,.crayon-grain{pointer-events:none}.deco *{stroke:#126c9a;stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round}.crayon-grain *{stroke:none}</style>
    ${pic.svg.replace(/<g class="rg" data-w="(\w+)">/g, (m, w) => `<g class="rg" data-w="${w}" fill="${fills[w] || '#FFFFFF'}">`)}${hatching}</svg>`;
}

const colours = () => S.words.filter((w) => w.topic === 'colours');
const wordFor = (en) => S.words.find((w) => w.en === en);

// #/paint — choose a picture
export function paintHub(el) {
  el.innerHTML = `
    <div class="hello" style="font-size:34px">Colour it!</div>
    <div class="sub">Раскраска · слушай задание, выбери мелок и нажми на картинку</div>
    <div class="pics" style="margin-top:16px">
      ${PICTURES.map((p) => `<a class="tile" href="#/colour/${p.id}" style="padding:10px">${svgOf(p)}<span class="t en">${esc(p.en)}</span><span class="s">${esc(p.ru)}</span></a>`).join('')}
      <a class="tile painted" href="#/gallery" style="--c:#FF70A6"><span class="big">🖼️</span><span class="t">Моя галерея</span><span class="s">сохранённые рисунки</span></a>
    </div>`;
}

// #/colour/<picture>[/free]
export function paint(el, picId, mode) {
  const pic = PICTURES.find((p) => p.id === picId) || PICTURES[0];
  const regions = [...new Set([...pic.svg.matchAll(/data-w="(\w+)"/g)].map((m) => m[1]))];
  const fills = {};
  let free = mode === 'free';
  let crayon = null;
  let tasks = [];
  let t = 0; let misses = 0; let firstTry = 0;

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
    el.innerHTML = `
      ${free ? `<div class="task"><div class="tx"><span class="en">Free painting 🎨</span><span class="ru">Раскрашивай как хочешь!</span></div></div>`
        : k ? `<div class="progress"><i style="width:${(t / tasks.length) * 100}%"></i></div>
          <div class="task"><button class="icon-btn" id="hear" aria-label="Послушать задание">${ICON.sound}</button>
            <div class="tx"><span class="en">Colour the ${esc(k.region)} ${esc(k.colour.en)}.</span>
            <span class="ru" id="hint">${misses >= 2 ? `${rw?.pic || ''} ${esc(rw?.ru || k.region)} → ${esc(k.colour.ru)}` : '💡 нажми сюда для подсказки'}</span></div></div>` : ''}
      <div class="canvas" id="cv">${svgOf(pic, fills)}</div>
      <div class="palette">${colours().map((c) => `<button class="crayon ${crayon === c.en ? 'on' : ''}" data-c="${c.en}" style="--c:${c.color}" aria-label="${c.en}"><span>${c.en}</span></button>`).join('')}</div>
      <div class="row" style="margin-top:34px;gap:10px">
        ${free ? `<button class="btn grow" id="save" style="--c:#7FD1AE">💾 В галерею</button><button class="btn white" id="reset">🧽 Заново</button>`
          : `<a class="btn white grow" href="#/colour/${pic.id}/free">🎨 Свободно</a>`}
      </div>`;
    wire();
  }

  function wire() {
    $('#hear', el)?.addEventListener('click', sayTask);
    $('#hint', el)?.addEventListener('click', () => { misses = 2; render(); highlight(); });
    $$('.crayon', el).forEach((b) => b.addEventListener('click', () => {
      crayon = b.dataset.c; sfx.pop(); speak(crayon);
      $$('.crayon', el).forEach((x) => x.classList.toggle('on', x === b));
    }));
    $('#cv', el).addEventListener('click', (e) => {
      const g = e.target.closest('.rg'); if (!g) return;
      if (!crayon) { speak('Choose a colour!'); $('.palette', el).animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], 400); return; }
      const c = colours().find((x) => x.en === crayon);
      if (free) { fills[g.dataset.w] = c.color; g.setAttribute('fill', c.color); sfx.pop(); return; }
      const k = tasks[t];
      if (g.dataset.w === k.region && crayon === k.colour.en) {
        fills[k.region] = c.color; g.setAttribute('fill', c.color);
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
      await save('gallery', { id: uid(), pic: pic.id, fills: { ...fills }, ts: Date.now() });
      addStars(2, 'art'); celebrate('Рисунок в галерее! +2 ⭐', '🖼️');
    });
    $('#reset', el)?.addEventListener('click', () => { for (const r of regions) delete fills[r]; render(); });
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
