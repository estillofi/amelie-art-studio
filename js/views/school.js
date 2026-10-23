import { S, esc, $, $$, speak, wordPic, paperArt, wordById } from '../lib.js';
import { activeAssignments, assignmentQueue, progOf, LESSON_LIMIT } from '../srs.js';

export default function school(el) {
  const active = activeAssignments();
  const archived = S.assignments.filter((a) => !a.active).sort((a,b) => b.createdAt-a.createdAt);
  const card = (a) => {
    const queue = a.active ? assignmentQueue(a) : [];
    return `<article class="card school-assignment"><span class="studio-label">${a.active ? 'Из школы в альбом' : 'Задание завершено'}</span><h2>${esc(a.book)} · стр. ${esc(a.pages)}</h2>${a.task ? `<p>${esc(a.task)}</p>` : ''}${a.dueDate ? `<p class="ru">К ${esc(a.dueDate.split('-').reverse().join('.'))}</p>` : ''}
      ${a.active ? queue.length ? `<a class="btn full homework-start" href="#/homework/${encodeURIComponent(a.id)}">Повторить сегодня · ${Math.min(queue.length, LESSON_LIMIT)}</a>${queue.length > LESSON_LIMIT ? '<p class="ru">Можно заниматься понемногу. Остальные слова сохранятся на потом.</p>' : ''}` : '<p class="school-rest">На сегодня достаточно. Следующие карточки появятся в свой день.</p>' : '<p class="ru">Слова продолжают повторяться в общей очереди.</p>'}
      <details><summary>Послушать слова и посмотреть расписание</summary><p class="ru">Здесь можно просто послушать: расписание и звёзды не меняются.</p><div class="school-word-list">${a.wordIds.map((id)=>{
        const w=wordById(id); if(!w)return ''; const p=progOf(id);
        return `<button class="school-word" data-say="${esc(id)}">${wordPic(w,'mini')}<span><b>${esc(w.en)}</b><small>${esc(w.ru)} · ${!p ? 'новое' : p.due < new Date().setHours(24,0,0,0) ? 'повторение сегодня' : 'повторение '+new Date(p.due).toLocaleDateString('ru-RU')}</small></span></button>`;
      }).join('')}</div></details>${a.picture ? `<a class="btn white full" href="#/colour/${encodeURIComponent(a.picture)}/free" style="margin-top:12px">Немного порисовать</a>` : ''}</article>`;
  };
  el.innerHTML=`<span class="studio-label">Школа и свой темп</span><h1 class="hello">Мой учебник</h1><p class="sub">Выберите со взрослым страницы и несколько слов. Сначала послушаем, потом попробуем сами.</p>${active.length ? active.map(card).join('') : `<div class="card school-empty">${paperArt('book','lg')}<p>Здесь появятся задания, которые добавит взрослый. А пока можно открыть знакомые слова.</p><a class="btn" href="#/words">Мои слова</a></div>`}${archived.length ? `<details class="school-archive"><summary>Завершённые задания · ${archived.length}</summary>${archived.slice(0,20).map(card).join('')}${archived.length>20 ? '<p>Остальные задания сохранены в разделе взрослого.</p>' : ''}</details>` : ''}<a class="school-manage" href="#/parents/homework">Взрослым: добавить школьное задание →</a>`;
  $$('[data-say]',el).forEach((button)=>button.onclick=()=>speak(wordById(button.dataset.say).en));
}
