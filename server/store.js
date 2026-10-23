import { PICTURE_IDS } from '../js/colouring/pictures.js';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const COLLECTIONS = ['topics', 'words', 'progress', 'log', 'profile', 'gallery', 'assignments'];
export const STATE = ['progress', 'log', 'profile', 'gallery', 'assignments'];
const ID = /^[a-zA-Z0-9_-]{1,100}$/;
const validId = (v) => typeof v === 'string' && ID.test(v);
const COLOR = /^#[\da-f]{6}$/i;
const plain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const text = (v, max = 500) => typeof v === 'string' && v.length > 0 && v.length <= max && !/[<>\u0000-\u0008]/.test(v);
const optionalText = (v, max = 500) => v === undefined || v === '' || text(v, max);
const integer = (v, min, max) => Number.isSafeInteger(v) && v >= min && v <= max;

export class ValidationError extends Error {}
function requireThat(condition, message) { if (!condition) throw new ValidationError(message); }

export function validateItem(col, item) {
  requireThat(COLLECTIONS.includes(col), 'Неизвестная коллекция');
  requireThat(plain(item) && validId(item.id), 'У записи должен быть корректный id');
  requireThat(!Object.keys(item).some((k) => ['__proto__', 'constructor', 'prototype'].includes(k)), 'Недопустимое поле');
  if (col === 'topics') {
    requireThat(text(item.en, 100) && text(item.ru, 100), 'У темы нужны названия en и ru');
    requireThat(text(item.icon, 30) && COLOR.test(item.color) && integer(item.order, 0, 10000), 'Проверьте icon, color и order темы');
  } else if (col === 'words') {
    requireThat(validId(item.topic) && text(item.en, 100) && text(item.ru, 200), 'У слова нужны topic, en и ru');
    requireThat(integer(item.order, 0, 10000), 'Некорректный порядок слова');
    requireThat(optionalText(item.ex) && optionalText(item.exRu) && optionalText(item.pic, 30), 'Некорректный пример или картинка');
    requireThat(item.color === undefined || COLOR.test(item.color), 'Некорректный цвет');
    requireThat(item.num === undefined || integer(item.num, 1, 1000), 'Некорректное число');
    requireThat(item.custom === undefined || typeof item.custom === 'boolean', 'Некорректный признак своего слова');
  } else if (col === 'progress') {
    requireThat(integer(item.box, 0, 5) && integer(item.reps, 0, 1000000) && integer(item.due, 0, Number.MAX_SAFE_INTEGER), 'Некорректный прогресс');
  } else if (col === 'log') {
    requireThat(validId(item.word) && typeof item.know === 'boolean' && typeof item.wasNew === 'boolean' && /^\d{4}-\d{2}-\d{2}$/.test(item.day), 'Некорректная запись занятия');
    requireThat(integer(item.ts, 0, Number.MAX_SAFE_INTEGER), 'Некорректное время занятия');
  } else if (col === 'profile') {
    requireThat(item.id === 'amelie', 'Этот выпуск поддерживает один профиль: amelie');
    requireThat(integer(item.stars ?? 0, 0, 10000000), 'Некорректное число звёзд');
    requireThat(item.newPerDay === undefined || integer(item.newPerDay, 1, 10), 'От 1 до 10 новых слов в день');
    requireThat(item.rate === undefined || (Number.isFinite(item.rate) && item.rate >= 0.5 && item.rate <= 1.5), 'Некорректная скорость голоса');
    requireThat(item.stickers === undefined || (Array.isArray(item.stickers) && item.stickers.every((s) => plain(s) && text(s.s, 30) && integer(s.ts, 0, Number.MAX_SAFE_INTEGER))), 'Некорректные наклейки');
    requireThat(item.days === undefined || (plain(item.days) && Object.entries(item.days).every(([day, steps]) => /^\d{4}-\d{2}-\d{2}$/.test(day) && plain(steps) && Object.entries(steps).every(([key, value]) => ['words', 'play', 'art', 'bonus'].includes(key) && (key === 'bonus' ? typeof value === 'boolean' : integer(value, 0, Number.MAX_SAFE_INTEGER))))), 'Некорректный план занятий');
  } else if (col === 'gallery') {
    requireThat(PICTURE_IDS.includes(item.pic) && plain(item.fills), 'Некорректный рисунок');
    requireThat(Object.entries(item.fills).every(([key, value]) => /^[a-z]+$/.test(key) && COLOR.test(value)), 'Некорректная раскраска');
    requireThat(integer(item.ts, 0, Number.MAX_SAFE_INTEGER), 'Некорректное время рисунка');
  } else if (col === 'assignments') {
    requireThat(text(item.book, 120) && text(item.pages, 60) && optionalText(item.task, 1000), 'Укажите учебник и страницы; задание — до 1000 символов');
    requireThat(Array.isArray(item.wordIds) && item.wordIds.length >= 1 && item.wordIds.length <= 50 && item.wordIds.every(validId) && new Set(item.wordIds).size === item.wordIds.length, 'Выберите от 1 до 50 разных слов');
    requireThat(typeof item.active === 'boolean' && integer(item.createdAt, 0, Number.MAX_SAFE_INTEGER), 'Некорректное задание');
    requireThat(item.dueDate === undefined || item.dueDate === '' || (typeof item.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.dueDate) && Number.isFinite(Date.parse(item.dueDate)) && new Date(item.dueDate).toISOString().slice(0, 10) === item.dueDate), 'Некорректная дата задания');
  }
  return item;
}

