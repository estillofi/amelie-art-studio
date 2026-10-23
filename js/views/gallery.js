import { S, esc, profile, paperArt } from '../lib.js';
import { nextReward } from '../rewards.js';
import { PICTURES, svgOf } from './paint.js';
import { groupDrawings } from '../colouring/gallery.js';

export default function gallery(el, sheet) {
  const p = profile();
  const got = p.stickers || [];
  const perSheet = 20;
  const sheets = Math.floor(got.length / perSheet) + 1;
  const current = Math.min(sheets - 1, Math.max(0, /^\d+$/.test(sheet || '') ? Number(sheet) : Math.floor(Math.max(0, got.length - 1) / perSheet)));
  const toNext = nextReward(p).remaining;
  const art = groupDrawings(S.gallery);

  el.innerHTML = `
    <div class="hello" style="font-size:34px">My gallery</div>
    <div class="sub">Моя галерея · ⭐ ${p.stars || 0} звёзд · до новой наклейки ещё ${toNext}</div>

    <div class="h2">Stickers · <small>Наклейки ${got.length}</small></div>
    <p class="reward-note">Ещё ${toNext} звёзд до новой наклейки. Кубок за три занятия — отдельная награда, один раз за день. Пропуски ничего не отнимают.</p>
    <div class="card sticker-album"><div class="album-heading"><b>Лист ${current + 1} из ${sheets}</b><span>По 20 наклеек · новые листы появляются сами</span></div><div class="stickers">
      ${Array.from({ length: perSheet }, (_, slot) => { const i = current * perSheet + slot; return got[i]
        ? `<span class="stk got" style="--rot:${((i * 37) % 21) - 10}deg" title="${new Date(got[i].ts).toLocaleDateString('ru-RU')}">${got[i].s.startsWith('sketch:') ? paperArt(got[i].s.slice(7)) : esc(got[i].s)}</span>`
        : `<span class="stk" aria-label="Место для новой наклейки">${i === got.length ? '❔' : ''}</span>`; }).join('')}
    </div><nav class="album-pages" aria-label="Листы наклеек">${current ? `<a class="btn sm white" href="#/gallery/${current - 1}">← Предыдущий</a>` : '<span></span>'}${current < sheets - 1 ? `<a class="btn sm white" href="#/gallery/${current + 1}">Следующий →</a>` : '<span></span>'}</nav></div>

    <div class="h2">My pictures · <small>Мои рисунки ${art.length}</small></div>
    ${S.gallery.length > art.length ? `<p class="gallery-note">${S.gallery.length} сохранений · ${art.length} разных рисунков. Одинаковые работы собраны вместе, все сохранения на месте.</p>` : ''}
    ${art.length ? `<div class="pics">${art.map(({ drawing: a, saves }) => {
      const pic = PICTURES.find((x) => x.id === a.pic);
      return pic ? `<div class="tile gallery-picture" style="padding:8px">${svgOf(pic, a.fills, a.artVersion || 'legacy')}<span class="s">${esc(pic.en)} · ${new Date(a.ts).toLocaleDateString('ru-RU')}</span>${saves.length > 1 ? `<details class="saved-copies"><summary>Сохранений: ${saves.length}</summary>${saves.map((entry) => `<span>${new Date(entry.ts).toLocaleString('ru-RU')}</span>`).join('')}</details>` : ''}</div>` : '';
    }).join('')}</div>`
      : `<div class="note">Здесь появятся твои рисунки. Раскрась картинку и нажми «💾 В галерею».</div>`}
    <a class="btn full" href="#/paint" style="margin-top:16px;--c:#FFB3CF">🎨 Рисовать</a>`;
}

