import { loadAll, profile, $, ICON, esc } from './lib.js';
import home from './views/home.js';
import { topics, topic, learn } from './views/words.js';
import { playHub, listen, spell, sensei } from './views/play.js';
import { paintHub, paint } from './views/paint.js';
import abc from './views/abc.js';
import gallery from './views/gallery.js';
import parents from './views/parents.js';

const NAV = [
  ['', '🏠', 'Home'], ['words', '📒', 'Words'], ['play', '🎲', 'Play'], ['paint', '🎨', 'Paint'], ['abc', '🔤', 'ABC'],
];
const ROUTES = { '': home, words: topics, topic, learn, play: playHub, listen, spell, sensei, paint: paintHub, colour: paint, abc, gallery, parents };
// Which bottom tab lights up for nested pages.
const TAB = { topic: 'words', learn: 'words', listen: 'play', spell: 'play', sensei: 'play', colour: 'paint', gallery: '', parents: '' };

function renderTop(route) {
  const p = profile();
  const back = TAB[route] !== undefined ? `#/${TAB[route]}` : null;
  $('#top').innerHTML = `${back ? `<a class="icon-btn" href="${back}" aria-label="Назад">${ICON.back}</a>` : '<a class="logo" href="#/"><span class="pal">🎨</span>Amelie</a>'}
    <span class="sp"></span>
    <a class="chip" href="#/gallery" title="Мои звёзды и наклейки">⭐ <span id="stars">${p.stars || 0}</span></a>`;
}

function renderNav(route) {
  const active = TAB[route] ?? route;
  $('#nav').innerHTML = NAV.map(([r, e, t]) => `<a href="#/${r}" class="${active === r ? 'on' : ''}"><span class="e">${e}</span>${t}</a>`).join('');
}

document.addEventListener('stars', (e) => { const s = $('#stars'); if (s) s.textContent = e.detail.stars; });

let cleanup = null;
async function router() {
  const [route = '', ...args] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  cleanup?.(); cleanup = null;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  renderTop(route); renderNav(route);
  const view = ROUTES[route] || home;
  const el = $('#view');
  el.innerHTML = '';
  window.scrollTo(0, 0);
  cleanup = (await view(el, ...args)) || null;
}

try {
  await loadAll();
  window.addEventListener('hashchange', router);
  router();
} catch (error) {
  $('#view').innerHTML = `<div class="card start-error" role="alert"><div class="h2">Не получилось открыть альбом</div><p>${esc(error.message)}</p><p>Попробуй снова, когда появится связь.</p><button class="btn" id="retry">Попробовать ещё раз</button></div>`;
  $('#retry').onclick = () => location.reload();
}