export function openStore(path = join(process.env.DATA_DIR || join(ROOT, '.local'), 'amelie.sqlite')) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  db.exec(`CREATE TABLE IF NOT EXISTS records (collection TEXT NOT NULL, id TEXT NOT NULL, body TEXT NOT NULL, PRIMARY KEY(collection,id));
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
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
        const previous = store.get('profile', item.id) || { id: 'amelie', stars: 0, newPerDay: 4, rate: 0.85, days: {}, stickers: [] };
        const days = { ...previous.days };
        if (plain(item.days)) for (const [day, steps] of Object.entries(item.days)) days[day] = { ...days[day], ...steps };
        item = { ...previous, ...item, ...(plain(item.days) ? { days } : {}) };
      }
      validateItem(col, item);
      if (col === 'words') requireThat(Boolean(store.get('topics', item.topic)), 'Тема слова не найдена');
      if (col === 'assignments') requireThat(item.wordIds.every((id) => store.get('words', id)), 'Некоторые слова задания не найдены. Сначала добавьте их в словарь.');
      put.run(col, item.id, JSON.stringify(item));
      return item;
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
      for (const col of [...STATE, 'words']) {
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
        for (const item of data.words) store.put('words', { ...item, custom: true });
        for (const col of STATE) {
          db.prepare('DELETE FROM records WHERE collection=?').run(col);
          for (const item of data[col]) store.put(col, item);
        }
        if (migrationId) db.prepare("INSERT INTO meta(key,value) VALUES('initial-progress-import',?)").run(migrationId);
        return { imported: true };
      }, dryRun);
    },
    exportProgress: () => ({ app: 'amelie-art-studio', version: 1, exportedAt: new Date().toISOString(), data: { ...Object.fromEntries(STATE.map((col) => [col, store.list(col)])), words: store.list('words').filter((w) => w.custom) } }),
    close: () => db.close(),
  };
  if (!db.prepare("SELECT value FROM meta WHERE key='seeded'").get()) {
    store.importContent(Object.fromEntries(['topics', 'words'].map((col) => [col, JSON.parse(readFileSync(join(ROOT, 'data', col + '.json'), 'utf8'))])));
    db.prepare("INSERT INTO meta(key,value) VALUES('seeded','1')").run();
  }
  return store;
}
