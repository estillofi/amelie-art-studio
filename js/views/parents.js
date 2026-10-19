import { S, esc, profile, saveProfile, save, toast, todayKey, startOfDay, DAY, topicOf, $, MODE, exportProgress, importProgress } from '../lib.js';
import { topicStats, seenWords } from '../srs.js';

let unlocked = false;
const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

// #/parents — a simple grown-up gate, then progress, settings and "add a word from the textbook".
export default function parents(el) {
  if (!unlocked) return gate(el);
  const p = profile();
  const week = Array.from({ length: 7 }, (_, i) => todayKey(new Date(startOfDay() - (6 - i) * DAY)));
  const days = p.days || {};
  const logDays = new Set(S.log.map((l) => l.day));
  const active = week.filter((d) => days[d] || logDays.has(d)).length;
  const reps = S.log.filter((l) => week.includes(l.day)).length;
  const known = S.log.filter((l) => week.includes(l.day) && l.know).length;

  el.innerHTML = `
    <div class="hello" style="font-size:34px">Для родителей</div>
    <div class="sub">Как идут дела у Амели</div>

    <div class="h2">Эта неделя</div>
    <div class="card">
      <div class="stat"><span>Дней с занятиями</span><span>${active} из 7</span></div>
      <div class="stat"><span>Повторено карточек</span><span>${reps}${reps ? ` · «знаю» ${Math.round((known / reps) * 100)}%` : ''}</span></div>
      <div class="stat"><span>Слов уже встречала</span><span>${seenWords().length} из ${S.words.length}</span></div>
      <div class="stat"><span>Звёзды / наклейки</span><span>⭐ ${p.stars || 0} · ${(p.stickers || []).length}</span></div>
      <div class="stat" style="border:0"><span>Рисунков в галерее</span><span>${S.gallery.length}</span></div>
    </div>

    <div class="h2">Темы</div>
    <div class="card">${S.topics.map((t) => { const st = topicStats(t.id); return `<div class="stat"><span>${t.icon} ${esc(t.ru)}</span><span>${st.learned} выучено · ${st.seen}/${st.total}</span></div>`; }).join('')}</div>

    <div class="h2">Настройки</div>
    <div class="card">
      <div class="field"><label>Новых слов в день</label><select class="select" id="npd">${[3, 4, 5, 6, 8, 10].map((n) => `<option ${n === (p.newPerDay || 6) ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="field"><label>Скорость голоса</label><select class="select" id="rate">${[['0.7', 'медленно'], ['0.85', 'спокойно'], ['1', 'обычно']].map(([v, t]) => `<option value="${v}" ${Number(v) === (p.rate || 0.85) ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
    </div>

    <div class="h2">Добавить слово из учебника</div>
    <form class="card" id="add">
      <div class="field"><label>Слово по-английски</label><input class="input" name="en" required placeholder="giraffe"></div>
      <div class="field"><label>Перевод</label><input class="input" name="ru" required placeholder="жираф"></div>
      <div class="field"><label>Эмодзи-картинка</label><input class="input" name="pic" placeholder="🦒"></div>
      <div class="field"><label>Тема</label><select class="select" name="topic">${S.topics.map((t) => `<option value="${t.id}">${t.icon} ${esc(t.ru)}</option>`).join('')}</select></div>
      <div class="field"><label>Пример (по желанию)</label><input class="input" name="ex" placeholder="I can draw a giraffe."></div>
      <button class="btn full" style="--c:#7FD1AE">Добавить</button>
    </form>

    <div class="h2">Резервная копия</div>
    <div class="card">
      <p class="sub" style="margin-top:0">${MODE === 'static'
        ? 'Звёзды, карточки и рисунки хранятся <b>только в этом браузере</b>. Раз в неделю сохраняйте файл прогресса — с ним можно восстановить всё или перенести на другое устройство.'
        : 'Прогресс хранится на сервере. Файл пригодится для переноса или на всякий случай.'}</p>
      <div class="row"><button class="btn sm grow" id="exp" style="--c:#9AD7C9">⬇️ Скачать прогресс</button>
        <label class="btn sm white grow">⬆️ Загрузить<input type="file" id="imp" accept="application/json,.json" hidden></label></div>
    </div>
    ${MODE === 'static' && !standalone() ? `<div class="note" style="margin-top:12px">📌 <b>Важно для iPhone:</b> откройте сайт в Safari → «Поделиться» → «На экран „Домой“». Иначе Safari может стереть прогресс, если неделю не заходить. С иконки приложение открывается во весь экран.</div>` : ''}

    <div class="h2">Как пользоваться</div>
    <div class="note">
      10–15 минут в день лучше, чем час раз в неделю. На главной — план из трёх шагов: <b>слова → игра → раскраска</b>. За всё — звёзды, каждые 15 звёзд — наклейка, за все три шага за день — кубок.<br><br>
      Всё английское озвучивается — просите Амели повторять вслух. Слово становится «выученным» (⭐), когда она узнала его 3 раза в разные дни.<br><br>
      Темы идут в порядке программы 2 класса (Spotlight 2 и похожие учебники). Если у вас другой учебник — добавляйте слова из него через форму выше.
    </div>`;

  $('#exp', el).onclick = () => {
    const blob = new Blob([JSON.stringify(exportProgress(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `amelie-progress-${todayKey()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  $('#imp', el).onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!confirm('Заменить текущий прогресс прогрессом из файла?')) return;
      await importProgress(data); toast('Прогресс загружен'); parents(el);
    } catch (err) { toast(err.message || 'Не получилось прочитать файл'); }
  };
  $('#npd', el).onchange = (e) => { saveProfile({ newPerDay: Number(e.target.value) }); toast('Сохранено'); };
  $('#rate', el).onchange = (e) => { saveProfile({ rate: Number(e.target.value) }); toast('Сохранено'); };
  $('#add', el).addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const en = d.en.trim().toLowerCase();
    if (S.words.some((w) => w.en === en)) { toast('Такое слово уже есть'); return; }
    const order = S.words.filter((w) => w.topic === d.topic).length;
    await save('words', { id: `${d.topic}-${en.replace(/\s+/g, '-')}`, topic: d.topic, en, ru: d.ru.trim(), pic: d.pic.trim() || '🖍️', ex: d.ex.trim() || `I like the ${en}.`, exRu: '', order, custom: true });
    toast(`Добавлено в «${topicOf(d.topic).ru}»`); e.target.reset();
  });
}

function gate(el) {
  const a = 6 + Math.floor(Math.random() * 4); const b = 6 + Math.floor(Math.random() * 4);
  el.innerHTML = `<div class="card" style="text-align:center;margin-top:20px">
    <div style="font-size:54px">🔒</div><div class="h2" style="justify-content:center;margin-top:6px">Только для взрослых</div>
    <p class="sub">Сколько будет ${a} × ${b}?</p>
    <input class="input" id="ans" inputmode="numeric" style="text-align:center;font-size:24px;max-width:160px">
    <div style="margin-top:14px"><button class="btn" id="go">Войти</button></div></div>`;
  const go = () => { if (Number($('#ans', el).value) === a * b) { unlocked = true; parents(el); } else toast('Неверно'); };
  $('#go', el).onclick = go;
  $('#ans', el).addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
}
