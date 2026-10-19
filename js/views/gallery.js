import { S, esc, profile, STAR_STEP } from '../lib.js';
import { PICTURES, svgOf } from './paint.js';

export default function gallery(el) {
  const p = profile();
  const got = p.stickers || [];
  const slots = Math.max(20, Math.ceil((got.length + 1) / 5) * 5);
  const toNext = STAR_STEP - ((p.stars || 0) % STAR_STEP);
  const art = [...S.gallery].sort((a, b) => b.ts - a.ts);

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
    ${art.length ? `<div class="pics">${art.map((a) => {
      const pic = PICTURES.find((x) => x.id === a.pic);
      return pic ? `<div class="tile" style="padding:8px">${svgOf(pic, a.fills)}<span class="s">${esc(pic.en)} · ${new Date(a.ts).toLocaleDateString('ru-RU')}</span></div>` : '';
    }).join('')}</div>`
      : `<div class="note">Здесь появятся твои рисунки. Раскрась картинку и нажми «💾 В галерею».</div>`}
    <a class="btn full" href="#/paint" style="margin-top:16px;--c:#FFB3CF">🎨 Рисовать</a>`;
}

