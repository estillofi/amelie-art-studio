import { SESSION, parentRequired } from '../auth.js';
import { S, esc, toast, $, $$, MODE, requestJSON, paperArt } from '../lib.js';
import { REGION_WORD } from '../data-model.js';
import { traceFile, numbered, thumbnail } from '../colouring/upload.js';
import { regionAt } from '../colouring/trace.js';

// #/mypics — a parent turns a photo of a colouring page (or Amelie's pencil drawing) into a colouring task.
// The browser traces the lines and numbers the regions; Claude (on the server) names them in English.
// Without an API key the parent names the regions by hand: the result is the same picture with the same tasks.

const colourWords = () => S.words.filter((w) => w.topic === 'colours' && w.en !== 'white');
const newId = () => 'u-' + Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, '0')).join('');

export default async function mypics(el) {
  if (SESSION?.role === 'child') return parentRequired(el);
  const album = SESSION?.name || 'Амели';
  if (MODE !== 'server') {
    el.innerHTML = `<div class="card"><div class="h2">Нужна серверная версия</div><p>Свои раскраски хранятся на сервере семьи. Откройте приложение по адресу Railway.</p></div>`;
    return;
  }
  let ai = { enabled: false };
  try { ai = await requestJSON('api/ai/status'); } catch { /* manual labelling still works */ }
  let file = null; let model = null; let strength = 14; let labels = {}; let title = { en: '', ru: '' }; let busy = false; let usedAi = false;

  el.innerHTML = `
    <div class="hello" style="font-size:32px">Своя раскраска</div>
    <div class="sub">Сфотографируйте раскраску или рисунок Амели. Приложение обведёт линии и разделит картинку на области, ${ai.enabled ? 'а ИИ подпишет их по-английски' : 'а вы подпишете их по-английски'}. Потом голос попросит: <i>Colour the cat orange</i>.</div>
    <section class="card upload-start">
      <label class="btn full" for="mp-file" style="--c:#FFD23F">${paperArt('upload')} Выбрать фото</label>
      <input type="file" id="mp-file" accept="image/*" hidden>
      <p class="note" style="margin:12px 0 0">Лучше всего работают тёмные линии на белой бумаге: снимайте сверху, при дневном свете, без тени от телефона. ${ai.enabled ? `На сервер уходит только контур с номерами областей: без фото, имени и прогресса. Лимит ИИ на ${esc(ai.month)}: осталось $${ai.remaining} из $${ai.limit}.` : 'ИИ сейчас не подключён: подписи вводятся вручную, это занимает 2–3 минуты.'}</p>
    </section>
    <div id="mp-work"></div>
    <div class="h2">Уже в альбоме · ${esc(album)}</div>
    <div id="mp-list"></div>`;

  $('#mp-file', el).addEventListener('change', async (event) => {
    file = event.target.files?.[0] || null;
    if (!file) return;
    labels = {}; title = { en: '', ru: '' }; usedAi = false;
    await trace();
  });
  list();

  async function trace() {
    const work = $('#mp-work', el);
    work.innerHTML = '<div class="card"><p class="sub" style="margin:0">Обводим линии…</p></div>';
    try { model = await traceFile(file, strength); } catch (error) { work.innerHTML = `<div class="note">${esc(error.message)}</div>`; return; }
    draw();
  }

  function draw() {
    const work = $('#mp-work', el);
    const few = model.regions.length < 2;
    const tooBig = model.png.length > 700000;
    work.innerHTML = `
      <section class="card upload-work">
        <div class="h2" style="margin-top:0">1. Проверьте контур</div>
        <div class="upload-preview" id="mp-preview"></div>
        <div class="field" style="margin-top:12px"><label for="mp-strength">Линии: ${strength < 10 ? 'только чёткие' : strength > 24 ? 'ловить бледные' : 'обычные'}</label>
          <input type="range" id="mp-strength" min="0" max="40" step="2" value="${strength}" style="width:100%"></div>
        <p class="sub" style="margin:0">Областей: <b>${model.regions.length}</b>. ${few ? 'Почти нет замкнутых областей: попробуйте «ловить бледные» или фото с более тёмными линиями.' : 'Если краска «протекает» в соседнюю область, сдвиньте ползунок вправо. Если областей слишком много — влево.'}</p>
        ${tooBig ? '<div class="note">Слишком много мелких линий для сохранения. Сдвиньте ползунок влево или обрежьте фото.</div>' : ''}
      </section>
      ${few || tooBig ? '' : `<section class="card upload-labels">
        <div class="h2" style="margin-top:0">2. Подпишите области</div>
        ${ai.enabled ? `<button class="btn full" id="mp-ai" style="--c:#7FD1AE">${paperArt('bulb')} Подписать с помощью ИИ</button><p class="sub" id="mp-ai-note" style="margin:8px 0 0">Обычно 20–60 секунд, около $0.02–0.05.</p>` : ''}
        <p class="sub">Нажмите на область на картинке — откроется её строка. Пустые строки останутся для свободного рисования. Английское слово — простое, без «the».</p>
        <div class="field"><label>Название по-английски</label><input class="input" id="mp-title-en" maxlength="40" placeholder="My cat" value="${esc(title.en)}"></div>
        <div class="field"><label>Название по-русски</label><input class="input" id="mp-title-ru" maxlength="40" placeholder="Мой кот" value="${esc(title.ru)}"></div>
        <div class="region-rows">${model.regions.map((r) => row(r.n)).join('')}</div>
        <button class="btn full" id="mp-save" style="--c:#FFB3CF;margin-top:14px">${paperArt('save')} Добавить в альбом</button>
      </section>`}`;
    $('#mp-preview', work).append(numbered(model, { type: 'canvas' }));
    $('#mp-strength', work).addEventListener('change', async (event) => { strength = Number(event.target.value); keep(); await trace(); });
    $('#mp-preview canvas', work).addEventListener('click', (event) => {
      const c = event.currentTarget; const rect = c.getBoundingClientRect();
      const n = regionAt(model.labels, model.w, model.h, (event.clientX - rect.left) * model.w / rect.width, (event.clientY - rect.top) * model.h / rect.height);
      const input = n && $(`[data-en="${n}"]`, work);
      if (input) { input.scrollIntoView({ block: 'center', behavior: 'smooth' }); input.focus({ preventScroll: true }); }
    });
    $('#mp-ai', work)?.addEventListener('click', label);
    $('#mp-save', work)?.addEventListener('click', store);
  }

  function row(n) {
    const v = labels[n] || {};
    return `<div class="region-row"><span class="region-n">${n}</span>
      <input class="input" data-en="${n}" maxlength="30" placeholder="english" autocapitalize="off" autocomplete="off" spellcheck="false" value="${esc(v.en || '')}" aria-label="Область ${n} по-английски">
      <input class="input" data-ru="${n}" maxlength="40" placeholder="по-русски" value="${esc(v.ru || '')}" aria-label="Область ${n} по-русски">
      <select class="select" data-colour="${n}" aria-label="Цвет области ${n}"><option value="">любой цвет</option>${colourWords().map((c) => `<option value="${c.en}" ${v.colour === c.en ? 'selected' : ''}>${esc(c.en)} · ${esc(c.ru)}</option>`).join('')}</select></div>`;
  }

  // Read the form back into state before re-tracing or saving.
  function keep() {
    const work = $('#mp-work', el);
    for (const input of $$('[data-en]', work)) {
      const n = Number(input.dataset.en);
      labels[n] = { en: input.value.trim().toLowerCase().replace(/^(?:the|a|an)\s+/, ''), ru: $(`[data-ru="${n}"]`, work).value.trim(), colour: $(`[data-colour="${n}"]`, work).value };
    }
    if ($('#mp-title-en', work)) title = { en: $('#mp-title-en', work).value.trim(), ru: $('#mp-title-ru', work).value.trim() };
  }

  async function label() {
    if (busy) return;
    keep(); busy = true;
    const button = $('#mp-ai', el); const note = $('#mp-ai-note', el);
    button.disabled = true; button.textContent = 'ИИ смотрит на картинку…';
    try {
      const result = await requestJSON('api/ai/label-picture', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(180000),
        body: JSON.stringify({ image: numbered(model), numbers: model.regions.map((r) => r.n) }),
      });
      for (const r of result.regions) if (r.en && !labels[r.n]?.en) labels[r.n] = { en: r.en, ru: r.ru, colour: r.colour };
      if (!title.en) title = { en: result.title.en, ru: result.title.ru };
      ai = { ...ai, ...result.budget }; usedAi = true;
      draw();
      const named = result.regions.filter((r) => r.en).length;
      toast(`ИИ подписал ${named} из ${model.regions.length}. Проверьте слова и поправьте, если нужно.`);
      $('#mp-ai-note', el).textContent = `Стоило $${result.cost}. Осталось $${result.budget.remaining} из $${result.budget.limit} на месяц.`;
    } catch (error) {
      busy = false;
      button.disabled = false; button.innerHTML = `${paperArt('bulb')} Подписать с помощью ИИ`;
      note.textContent = error.name === 'TimeoutError' ? 'ИИ слишком долго отвечает. Попробуйте ещё раз или подпишите вручную.' : error.message;
      return;
    }
    busy = false;
  }

  async function store() {
    keep();
    const regions = Object.entries(labels).filter(([, v]) => v.en).map(([n, v]) => ({ n: Number(n), en: v.en, ru: v.ru, ...(v.colour ? { colour: v.colour } : {}) }));
    const bad = regions.find((r) => !REGION_WORD.test(r.en) || r.en.length > 30 || !r.ru);
    if (!regions.length) return toast('Подпишите хотя бы одну область: по ней появится задание.');
    if (bad) return toast(`Область ${bad.n}: нужно простое английское слово латиницей и перевод.`);
    const item = { id: newId(), en: title.en || 'My picture', ru: title.ru || 'Моя картинка', image: model.png, width: model.w, height: model.h, regions, ai: usedAi, createdAt: Date.now() };
    const button = $('#mp-save', el); button.disabled = true; button.textContent = 'Сохраняем…';
    try {
      const saved = await requestJSON('api/db/uploads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(30000), body: JSON.stringify(item) });
      S.uploads.push(saved);
      file = null; model = null; labels = {}; title = { en: '', ru: '' };
      $('#mp-work', el).innerHTML = `<div class="note">Готово! «${esc(saved.ru)}» уже в разделе Paint у ${esc(album)}.</div>`;
      $('#mp-file', el).value = '';
      list();
    } catch (error) { toast(error.message); button.disabled = false; button.innerHTML = `${paperArt('save')} Добавить в альбом`; }
  }

  function list() {
    const box = $('#mp-list', el);
    if (!S.uploads.length) { box.innerHTML = '<p class="sub">Пока пусто. Первая картинка появится здесь.</p>'; return; }
    box.innerHTML = `<div class="pics">${[...S.uploads].sort((a, b) => b.createdAt - a.createdAt).map((u) => `
      <div class="tile upload-tile ${u.archived ? 'archived' : ''}"><img data-thumb="${u.id}" alt="" width="${u.width}" height="${u.height}">
        <span class="t en">${esc(u.en)}</span><span class="s">${esc(u.ru)} · ${new Set(u.regions.map((r) => r.en)).size} слов${u.archived ? ' · скрыта' : ''}</span>
        <div class="row" style="gap:8px;margin-top:8px"><a class="btn sm white" href="#/colour/${u.id}">Открыть</a><button class="btn sm white" data-archive="${u.id}">${u.archived ? 'Вернуть' : 'Скрыть'}</button></div></div>`).join('')}</div>`;
    for (const img of $$('[data-thumb]', box)) thumbnail(S.uploads.find((u) => u.id === img.dataset.thumb)).then((src) => { img.src = src; }).catch(() => {});
    for (const button of $$('[data-archive]', box)) button.addEventListener('click', async () => {
      const u = S.uploads.find((x) => x.id === button.dataset.archive);
      try {
        const saved = await requestJSON('api/db/uploads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...u, archived: !u.archived }) });
        Object.assign(u, saved); list();
      } catch (error) { toast(error.message); }
    });
  }
}
