import { S, esc, speak, sfx, addStars, markStep, celebrate, burst, shuffle, save, uid, $, $$, ICON } from '../lib.js';

// Colouring pictures. Every region (<g class="rg" data-w="…">) is named by an English word from the app.
// Decorations (eyes, rays, stems) are pointer-events:none so taps go to the region underneath.
const D = 'class="deco"';
export const PICTURES = [
  {
    id: 'house', en: 'My house', ru: 'Мой дом', icon: '🏠',
    svg: `
      <g class="rg" data-w="grass"><path d="M0 262 Q80 248 160 262 T320 258 V320 H0 Z"/></g>
      <g ${D}><line x1="60" y1="10" x2="60" y2="22"/><line x1="60" y1="98" x2="60" y2="110"/><line x1="10" y1="60" x2="22" y2="60"/><line x1="98" y1="60" x2="110" y2="60"/><line x1="25" y1="25" x2="33" y2="33"/><line x1="87" y1="87" x2="95" y2="95"/><line x1="25" y1="95" x2="33" y2="87"/><line x1="87" y1="33" x2="95" y2="25"/></g>
      <g class="rg" data-w="sun"><circle cx="60" cy="60" r="30"/></g>
      <g class="rg" data-w="cloud"><path d="M192 96 C172 96 172 70 194 70 C196 50 226 46 234 64 C248 52 270 62 266 78 C284 80 282 96 266 96 Z"/></g>
      <g class="rg" data-w="roof"><path d="M88 152 L170 92 L252 152 Z"/></g>
      <g class="rg" data-w="house"><rect x="100" y="152" width="140" height="108"/></g>
      <g class="rg" data-w="door"><rect x="153" y="198" width="34" height="62" rx="4"/></g>
      <g class="rg" data-w="window"><rect x="112" y="168" width="32" height="28" rx="3"/><rect x="196" y="168" width="32" height="28" rx="3"/></g>
      <g ${D}><line x1="128" y1="168" x2="128" y2="196"/><line x1="212" y1="168" x2="212" y2="196"/><circle cx="180" cy="230" r="2.5" fill="#2B2140"/></g>
      <g ${D}><rect x="36" y="196" width="16" height="66" fill="#A0522D"/></g>
      <g class="rg" data-w="tree"><circle cx="44" cy="178" r="32"/></g>
      <g ${D}><line x1="288" y1="222" x2="288" y2="262" stroke="#3BB273"/></g>
      <g class="rg" data-w="flower"><circle cx="288" cy="196" r="10"/><circle cx="302" cy="208" r="10"/><circle cx="296" cy="224" r="10"/><circle cx="280" cy="224" r="10"/><circle cx="274" cy="208" r="10"/></g>
      <g ${D}><circle cx="288" cy="211" r="7" fill="#FFD23F"/></g>`,
  },
  {
    id: 'pets', en: 'My pets', ru: 'Мои питомцы', icon: '🐱',
    svg: `
      <g class="rg" data-w="bird"><circle cx="62" cy="62" r="24"/><path d="M44 62 Q60 84 78 66"/></g>
      <g ${D}><path d="M86 58 L100 64 L86 70 Z" fill="#FF9F1C"/><circle cx="70" cy="54" r="3" fill="#2B2140"/></g>
      <g class="rg" data-w="fish"><path d="M196 92 C206 66 262 62 276 92 C262 120 206 118 196 92 Z"/><path d="M196 92 L172 74 L176 92 L172 110 Z"/></g>
      <g ${D}><circle cx="258" cy="88" r="3.5" fill="#2B2140"/></g>
      <g class="rg" data-w="cat"><ellipse cx="112" cy="232" rx="62" ry="46"/><path d="M80 128 L84 92 L106 116 Z"/><path d="M144 128 L140 92 L118 116 Z"/><circle cx="112" cy="152" r="40"/><path d="M168 236 C200 230 206 196 190 186" fill="none"/></g>
      <g ${D}><circle cx="98" cy="146" r="4" fill="#2B2140"/><circle cx="126" cy="146" r="4" fill="#2B2140"/><path d="M106 160 L118 160 L112 167 Z" fill="#FF70A6"/><path d="M112 167 Q104 176 98 170 M112 167 Q120 176 126 170" fill="none"/><path d="M70 160 L92 162 M70 170 L92 168 M154 160 L132 162 M154 170 L132 168" fill="none"/></g>
      <g class="rg" data-w="heart"><path d="M214 176 C214 162 234 158 238 172 C242 158 262 162 262 176 C262 192 238 204 238 210 C238 204 214 192 214 176 Z"/></g>
      <g class="rg" data-w="ball"><circle cx="252" cy="250" r="36"/></g>
      <g ${D}><path d="M218 244 Q252 232 286 244 M226 274 Q252 260 278 272" fill="none"/></g>`,
  },
  {
    id: 'night', en: 'Good night', ru: 'Спокойной ночи', icon: '🌙',
    svg: `
      <g class="rg" data-w="moon"><path d="M92 38 A52 52 0 1 0 128 130 A40 40 0 1 1 92 38 Z"/></g>
      <g class="rg" data-w="star"><path d="M226 30 L234 50 L256 51 L239 64 L245 86 L226 73 L207 86 L213 64 L196 51 L218 50 Z"/><path d="M282 104 L287 116 L300 117 L290 125 L293 138 L282 130 L271 138 L274 125 L264 117 L277 116 Z"/><path d="M168 96 L172 106 L183 106 L174 113 L177 124 L168 117 L159 124 L162 113 L153 106 L164 106 Z"/></g>
      <g class="rg" data-w="cloud"><path d="M30 196 C10 196 10 170 32 170 C34 150 64 146 72 164 C86 152 108 162 104 178 C122 180 120 196 104 196 Z"/></g>
      <g class="rg" data-w="grass"><path d="M0 276 Q90 262 170 276 T320 270 V320 H0 Z"/></g>
      <g class="rg" data-w="roof"><path d="M168 196 L230 150 L292 196 Z"/></g>
      <g class="rg" data-w="house"><rect x="180" y="196" width="100" height="80"/></g>
      <g class="rg" data-w="window"><rect x="196" y="212" width="28" height="26" rx="3"/><rect x="238" y="212" width="28" height="26" rx="3"/></g>
      <g class="rg" data-w="heart"><path d="M120 236 C120 226 134 223 137 233 C140 223 154 226 154 236 C154 248 137 256 137 261 C137 256 120 248 120 236 Z"/></g>`,
  },
];

export const svgOf = (pic, fills = {}) => `<svg viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg">
  <style>.rg *{stroke:#2B2140;stroke-width:4;stroke-linejoin:round;stroke-linecap:round}.deco{pointer-events:none}.deco *{stroke:#2B2140;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round}</style>
  ${pic.svg.replace(/<g class="rg" data-w="(\w+)">/g, (m, w) => `<g class="rg" data-w="${w}" fill="${fills[w] || '#FFFFFF'}">`)}</svg>`;

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
          <div class="task"><button class="icon-btn" id="hear">${ICON.sound}</button>
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
