import { applyActivity } from '../js/activity.js';
import { defaultProfile } from '../js/rewards.js';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export { COLLECTIONS, STATE, ValidationError, validateItem } from '../js/data-model.js';
import { COLLECTIONS, STATE, ValidationError, validateItem, validId, plain, optionalText, integer, requireThat } from '../js/data-model.js';

export function openStore(path = join(process.env.DATA_DIR || join(ROOT, '.local'), 'amelie.sqlite')) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  db.exec(`CREATE TABLE IF NOT EXISTS records (collection TEXT NOT NULL, id TEXT NOT NULL, body TEXT NOT NULL, PRIMARY KEY(collection,id));
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS activity_events (id TEXT PRIMARY KEY, body TEXT NOT NULL);`);
  const all = db.prepare('SELECT body FROM records WHERE collection=? ORDER BY rowid');
  const get = db.prepare('SELECT body FROM records WHERE collection=? AND id=?');
  const put = db.prepare('INSERT INTO records(collection,id,body) VALUES(?,?,?) ON CONFLICT(collection,id) DO UPDATE SET body=excluded.body');
  const transaction = (fn, dryRun = false) => { db.exec('BEGIN IMMEDIATE'); try { const result = fn(); db.exec(dryRun ? 'ROLLBACK' : 'COMMIT'); return result; } catch (e) { db.exec('ROLLBACK'); throw e; } };
  const store = {
    db,
    list: (col) => all.all(col).map((r) => JSON.parse(r.body)),
    get: (col, id) => { const row = get.get(col, id); return row ? JSON.parse(row.body) : undefined; },
    put(col, item) {
      if (col === 'profile' && plain(item) && validId(item.id)) {
        validateItem(col, { ...defaultProfile(), ...item });
        const previous = store.get('profile', item.id) || { id: 'amelie', stars: 0, newPerDay: 4, rate: 0.85, days: {}, stickers: [] };
        const days = { ...previous.days };
        if (plain(item.days)) for (const [day, steps] of Object.entries(item.days)) days[day] = { ...days[day], ...steps };
        item = { ...previous, ...item, ...(plain(item.days) ? { days } : {}) };
        // An older tab may still send the previous absolute total. Imports replace records explicitly.
        if (item.stars < previous.stars) item.stars = previous.stars;
        if (Array.isArray(previous.stickers) && Array.isArray(item.stickers)) {
          const key = (s) => s.id || JSON.stringify([s.s, s.ts, Boolean(s.bonus)]);
          item.stickers = [...new Map([...previous.stickers, ...item.stickers].map((s) => [key(s), s])).values()];
        }
        if (previous.rewardTrack && (!item.rewardTrack || item.rewardTrack.nextAt < previous.rewardTrack.nextAt)) item.rewardTrack = previous.rewardTrack;
      }
      validateItem(col, item);
      if (col === 'words') requireThat(Boolean(store.get('topics', item.topic)), 'Тема слова не найдена');
      if (col === 'assignments') requireThat(item.wordIds.every((id) => store.get('words', id)), 'Некоторые слова задания не найдены. Сначала добавьте их в словарь.');
      put.run(col, item.id, JSON.stringify(item));
      return item;
    },
    activity(event) {
      requireThat(plain(event) && validId(event.id) && ['stars', 'step', 'review'].includes(event.kind) && integer(event.ts, 1, Number.MAX_SAFE_INTEGER), 'Некорректное действие');
      if (event.kind === 'stars') requireThat(integer(event.amount, 1, 100) && optionalText(event.where, 30), 'Некорректная награда');
      else {
        requireThat(typeof event.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(event.day) && Number.isFinite(Date.parse(event.day)) && new Date(event.day).toISOString().slice(0, 10) === event.day, 'Некорректный день занятия');
        if (event.kind === 'step') requireThat(['words', 'play', 'art'].includes(event.step), 'Некорректный шаг занятия');
        else {
          requireThat(validId(event.word) && typeof event.know === 'boolean' && integer(event.dayStart, 0, Number.MAX_SAFE_INTEGER) && event.ts - event.dayStart >= 0 && event.ts - event.dayStart < 90000000, 'Некорректное повторение');
        }
      }
      return transaction(() => {
        const body = JSON.stringify(Object.fromEntries(Object.entries(event).sort(([a], [b]) => a.localeCompare(b))));
        const previous = db.prepare('SELECT body FROM activity_events WHERE id=?').get(event.id);
        if (previous) {
          requireThat(previous.body === body, 'Этот id действия уже занят');
          return { duplicate: true, profile: store.get('profile', 'amelie') || defaultProfile(), ...(event.kind === 'review' ? { progress: store.get('progress', event.word) || null, log: store.get('log', event.id) || null } : {}), awarded: [] };
        }
        if (event.kind === 'review') {
          requireThat(Boolean(store.get('words', event.word)), 'Слово не найдено');
          requireThat(event.assignment === undefined || Boolean(store.get('assignments', event.assignment)?.wordIds.includes(event.word)), 'Слово не найдено в задании');
        }
        const result = applyActivity(store.get('profile', 'amelie') || {}, event.kind === 'review' ? store.get('progress', event.word) : null, event);
        store.put('profile', result.profile);
        if (result.progress) { store.put('progress', result.progress); store.put('log', result.log); }
        db.prepare('INSERT INTO activity_events(id,body) VALUES(?,?)').run(event.id, body);
        return result;
      });
    },
    importContent(pack, { dryRun = false } = {}) {
      requireThat(plain(pack) && Array.isArray(pack.topics) && Array.isArray(pack.words), 'Нужен набор с массивами topics и words');
      requireThat(pack.topics.length <= 100 && pack.words.length <= 5000, 'Слишком большой набор');
      for (const [col, items] of Object.entries({ topics: pack.topics, words: pack.words })) {
        const ids = new Set();
        for (const item of items) { validateItem(col, item); requireThat(!ids.has(item.id), 'Повторяющийся id: ' + item.id); ids.add(item.id); }
      }
      return transaction(() => {
        for (const topic of pack.topics) store.put('topics', topic);
        for (const word of pack.words) store.put('words', word);
        return { topics: pack.topics.length, words: pack.words.length };
      }, dryRun);
    },
    importProgress(file, { dryRun = false, migrationId } = {}) {
      requireThat(file?.app === 'amelie-art-studio' && file.version === 1 && plain(file.data), 'Это не файл прогресса Амели');
      const data = { ...file.data, assignments: file.data.assignments === undefined ? [] : file.data.assignments };
      if (data.topics === undefined) data.topics = [];
      requireThat(data.activityEvents === undefined || (Array.isArray(data.activityEvents) && data.activityEvents.length <= 1000000 && data.activityEvents.every((entry) => plain(entry) && validId(entry.id) && typeof entry.body === 'string' && entry.body.length <= 2000)), 'Некорректный журнал сохранённых действий');
      for (const col of [...STATE, 'words', 'topics']) {
        requireThat(Array.isArray(data[col]) && data[col].length <= 100000, 'Некорректный массив: ' + col);
        const ids = new Set();
        for (const item of data[col]) { validateItem(col, item); requireThat(!ids.has(item.id), 'Повторяющийся id'); ids.add(item.id); }
      }
      return transaction(() => {
        if (migrationId) {
          requireThat(/^[a-f0-9]{64}$/.test(migrationId), 'Некорректный код переноса');
          const previous = db.prepare("SELECT value FROM meta WHERE key='initial-progress-import'").get();
          if (previous?.value === migrationId) return { alreadyImported: true };
          requireThat(!previous && STATE.every((col) => store.list(col).length === 0), 'Первичный перенос разрешён только в пустой альбом');
        }
        for (const item of data.topics) store.put('topics', item);
        for (const item of data.words) store.put('words', { ...item, ...(file.contentSnapshot ? {} : { custom: true }) });
        for (const col of STATE) {
          db.prepare('DELETE FROM records WHERE collection=?').run(col);
          for (const item of data[col]) store.put(col, item);
        }
        for (const receipt of data.activityEvents || []) {
          const previous = db.prepare('SELECT body FROM activity_events WHERE id=?').get(receipt.id);
          requireThat(!previous || previous.body === receipt.body, 'Конфликт сохранённого действия');
          db.prepare('INSERT OR IGNORE INTO activity_events(id,body) VALUES(?,?)').run(receipt.id, receipt.body);
        }
        if (migrationId) db.prepare("INSERT INTO meta(key,value) VALUES('initial-progress-import',?)").run(migrationId);
        return { imported: true };
      }, dryRun);
    },
    exportProgress: () => ({ app: 'amelie-art-studio', version: 1, contentSnapshot: true, exportedAt: new Date().toISOString(), data: { ...Object.fromEntries(STATE.map((col) => [col, store.list(col)])), topics: store.list('topics'), words: store.list('words'), activityEvents: db.prepare('SELECT id,body FROM activity_events ORDER BY rowid').all().map((row) => ({ ...row })) } }),
    close: () => db.close(),
  };
  if (!db.prepare("SELECT value FROM meta WHERE key='seeded'").get()) {
    store.importContent(Object.fromEntries(['topics', 'words'].map((col) => [col, JSON.parse(readFileSync(join(ROOT, 'data', col + '.json'), 'utf8'))])));
    db.prepare("INSERT INTO meta(key,value) VALUES('seeded','1')").run();
  }
  return store;
}
