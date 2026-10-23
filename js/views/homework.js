import { S, $, $$, esc, save, uid, wordById, MODE, flushSaves } from '../lib.js';
import { assignmentQueue, progOf } from '../srs.js';
import { LESSON_DRAFTS } from '../lesson-drafts.js';
import { availablePictures } from '../colouring/pictures.js';
import { SESSION } from '../auth.js';

// The adult assigns existing words; the child keeps one schedule per word.
export function mountHomework(root) {
  let editing = null;
  let draft = null;
  function render(message = '') {
    const current = S.assignments.find((a) => a.id === editing);
    const values = draft || current;
    const selected = new Set(values?.wordIds || []);
    const assignments = [...S.assignments].sort((a, b) => Number(b.active) - Number(a.active) || b.createdAt - a.createdAt);
    root.innerHTML = `
      <div class="homework-intro"><span class="studio-label">Из школы — в свой альбом</span><h2>Задания из учебника</h2><p>Запишите, что задано, и выберите слова. Амели увидит задание на главной, а карточки появятся в нужный день.</p></div>
      <ol class="homework-guide"><li>Учебник и страницы</li><li>Слова для повторения</li><li>Сохранить — и готово</li></ol>
      <details class="lesson-preparations"><summary>Готовые маленькие занятия · Spotlight, стр. 66–68</summary><p>Это заготовки, а не домашнее задание учителя. Выберите подходящую, проверьте слова и сохраните. До этого у Амели ничего не меняется.</p><div class="lesson-drafts">${LESSON_DRAFTS.filter((d) => d.wordIds.every((id) => wordById(id))).map((d) => `<button class="btn sm white" data-template="${d.draftId}">Стр. ${d.pages} · ${esc(d.title)}</button>`).join('')}</div></details>
      <div class="homework-list">${assignments.map((a) => `<article class="card homework-card ${a.active ? '' : 'homework-archived'}">
        <b>${esc(a.book)} · стр. ${esc(a.pages)}</b>
        ${a.task ? `<p>${esc(a.task)}</p>` : ''}
        ${a.dueDate ? `<p class="ru">К ${esc(a.dueDate.split('-').reverse().join('.'))}</p>` : ''}
        <p class="ru">${a.active ? `Повторить сегодня: ${assignmentQueue(a).length}` : 'Задание завершено; слова продолжают повторяться в общей очереди'}</p>
        <details><summary>Слова и следующие повторения (${a.wordIds.length})</summary><ul>${a.wordIds.map((id) => {
          const word = wordById(id); const progress = progOf(id);
          const next = !progress ? 'новое' : progress.due < new Date().setHours(24, 0, 0, 0) ? 'сегодня' : new Date(progress.due).toLocaleDateString('ru-RU');
          return `<li>${esc(word?.en || id)} — ${next}</li>`;
        }).join('')}</ul></details>
        <div class="homework-actions"><button class="btn sm white" data-edit="${esc(a.id)}">Изменить</button><button class="btn sm" data-toggle="${esc(a.id)}">${a.active ? 'Завершить задание' : 'Вернуть задание'}</button></div>
      </article>`).join('')}</div>
      ${!assignments.length ? '<div class="homework-empty"><b>Первое задание — с двух знакомых слов</b><p>Например, укажите страницы 66–68 из Spotlight и отметьте слова, которые действительно задали. Достаточно 5 минут.</p></div>' : ''}
      <form class="card homework-form" id="homework-form">
        <h3>${current ? 'Изменить задание' : 'Новое задание'}</h3><p class="ru">1. Что задано в школе</p>
        <div class="field"><label for="hw-book">Учебник</label><input class="input" id="hw-book" name="book" required maxlength="120" value="${esc(values?.book || 'Spotlight 2, часть 1')}"></div>
        <div class="row"><div class="field grow"><label for="hw-pages">Страницы</label><input class="input" id="hw-pages" name="pages" required maxlength="60" placeholder="66–68" value="${esc(values?.pages || '')}"></div><div class="field grow"><label for="hw-date">К какому дню · необязательно</label><input class="input" id="hw-date" name="dueDate" type="date" value="${esc(values?.dueDate || '')}"></div></div>
        <div class="field"><label for="hw-task">Что задано · необязательно</label><textarea class="input" id="hw-task" name="task" rows="3" maxlength="1000" placeholder="Номер упражнения, что послушать или повторить">${esc(values?.task || '')}</textarea></div>
        <div class="field"><label for="hw-picture">Раскраска после слов · необязательно</label><select class="select" id="hw-picture" name="picture"><option value="">Без дополнительной раскраски</option>${availablePictures(SESSION?.profile).map((p) => `<option value="${p.id}" ${values?.picture === p.id ? 'selected' : ''}>${esc(p.ru)}</option>`).join('')}</select></div>
        <p class="ru">2. Какие слова повторять</p><div id="hw-selected" class="selected-words" aria-label="Выбранные слова"></div>
        <div class="field"><label for="hw-search">Найти слова для повторения</label><input class="input" id="hw-search" type="search" placeholder="Слово или перевод"></div>
        <fieldset class="homework-words"><legend>Выберите слова</legend>${S.words.map((word) => `<label class="homework-word" data-search="${esc((word.en + ' ' + word.ru).toLowerCase())}"><input type="checkbox" name="wordIds" value="${esc(word.id)}" ${selected.has(word.id) ? 'checked' : ''}><span><b class="en">${esc(word.en)}</b><small>${esc(word.ru)}</small></span></label>`).join('')}</fieldset>
        <p class="ru" id="hw-count" role="status"></p><p class="homework-hint">Новые слова — в пределах дневного лимита. Уже знакомые повторяются по своему расписанию.</p>
        <details class="lesson-preparations"><summary>Нужна помощь с фотографией или новыми материалами?</summary><p>Можно передать владельцу приложения фотографию задания и этот текст. Он проверит материал и подготовит дополнение через чат. Здесь готовится только текст запроса; фотографию нужно передать владельцу лично.</p><button class="btn sm white" id="hw-copy-request" type="button">Скопировать запрос на подготовку</button><textarea class="input" id="hw-request-text" rows="5" readonly hidden aria-label="Текст запроса"></textarea><p id="hw-copy-status" role="status"></p></details>
        <div class="homework-actions"><button class="btn sm" type="submit">${current ? 'Сохранить задание' : 'Добавить задание'}</button>${current ? '<button class="btn sm white" type="button" id="hw-cancel">Отмена</button>' : ''}</div>
        <p id="hw-message" role="status" aria-live="polite">${esc(message)}</p>
      </form>`;
    const form = $('#homework-form', root);
    const count = () => {
      const inputs = $$('input[name="wordIds"]:checked', root);
      $('#hw-count', root).textContent = `Выбрано: ${inputs.length} из 50`;
      $('#hw-selected', root).innerHTML = inputs.map((input) => `<button class="word-chip" type="button" data-remove="${esc(input.value)}">${esc(wordById(input.value)?.en || '')} <span aria-hidden="true">×</span><span class="sr-only"> — убрать из задания</span></button>`).join('');
      $$('[data-remove]', root).forEach((button) => button.onclick = () => {
        inputs.find((input) => input.value === button.dataset.remove).checked = false; count();
      });
    };
    count();
    form.addEventListener('change', count);
    $('#hw-search', root).oninput = (event) => {
      const search = event.target.value.trim().toLowerCase();
      $$('.homework-word', root).forEach((label) => label.classList.toggle('hidden', !label.dataset.search.includes(search)));
    };
    $('#hw-copy-request', root).onclick = async () => {
      const data = new FormData(form);
      const request = `Подготовить материал для альбома английского.\nУчебник: ${data.get('book')}\nПечатные страницы: ${data.get('pages') || 'уточнить'}\nК какому дню: ${data.get('dueDate') || 'не указано'}\nЧто задано: ${data.get('task') || 'уточнить по фотографии'}\nСлова из словаря: ${data.getAll('wordIds').map((id) => wordById(id)?.en).filter(Boolean).join(', ') || 'подобрать после проверки'}\nНужные новые слова и рисунки: уточнить.\nСохранить прежний прогресс и сначала подготовить черновик.`;
      const output = $('#hw-request-text', root); output.hidden = false; output.value = request;
      try { await navigator.clipboard.writeText(request); $('#hw-copy-status', root).textContent = 'Скопировано. Отправьте владельцу вместе с фотографией. Амели пока ничего не назначено.'; }
      catch { output.focus(); output.select(); $('#hw-copy-status', root).textContent = 'Выделите и скопируйте текст. Амели пока ничего не назначено.'; }
    };
    form.onsubmit = async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const wordIds = data.getAll('wordIds');
      const book = data.get('book').trim(); const pages = data.get('pages').trim(); const task = data.get('task').trim();
      if (!book || !pages || /[<>]/.test(book + pages + task)) { $('#hw-message', root).textContent = 'Укажите учебник и страницы обычным текстом, без HTML.'; return; }
      if (!wordIds.length || wordIds.length > 50) { $('#hw-message', root).textContent = 'Выберите от 1 до 50 слов. Для короткого занятия достаточно двух.'; return; }
      const button = form.querySelector('button[type="submit"]'); button.disabled = true;
      await save('assignments', { id: current?.id || uid(), book, pages, task, wordIds, dueDate: data.get('dueDate'), picture: data.get('picture'), active: current?.active ?? true, createdAt: current?.createdAt || Date.now() });
      const synced = MODE !== 'server' || await flushSaves();
      editing = null; draft = null; render(synced ? 'Задание сохранено. Активные задания видны на главной и в очереди повторений.' : 'Задание сохранено на этом устройстве и ждёт связи. На другом устройстве оно появится после подтверждения сервера.');
    };
    $$('[data-edit]', root).forEach((button) => button.onclick = () => { editing = button.dataset.edit; draft = null; render(); $('#hw-pages', root).focus(); });
    $$('[data-toggle]', root).forEach((button) => button.onclick = async () => {
      const assignment = S.assignments.find((a) => a.id === button.dataset.toggle);
      button.disabled = true;
      await save('assignments', { ...assignment, active: !assignment.active });
      const synced = MODE !== 'server' || await flushSaves(); render(synced ? '' : 'Изменение ждёт подтверждения сервера.');
    });
    $('#hw-cancel', root)?.addEventListener('click', () => { editing = null; draft = null; render(); });
    $$('[data-template]', root).forEach((button) => button.onclick = () => {
      editing = null; draft = { ...LESSON_DRAFTS.find((d) => d.draftId === button.dataset.template) };
      render('Проверьте заготовку. Нажмите «Добавить задание», только если хотите показать её Амели.'); $('#hw-pages', root).focus();
    });
  }
  render();
  return {
    refreshWithWord(id) {
      const data = new FormData($('#homework-form', root));
      draft = { book: data.get('book'), pages: data.get('pages'), dueDate: data.get('dueDate'), task: data.get('task'), picture: data.get('picture'), wordIds: [...new Set([...data.getAll('wordIds'), id])] };
      render('Новое слово добавлено и выбрано. Осталось сохранить задание.');
    },
  };
}
