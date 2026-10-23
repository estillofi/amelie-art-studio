import { S, esc, profile, STAR_STEP } from '../lib.js';
import { PICTURES, svgOf } from './paint.js';
import { groupDrawings } from '../colouring/gallery.js';

export default function gallery(el) {
  const p = profile();
  const got = p.stickers || [];
  const slots = Math.max(20, Math.ceil((got.length + 1) / 5) * 5);
  const toNext = STAR_STEP - ((p.stars || 0) % STAR_STEP);
  const art = groupDrawings(S.gallery);

  el.innerHTML = `
    <div class="hello" style="font-size:34px">My gallery</div>
    <div class="sub">Моя галерея · ⭐ ${p.stars || 0} звёзд · до новой наклейки ещё ${toNext}</div>

    <div class="h2">Stickers · <small>Наклейки ${got.length}</small></div>
    <div class="card"><div class="stickers">
      ${Array.from({ length: slots }, (_, i) => got[i]
        ? `<span class="stk got" style="--rot:${((i * 37) % 21) - 10}deg" title="${new Date(got[i].ts).toLocaleDateString('ru-RU')}">${got[i].s}</span>`
        : `<span class="stk">${i === got.length ? '❔' : ''}</span>`).join('')}
    </div></div>

    <div class="h2">My pictures · <small>Мои рисунки ${art.length}</small></div>
    ${S.gallery.length > art.length ? `<p class="gallery-note">${S.gallery.length} сохранений · ${art.length} разных рисунков. Одинаковые работы собраны вместе, все сохранения на месте.</p>` : ''}
    ${art.length ? `<div class="pics">${art.map(({ drawing: a, saves }) => {
      const pic = PICTURES.find((x) => x.id === a.pic);
      return pic ? `<div class="tile gallery-picture" style="padding:8px">${svgOf(pic, a.fills, a.artVersion || 'legacy')}<span class="s">${esc(pic.en)} · ${new Date(a.ts).toLocaleDateString('ru-RU')}</span>${saves.length > 1 ? `<details class="saved-copies"><summary>Сохранений: ${saves.length}</summary>${saves.map((entry) => `<span>${new Date(entry.ts).toLocaleString('ru-RU')}</span>`).join('')}</details>` : ''}</div>` : '';
    }).join('')}</div>`
      : `<div class="note">Здесь появятся твои рисунки. Раскрась картинку и нажми «💾 В галерею».</div>`}
    <a class="btn full" href="#/paint" style="margin-top:16px;--c:#FFB3CF">🎨 Рисовать</a>`;
}

