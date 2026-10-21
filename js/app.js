import { SESSION, initSession, authRequest } from './auth.js';
import { decorate, observeArt } from './art.js';
import { loadAll, profile, $, ICON, esc, paperArt, flushSaves, toast } from './lib.js';
import home from './views/home.js';
import { topics, topic, learn, learnAssignment } from './views/words.js';
import { playHub, listen, spell, sensei } from './views/play.js';
import { paintHub, paint } from './views/paint.js';
import abc from './views/abc.js';
import gallery from './views/gallery.js';
import parents from './views/parents.js';

const NAV = [
  ['', '🏠', 'Home'], ['words', paperArt('book'), 'Words'], ['play', paperArt('ball'), 'Play'], ['paint', '🎨', 'Paint'], ['abc', '🔤', 'ABC'],
];
const ROUTES = { '': home, words: topics, topic, learn, homework: learnAssignment, play: playHub, listen, spell, sensei, paint: paintHub, colour: paint, abc, gallery, parents };
// Which bottom tab lights up for nested pages.
const TAB = { topic: 'words', learn: 'words', homework: 'words', listen: 'play', spell: 'play', sensei: 'play', colour: 'paint', gallery: '', parents: '' };

function renderTop(route) {
  const p = profile();
  const back = TAB[route] !== undefined ? `#/${TAB[route]}` : null;
  $('#top').innerHTML = `${back ? `<a class="icon-btn" href="${back}" aria-label="Назад">${ICON.back}</a>` : `<a class="logo" href="#/"><span class="pal">${paperArt('butterfly')}</span>Amelie</a>`}
    <span class="sp"></span>${SESSION ? `<button class="adult-link" id="sign-out">Выйти</button>` : ''}<a class="adult-link" href="#/parents" aria-label="Открыть раздел для взрослых">Взрослым</a>
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
  $('#sign-out')?.addEventListener('click', async () => {
    if (!(await flushSaves())) { toast('Сначала дождитесь сохранения результатов. Есть записи на этом устройстве.'); return; }
    try { await authRequest('logout', {}); location.reload(); } catch (error) { toast(error.message); }
  });
  const view = ROUTES[route] || home;
  const el = $('#view');
  el.innerHTML = '';
  window.scrollTo(0, 0);
  cleanup = (await view(el, ...args)) || null;
  decorate(document.body);
}

try {
  $('#studio-garland').innerHTML = ['star', 'cloud', 'moon', 'cloud', 'star'].map((name) => paperArt(name)).join('');
  observeArt();
  if (await initSession()) {
    await loadAll();
    window.addEventListener('hashchange', router);
    router();
  }
} catch (error) {
  $('#view').innerHTML = `<div class="card start-error" role="alert"><div class="h2">Не получилось открыть альбом</div><p>${esc(error.message)}</p><p>Попробуй снова, когда появится связь.</p><button class="btn" id="retry">Попробовать ещё раз</button></div>`;
  $('#retry').onclick = () => location.reload();
}
