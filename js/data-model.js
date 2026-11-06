import { PICTURE_IDS } from './colouring/pictures.js';
export const COLLECTIONS = ['topics', 'words', 'progress', 'log', 'profile', 'gallery', 'assignments', 'uploads', 'episodes'];
export const STATE = ['progress', 'log', 'profile', 'gallery', 'assignments', 'uploads', 'episodes'];
// A parent's own colouring page: traced line art plus the words for its numbered regions.
export const UPLOAD_ID = /^u-[a-z0-9]{6,40}$/;
export const REGION_WORD = /^[a-z]+(?:[ -][a-z]+)?$/;
export const isUpload = (id) => typeof id === 'string' && UPLOAD_ID.test(id);
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
    requireThat(item.rewardTrack === undefined || (plain(item.rewardTrack) && item.rewardTrack.version === 2 && integer(item.rewardTrack.nextAt, 1, 10000100) && integer(item.rewardTrack.step, 15, 60) && integer(item.rewardTrack.earned, 0, 1000000) && integer(item.rewardTrack.baseCount, 0, 1000000)), 'Некорректное расписание наклеек');
  } else if (col === 'gallery') {
    requireThat((PICTURE_IDS.includes(item.pic) || isUpload(item.pic)) && plain(item.fills), 'Некорректный рисунок');
    requireThat(Object.keys(item.fills).length <= 400 && Object.entries(item.fills).every(([key, value]) => (isUpload(item.pic) ? /^r\d{1,4}$/ : /^[a-z]+$/).test(key) && COLOR.test(value)), 'Некорректная раскраска');
    requireThat(integer(item.ts, 0, Number.MAX_SAFE_INTEGER), 'Некорректное время рисунка');
  } else if (col === 'assignments') {
    requireThat(text(item.book, 120) && text(item.pages, 60) && optionalText(item.task, 1000), 'Укажите учебник и страницы; задание — до 1000 символов');
    requireThat(Array.isArray(item.wordIds) && item.wordIds.length >= 1 && item.wordIds.length <= 50 && item.wordIds.every(validId) && new Set(item.wordIds).size === item.wordIds.length, 'Выберите от 1 до 50 разных слов');
    requireThat(typeof item.active === 'boolean' && integer(item.createdAt, 0, Number.MAX_SAFE_INTEGER), 'Некорректное задание');
    requireThat(item.dueDate === undefined || item.dueDate === '' || (typeof item.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.dueDate) && Number.isFinite(Date.parse(item.dueDate)) && new Date(item.dueDate).toISOString().slice(0, 10) === item.dueDate), 'Некорректная дата задания');
    requireThat(item.picture === undefined || item.picture === '' || PICTURE_IDS.includes(item.picture) || isUpload(item.picture), 'Неизвестная раскраска задания');
  } else if (col === 'episodes') {
    // One record per course episode: how it went, never a grade. traps = the episode's typical difficulty showed up.
    requireThat(/^ep-[a-z0-9]{1,12}$/.test(item.id), 'Некорректный эпизод');
    requireThat(['runs', 'clean', 'helped', 'traps'].every((k) => integer(item[k], 0, 100000)) && item.clean <= item.runs && integer(item.last, 0, Number.MAX_SAFE_INTEGER), 'Некорректные итоги эпизода');
    requireThat(typeof item.lastClean === 'boolean', 'Некорректные итоги эпизода');
  } else if (col === 'uploads') {
    requireThat(isUpload(item.id), 'Некорректный id картинки');
    requireThat(text(item.en, 60) && text(item.ru, 60), 'Дайте картинке название по-английски и по-русски');
    requireThat(typeof item.image === 'string' && item.image.length <= 700000 && /^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(item.image), 'Контур должен быть PNG до 500 КБ');
    requireThat(integer(item.width, 64, 1200) && integer(item.height, 64, 1200), 'Некорректный размер картинки');
    requireThat(Array.isArray(item.regions) && item.regions.length <= 120 && new Set(item.regions.map((r) => r?.n)).size === item.regions.length
      && item.regions.every((r) => plain(r) && integer(r.n, 1, 4000) && typeof r.en === 'string' && r.en.length <= 30 && REGION_WORD.test(r.en) && text(r.ru, 40) && (r.colour === undefined || r.colour === '' || /^[a-z]{2,12}$/.test(r.colour))), 'Подпишите области простыми английскими словами');
    requireThat(typeof item.ai === 'boolean' && (item.archived === undefined || typeof item.archived === 'boolean') && integer(item.createdAt, 0, Number.MAX_SAFE_INTEGER), 'Некорректная картинка');
  }
  return item;
}

export { validId, plain, text, optionalText, integer, requireThat };
