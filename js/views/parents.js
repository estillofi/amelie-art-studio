import { SESSION, authRequest, parentRequired } from '../auth.js';
import { S, esc, profile, saveProfile, save, toast, speak, todayKey, startOfDay, DAY, topicOf, $, MODE, downloadProgress, importProgress, isStandalone, isAndroid, installHint, SYNC, flushSaves, browserBackup, importContent, uid, previewProgress } from '../lib.js';
import { topicStats, seenWords } from '../srs.js';
import { RELEASE } from '../release.js';
import { mountHomework } from './homework.js';
import { nextReward } from '../rewards.js';
import { groupDrawings } from '../colouring/gallery.js';

let unlocked = false;

// The requested tab survives the grown-up gate; the router owns event cleanup.
export default function parents(el, section = '') {
  if (SESSION?.role === 'child') return parentRequired(el);
  if (!SESSION && !unlocked) return gate(el);
  const p = profile();
  const week = Array.from({ length: 7 }, (_, i) => todayKey(new Date(startOfDay() - (6 - i) * DAY)));
  const days = p.days || {};
  const logDays = new Set(S.log.map((l) => l.day));
  const active = week.filter((d) => days[d] || logDays.has(d)).length;
  const reps = S.log.filter((l) => week.includes(l.day)).length;
  const known = S.log.filter((l) => week.includes(l.day) && l.know).length;

  el.innerHTML = `
    <div class="hello" style="font-size:34px">Для родителей</div>
    <div class="sub">Занимаемся спокойно, понемногу${SESSION ? ` · Альбом: ${esc(SESSION.name)}` : ''}</div>
    ${SESSION ? `<section class="card family-panel"><div class="field"><label for="family-profile">Чей альбом открыть</label><select class="select" id="family-profile">${SESSION.profiles.map((p) => `<option value="${p.id}" ${p.id === SESSION.profile ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div><details><summary>Входы и пароли для детей</summary><p class="note">Выдайте каждому отдельный пароль. При замене пароля прежний перестаёт работать. Звёзды и рисунки сохраняются.</p><div id="family-access"></div><p id="access-message" role="status"></p></details></section>` : ''}
    <nav class="parent-tabs" aria-label="Разделы для взрослых"><a href="#/parents/homework" ${section === 'homework' ? 'aria-current="page"' : ''}>Учебник и задания</a><a href="#/parents" ${section !== 'homework' ? 'aria-current="page"' : ''}>Прогресс и настройки</a></nav>
    <div id="parent-homework" ${section === 'homework' ? '' : 'hidden'}>
      <section id="school-homework" aria-label="Задания из учебника"></section>

    <details class="new-word-panel"><summary>Нет нужного слова? Добавить новое</summary><form class="card" id="add">
      <div class="field"><label>Слово по-английски</label><input class="input" name="en" required placeholder="giraffe"></div>
      <div class="field"><label>Перевод</label><input class="input" name="ru" required placeholder="жираф"></div>
      <div class="field"><label>Иллюстрация</label><select class="select" name="pic"><option value="">Подобрать по слову</option><option value="sketch:book">Книга</option><option value="sketch:cat">Кот</option><option value="sketch:dog">Собака</option><option value="sketch:flower">Цветок</option><option value="sketch:star">Звезда</option><option value="sketch:plane">Самолёт</option><option value="sketch:picture">Рисунок</option></select></div>
      <div class="field"><label>Тема</label><select class="select" name="topic">${S.topics.map((t) => `<option value="${t.id}">${t.icon} ${esc(t.ru)}</option>`).join('')}</select></div>
      <div class="field"><label>Пример (по желанию)</label><input class="input" name="ex" placeholder="I can draw a giraffe."></div>
      <button class="btn full" style="--c:#7FD1AE">Добавить</button>
    </form></details>
      <p class="note">Страницы помогают помнить, что задано в школе. Слова выбирает взрослый: приложение не определяет содержание страницы автоматически. Повторения идут с интервалами 1, 2, 4, 8 и 16 дней; после ошибки начинаем снова с одного дня.</p>
    </div>
    <div id="parent-overview" ${section === 'homework' ? 'hidden' : ''}>

    ${MODE === 'server' ? `<div class="note storage-note" style="margin-top:16px"><p id="sync-status" role="status" aria-live="polite"></p><button class="btn sm white" id="sync-retry">Проверить сохранение</button></div>` : ''}
    ${MODE === 'server' && browserBackup() ? `<div class="note" style="margin-top:14px">На этом устройстве есть прогресс прежней версии. Скачайте текущую резервную копию, прежде чем заменять его.<p><button class="btn sm" id="migrate">Перенести прежний прогресс</button></p></div>` : ''}

    <div class="h2">Эта неделя</div>
    <div class="card">
      <div class="stat"><span>Дней с занятиями</span><span>${active} из 7</span></div>
      <div class="stat"><span>Повторено карточек</span><span>${reps}${reps ? ` · «знаю» ${Math.round((known / reps) * 100)}%` : ''}</span></div>
      <div class="stat"><span>Слов уже встречала</span><span>${seenWords().length} из ${S.words.length}</span></div>
      <div class="stat"><span>Звёзды / наклейки</span><span>⭐ ${p.stars || 0} · ${(p.stickers || []).length}</span></div>
      <div class="stat" style="border:0"><span>Разных рисунков / сохранений</span><span>${groupDrawings(S.gallery).length} / ${S.gallery.length}</span></div>
    </div>


    <div class="h2">Темы</div>
    <div class="card">${S.topics.map((t) => { const st = topicStats(t.id); return `<div class="stat"><span>${t.icon} ${esc(t.ru)}</span><span>${st.learned} выучено · ${st.seen}/${st.total}</span></div>`; }).join('')}</div>

    <div class="h2">Настройки</div>
    <div class="card">
      <div class="field"><label>Новых слов в день</label><select class="select" id="npd">${[1, 2, 3, 4, 5, 6, 8, 10].map((n) => `<option ${n === (p.newPerDay || 4) ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="field"><label>Скорость голоса</label><select class="select" id="rate">${[['0.7', 'медленно'], ['0.85', 'спокойно'], ['1', 'обычно']].map(([v, t]) => `<option value="${v}" ${Number(v) === (p.rate || 0.85) ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
    </div>

    <div class="card" style="margin-top:14px">
      <button class="btn sm full" id="voice" style="--c:#FFD447">🔊 Проверить голос</button>
      <p class="sub" id="voiceInfo" style="margin:10px 0 0;font-size:14px"></p>
      ${isAndroid() ? `<div class="note" style="margin-top:10px"><b>Не слышно английского или голос с акцентом?</b> На Xiaomi: Настройки → Дополнительные настройки → Язык и ввод → <b>Синтез речи</b> → выберите <b>«Синтез речи Google»</b> → шестерёнка → «Установить голосовые данные» → <b>English (United Kingdom)</b>. Потом перезапустите Chrome.</div>` : ''}
    </div>


    ${MODE === 'server' ? `<div class="h2">Новые темы</div><div class="card"><p class="sub">Загрузите подготовленный набор тем и слов. Существующие записи с тем же id обновятся; прогресс и рисунки сохранятся.</p><label class="btn sm full" style="--c:#9AD7C9">Добавить набор тем<input type="file" id="content-import" accept="application/json,.json" hidden></label><p id="content-result" role="status" aria-live="polite"></p></div>` : ''}

    <div class="h2">Резервная копия</div>
    <div class="card">
      <p class="sub" style="margin-top:0">${MODE === 'static'
        ? 'Звёзды, карточки и рисунки хранятся <b>только в этом браузере</b>. Раз в неделю сохраняйте файл прогресса — с ним можно восстановить всё или перенести на другое устройство.'
        : 'Прогресс хранится на сервере. Файл содержит результаты, весь словарь, темы, рисунки и задания. Импорт заменяет результаты выбранного альбома — перед ним автоматически сохраняется прежняя база.'}</p>
      ${MODE === 'server' ? '<p id="backup-status" class="ru" role="status">Проверяем автоматическую резервную копию…</p>' : ''}
      <div class="row"><button class="btn sm grow" id="exp" style="--c:#9AD7C9">⬇️ Скачать прогресс</button>
        <label class="btn sm white grow">⬆️ Загрузить<input type="file" id="imp" accept="application/json,.json" hidden></label></div>
    </div>
    ${MODE === 'static' && !isStandalone() ? `<div class="note" style="margin-top:12px">📌 <b>Установите на телефон:</b> ${installHint()} ${isAndroid()
      ? 'Так приложение открывается во весь экран, а Chrome бережнее хранит прогресс. Не очищайте данные Chrome в «Очистке» Xiaomi.'
      : 'Иначе Safari может стереть прогресс, если неделю не заходить.'}</div>` : ''}

    <div class="h2">Как пользоваться</div>
    <div class="note">
      Начните с 5–10 минут и 1–2 новых слов в день; лимит можно изменить выше. Можно закончить раньше и вернуться позже. На главной — три занятия на выбор: <b>слова → игра → раскраска</b>. За участие — звёзды. Первые наклейки требуют 15, затем 18, 22, 27 и далее до 60 звёзд между наградами. Увеличение порога ограничено, пропуски ничего не отнимают. У Амели все прежние наклейки остаются; до следующей сейчас ${nextReward(p).remaining} звёзд. За три занятия за день — отдельный кубок. В альбоме по 20 наклеек на лист, новые листы появляются автоматически.<br><br>
      Всё английское озвучивается — просите Амели повторять вслух. Слово становится «выученным» (⭐), когда она узнала его 3 раза в разные дни.<br><br>
      Здесь собраны базовые темы. Сверяйте их с учебником и тем, что ребёнок уже знает; можно начать с приветствий, цветов и коротких фраз. Задания и новые слова — во вкладке «Учебник и задания».
    </div>
    </div><p class="release-note">Версия ${RELEASE} · Мастерская с рисунками мелками</p>`;

  if (SESSION) {
    $('#family-profile', el).onchange = async (event) => {
      const target = event.target;
      if (!(await flushSaves())) { target.value = SESSION.profile; toast('Сначала дождитесь сохранения результатов'); return; }
      try { await authRequest('profile', { profile: target.value }); location.reload(); }
      catch (error) { target.value = SESSION.profile; toast(error.message); }
    };
    authRequest('access').then((accounts) => {
      if (!$('#family-access', el)) return;
      $('#family-access', el).innerHTML = accounts.map((a) => `<div class="access-row"><span><b>${esc(a.name)}</b> · логин <code>${esc(a.login)}</code><small>${a.ready ? 'Пароль выдан' : 'Нужен первый пароль'}</small></span><button class="btn sm white" data-password="${a.id}">${a.ready ? 'Новый пароль' : 'Выдать пароль'}</button></div>`).join('');
      for (const button of el.querySelectorAll('[data-password]')) button.onclick = async () => {
        if (button.textContent === 'Новый пароль' && !confirm('Выдать новый пароль? Прежний перестанет работать.')) return;
        button.disabled = true;
        try {
          const result = await authRequest('password', { account: button.dataset.password });
          $('#access-message', el).innerHTML = `Сохраните для входа: логин <b>${esc(result.login)}</b>, пароль <code class="issued-password">${esc(result.password)}</code>. Пароль показан только сейчас.`;
          button.textContent = 'Новый пароль';
        } catch (error) { $('#access-message', el).textContent = error.message; }
        finally { button.disabled = false; }
      };
    }).catch((error) => { if ($('#access-message', el)) $('#access-message', el).textContent = error.message; });
  }
  const homework = mountHomework($('#school-homework', el));
  if (MODE === 'server') fetch('api/backup/status', { headers: SESSION ? { 'X-Amelie-Scope': SESSION.scope } : {}, cache: 'no-store' }).then((r) => r.ok ? r.json() : null).then((status) => {
    const target = $('#backup-status', el); if (!target) return;
    target.textContent = status?.lastSuccess ? `Автокопия: ${new Date(status.lastSuccess).toLocaleString('ru-RU')}. Храним ${status.keep} дневных копий на серверном диске.${status.error ? ' Последняя попытка не удалась: '+status.error : ''}` : 'Автокопия пока не подтверждена. Скачайте файл прогресса.';
  }).catch(() => { const target = $('#backup-status', el); if (target) target.textContent = 'Не удалось проверить автокопию. Файл прогресса можно скачать ниже.'; });

  const updateSync = () => {
    const el = $('#sync-status'); if (!el) return;
    el.textContent = SYNC.pending && !SYNC.durable ? 'Не удалось сохранить очередь на устройстве. Не закрывайте эту страницу до подтверждения сервера; скачайте резервную копию.' : SYNC.error ? `На устройстве сохранено, но сервер пока не подтвердил ${SYNC.pending} записей. ${SYNC.error}` : SYNC.pending ? `Сохраняем: ${SYNC.pending} записей…` : 'Все результаты сохранены на сервере.';
  };
  updateSync();
  document.addEventListener('sync', updateSync);
  $('#sync-retry', el)?.addEventListener('click', () => flushSaves());
  $('#migrate', el)?.addEventListener('click', async () => {
    if (!confirm('Заменить прогресс на сервере прежним прогрессом с этого устройства?')) return;
    try { await importProgress(browserBackup()); toast('Прогресс перенесён'); location.reload(); } catch (error) { toast(error.message); }
  });
  $('#content-import', el)?.addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const pack = JSON.parse(await file.text());
      if (!confirm('Добавить темы и слова из этого набора? Записи с тем же id обновятся.')) return;
      const result = await importContent(pack);
      $('#content-result', el).textContent = `Готово: тем — ${result.topics}, слов — ${result.words}.`;
    } catch (error) { $('#content-result', el).textContent = error.message; }
    finally { e.target.value = ''; }
  });

  $('#exp', el).onclick = async () => {
    let snapshot;
    try { snapshot = await downloadProgress(); } catch (error) { toast(error.message); return; }
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `${SESSION?.profile || 'amelie'}-progress-${todayKey()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  $('#imp', el).onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const preview = await previewProgress(data);
      const message = preview ? `Альбом «${SESSION.name}»: заменить прогресс данными из файла? Звёзд: ${preview.summary.stars}, наклеек: ${preview.summary.stickers}, рисунков: ${preview.summary.drawings}, карточек: ${preview.summary.cards}. Перед переносом сервер сохранит резервную копию.` : 'Заменить текущий прогресс прогрессом из файла?';
      if (!confirm(message)) return;
      await importProgress(data); toast('Прогресс загружен'); location.reload();
    } catch (err) { toast(err.message || 'Не получилось прочитать файл'); }
  };
  $('#voice', el).onclick = () => {
    speak('Hello, Amelie! Let\'s paint a rainbow.');
    const en = ('speechSynthesis' in window) ? speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith('en')) : [];
    $('#voiceInfo', el).textContent = !('speechSynthesis' in window) ? 'Этот браузер не умеет озвучивать текст.'
      : en.length ? `Английских голосов: ${en.length}. Должно звучать «Hello, Amelie!» с английским произношением.`
        : 'Английский голос не найден — озвучка будет молчать или читать с акцентом. См. инструкцию ниже.';
  };
  $('#npd', el).onchange = (e) => { saveProfile({ newPerDay: Number(e.target.value) }); toast('Сохранено'); };
  $('#rate', el).onchange = (e) => { saveProfile({ rate: Number(e.target.value) }); toast('Сохранено'); };
  $('#add', el).addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const en = d.en.trim().toLowerCase();
    if (S.words.some((w) => w.en === en)) { toast('Такое слово уже есть'); return; }
    const order = S.words.filter((w) => w.topic === d.topic).length;
    const id = `${d.topic}-custom-${uid()}`;
    try {
      await save('words', { id, topic: d.topic, en, ru: d.ru.trim(), pic: d.pic.trim() || '🖍️', ex: d.ex.trim() || `I can say: ${en}.`, exRu: '', order, custom: true });
      toast(`Добавлено в «${topicOf(d.topic).ru}»`); e.target.reset(); homework.refreshWithWord(id);
    } catch (error) { toast(error.message); }
  });
  return () => document.removeEventListener('sync', updateSync);
}

function gate(el) {
  const a = 6 + Math.floor(Math.random() * 4); const b = 6 + Math.floor(Math.random() * 4);
  el.innerHTML = `<div class="card" style="text-align:center;margin-top:20px">
    <div style="font-size:54px">🔒</div><div class="h2" style="justify-content:center;margin-top:6px">Только для взрослых</div>
    <p class="sub">Сколько будет ${a} × ${b}?</p>
    <input class="input" id="ans" inputmode="numeric" style="text-align:center;font-size:24px;max-width:160px">
    <div style="margin-top:14px"><button class="btn" id="go">Войти</button></div></div>`;
  const go = () => { if (Number($('#ans', el).value) === a * b) { unlocked = true; window.dispatchEvent(new HashChangeEvent('hashchange'));  } else toast('Неверно'); };
  $('#go', el).onclick = go;
  $('#ans', el).addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
}
