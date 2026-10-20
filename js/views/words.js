import { S, esc, wordPic, speak, sfx, addStars, markStep, celebrate, topicOf, $, $$, ICON } from '../lib.js';
import { todayQueue, grade, topicStats, seen, learned, assignmentQueue } from '../srs.js';

// #/words — topics as sketchbook pages
export function topics(el) {
  el.innerHTML = `
    <div class="hello" style="font-size:34px">My words</div>
    <div class="sub">Мои слова · выбери страницу альбома</div>
    <a class="btn full" href="#/learn" style="margin:16px 0 4px;--c:#FFD23F">📒 Учить слова на сегодня</a>
    <div class="grid2" style="margin-top:14px">
      ${S.topics.map((t) => {
        const st = topicStats(t.id);
        return `<a class="tile painted" href="#/topic/${t.id}" style="--c:${t.color}">
          <span class="big">${t.icon}</span><span class="t en">${esc(t.en)}</span><span class="s">${esc(t.ru)} · ${st.learned}/${st.total} ⭐</span>
          <span class="bar"><i style="width:${st.total ? (st.seen / st.total) * 100 : 0}%;--c:${t.color}"></i></span></a>`;
      }).join('')}
    </div>`;
}

// #/topic/<id> — all words of a topic; tap to hear
export function topic(el, id) {
  const t = topicOf(id);
  if (!t) { location.hash = '#/words'; return; }
  const ws = S.words.filter((w) => w.topic === id).sort((a, b) => a.order - b.order);
  el.innerHTML = `
    <div class="row" style="margin:4px 0 12px"><span style="font-size:44px">${t.icon}</span><div><div class="hello" style="font-size:34px;margin:0">${esc(t.en)}</div><div class="sub">${esc(t.ru)} · нажми на картинку и послушай</div></div></div>
    <div class="wgrid">${ws.map((w) => `<button class="w ${seen(w.id) ? '' : 'new'}" data-id="${w.id}">
      ${learned(w.id) ? '<span class="st">⭐</span>' : ''}${wordPic(w)}<span class="en">${esc(w.en)}</span><span class="ru">${esc(w.ru)}</span></button>`).join('')}</div>
    <a class="btn full" href="#/learn/${id}" style="margin-top:18px;--c:${t.color}">Учить эту тему</a>`;
  $$('[data-id]', el).forEach((b) => b.addEventListener('click', () => {
    const w = S.words.find((x) => x.id === b.dataset.id);
    speak(w.en); b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], 250);
  }));
}

// #/learn[/<topic>] — flashcards. New word: see + hear. Known word: picture first, say it, then check.
export function learn(el, topicId, assignment = null) {
  let queue = assignment ? assignmentQueue(assignment) : todayQueue(topicId || null);
  const total = queue.length;
  let shown = false; let done = 0; let stars = 0;

  function paint() {
    const it = queue[0];
    if (!it) {
      if (!topicId) markStep('words');
      el.innerHTML = `<div class="card flash"><div style="font-size:84px">🎉</div><div class="word" style="font-size:36px">Well done!</div>
        <div class="word-ru">${done ? `Ты повторила ${done} ${done === 1 ? 'слово' : done < 5 ? 'слова' : 'слов'}` : assignment ? 'На сегодня достаточно. Остальные слова появятся в свой день.' : 'На сегодня всё повторено'}</div>
        <a class="btn" href="#/play" style="--c:#7FD1AE">🎲 Поиграть</a><a class="btn white" href="#/">🏠 Домой</a></div>`;
      if (done) celebrate(`Молодец! +${stars} ⭐`, '🎨');
      return;
    }
    const { w, isNew } = it;
    const reveal = isNew || shown;
    el.innerHTML = `
      ${assignment ? `<div class="lesson-source"><b>${esc(assignment.book)} · стр. ${esc(assignment.pages)}</b>${assignment.task ? `<p>${esc(assignment.task)}</p>` : ''}</div>` : ''}
      <div class="progress"><i style="width:${total ? (done / total) * 100 : 0}%"></i></div>
      <div class="card flash">
        <button class="icon-btn say" id="say" aria-label="Послушать">${ICON.sound}</button>
        ${isNew ? '<div class="q">🆕 Новое слово — послушай и повтори</div>' : reveal ? '' : '<div class="q">Как это по-английски? Скажи вслух!</div>'}
        ${wordPic(w, 'xl')}
        ${reveal ? `<div class="word">${esc(w.en)}</div><div class="word-ru">${esc(w.ru)}</div>
          <div class="ex"><span class="en">${esc(w.ex)}</span><span class="ru">${esc(w.exRu)}</span></div>` : ''}
      </div>
      ${isNew ? '<div class="duo" style="grid-template-columns:1fr"><button class="btn full" id="next" style="--c:#7FD1AE">Дальше →</button></div>'
        : reveal ? '<div class="duo"><button class="btn" id="again" style="--c:#FFB3CF">🔁 Ещё повторю</button><button class="btn" id="know" style="--c:#7FD1AE">😊 Знаю!</button></div>'
          : '<div class="duo" style="grid-template-columns:1fr"><button class="btn full" id="show">👀 Проверить</button></div>'}`;
    $('#say', el).onclick = () => speak(w.en);
    $('#show', el)?.addEventListener('click', () => { shown = true; paint(); speak(w.en); });
    $('#next', el)?.addEventListener('click', () => answer(true));
    $('#know', el)?.addEventListener('click', () => answer(true));
    $('#again', el)?.addEventListener('click', () => answer(false));
    if (reveal) speak(w.en);
  }

  function answer(know) {
    const it = queue.shift();
    grade(it.w.id, know, assignment?.id);
    if (know) { sfx.ok(); done++; stars++; addStars(1, 'words'); }
    else { sfx.pop(); queue.splice(Math.min(3, queue.length), 0, { w: it.w, isNew: false }); }
    shown = false; paint();
  }

  paint();
}

export function learnAssignment(el, id) {
  const assignment = S.assignments.find((a) => a.id === id && a.active);
  if (!assignment) {
    el.innerHTML = '<div class="note">Это задание уже завершено или не найдено.</div><a class="btn full" href="#/">Домой</a>';
    return;
  }
  return learn(el, null, assignment);
}

