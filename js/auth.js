// Session state has no dependency on the data cache: choose its scope before loading any progress.
export let SESSION = null;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export async function authRequest(path, value) {
  const response = await fetch('api/auth/' + path, { cache: 'no-store', signal: AbortSignal.timeout(10000), ...(value === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) }) });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Не удалось связаться с сервером');
  return data;
}
export async function initSession() {
  const response = await fetch('api/auth/session', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (response.status === 404) return true; // GitHub Pages / legacy local server.
  if (response.status === 401) { loginScreen(); return false; }
  if (!response.ok) throw new Error('Не удалось проверить вход. Попробуйте ещё раз.');
  SESSION = await response.json();
  return true;
}
export function loginScreen() {
  document.querySelector('#top').innerHTML = '';
  document.querySelector('#nav').innerHTML = '';
  document.querySelector('#view').innerHTML = `<section class="card login-card">
    <span class="studio-label">Мастерская английского</span><h1 class="hello">Откроем альбом?</h1>
    <p class="sub">У каждого свой вход, рисунки и звёзды.</p>
    <form id="login-form"><div class="field"><label for="login-name">Логин</label><input class="input" id="login-name" name="login" autocomplete="username" autocapitalize="none" spellcheck="false" required placeholder="amelie или parent"></div>
    <div class="field"><label for="login-password">Пароль</label><input class="input" id="login-password" name="password" type="password" autocomplete="current-password" required></div>
    <button class="btn full" type="submit">Войти</button><p id="login-error" role="alert"></p></form>
    <p class="note">Родителю: логин <b>parent</b>, пароль — прежний семейный пароль. Внутри можно выдать Амели её собственный пароль.</p></section>`;
  document.querySelector('#login-form').onsubmit = async (event) => {
    event.preventDefault();
    const button = event.target.querySelector('button'); button.disabled = true;
    try { await authRequest('login', Object.fromEntries(new FormData(event.target))); location.reload(); }
    catch (error) { document.querySelector('#login-error').textContent = error.message; button.disabled = false; }
  };
}
export function parentRequired(el) {
  el.innerHTML = `<section class="card"><h1 class="h2">Вход для родителя</h1><p>Задания, настройки и пароли доступны в аккаунте родителя. Сейчас открыт альбом: ${esc(SESSION.name)}.</p><button class="btn" id="parent-login">Сменить аккаунт</button></section>`;
  document.querySelector('#parent-login').onclick = () => document.querySelector('#sign-out').click();
}
