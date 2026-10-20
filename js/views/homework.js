import { S, $, $$, esc, save, uid, wordById } from '../lib.js';
import { assignmentQueue, progOf } from '../srs.js';

// The adult assigns existing words; the child keeps one schedule per word.
export function mountHomework(root) {
  let editing = null;
  function render(message = '') {
    const current = S.assignments.find((a) => a.id === editing);
    const selected = new Set(current?.wordIds || []);
    const assignments = [...S.assignments].sort((a, b) => Number(b.active) - Number(a.active) || b.createdAt - a.createdAt);
    root.innerHTML = `
      <div class="h2">Задание из учебника</div>
      <div class="note">Укажите страницы и выберите слова. Они попадут в общую очередь повторений с приоритетом. Интервалы уже знакомых слов и дневной лимит сохранятся. Если слова ещё нет, сначала добавьте его формой ниже.</div>
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
      <form class="card homework-form" id="homework-form">
        <div class="field"><label for="hw-book">Учебник</label><input class="input" id="hw-book" name="book" required maxlength="120" value="${esc(current?.book || 'Spotlight 2, часть 1')}"></div>
        <div class="row"><div class="field grow"><label for="hw-pages">Страницы</label><input class="input" id="hw-pages" name="pages" required maxlength="60" placeholder="66–68" value="${esc(current?.pages || '')}"></div><div class="field grow"><label for="hw-date">К какому дню · необязательно</label><input class="input" id="hw-date" name="dueDate" type="date" value="${esc(current?.dueDate || '')}"></div></div>
        <div class="field"><label for="hw-task">Что задано · необязательно</label><textarea class="input" id="hw-task" name="task" rows="3" maxlength="1000" placeholder="Номер упражнения, что послушать или повторить">${esc(current?.task || '')}</textarea></div>
        <div class="field"><label for="hw-search">Найти слова для повторения</label><input class="input" id="hw-search" type="search" placeholder="Слово или перевод"></div>
        <fieldset class="homework-words"><legend>Выберите слова</legend>${S.words.map((word) => `<label class="homework-word" data-search="${esc((word.en + ' ' + word.ru).toLowerCase())}"><input type="checkbox" name="wordIds" value="${esc(word.id)}" ${selected.has(word.id) ? 'checked' : ''}><span><b class="en">${esc(word.en)}</b><small>${esc(word.ru)}</small></span></label>`).join('')}</fieldset>
        <p class="ru" id="hw-count" role="status"></p>
        <div class="homework-actions"><button class="btn sm" type="submit">${current ? 'Сохранить задание' : 'Добавить задание'}</button>${current ? '<button class="btn sm white" type="button" id="hw-cancel">Отмена</button>' : ''}</div>
        <p id="hw-message" role="status" aria-live="polite">${esc(message)}</p>
      </form>`;
    const form = $('#homework-form', root);
    const count = () => { $('#hw-count', root).textContent = `Выбрано: ${$$('input[name="wordIds"]:checked', root).length} из 50`; };
    count();
    form.addEventListener('change', count);
    $('#hw-search', root).oninput = (event) => {
      const search = event.target.value.trim().toLowerCase();
      $$('.homework-word', root).forEach((label) => label.classList.toggle('hidden', !label.dataset.search.includes(search)));
    };
    form.onsubmit = async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const wordIds = data.getAll('wordIds');
      const book = data.get('book').trim(); const pages = data.get('pages').trim(); const task = data.get('task').trim();
      if (!book || !pages || /[<>]/.test(book + pages + task)) { $('#hw-message', root).textContent = 'Укажите учебник и страницы обычным текстом, без HTML.'; return; }
      if (!wordIds.length || wordIds.length > 50) { $('#hw-message', root).textContent = 'Выберите от 1 до 50 слов. Для короткого занятия достаточно двух.'; return; }
      await save('assignments', { id: current?.id || uid(), book, pages, task, wordIds, dueDate: data.get('dueDate'), active: current?.active ?? true, createdAt: current?.createdAt || Date.now() });
      editing = null; render('Задание сохранено. Активные задания видны на главной и в очереди повторений.');
    };
    $$('[data-edit]', root).forEach((button) => button.onclick = () => { editing = button.dataset.edit; render(); $('#hw-pages', root).focus(); });
    $$('[data-toggle]', root).forEach((button) => button.onclick = async () => {
      const assignment = S.assignments.find((a) => a.id === button.dataset.toggle);
      await save('assignments', { ...assignment, active: !assignment.active }); render();
    });
    $('#hw-cancel', root)?.addEventListener('click', () => { editing = null; render(); });
  }
  render();
}
