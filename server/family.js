import { pictureForProfile } from '../js/colouring/pictures.js';
import { DatabaseSync, backup } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { openStore, ValidationError } from './store.js';

export const CHILDREN = [{ id: 'amelie', name: 'Амели' }, { id: 'demo', name: 'Демо' }, { id: 'sandbox', name: 'Песочница' }];
const hash = (s) => createHash('sha256').update(s).digest('hex');
const encode = (password) => { const salt = randomBytes(16).toString('hex'); return salt + ':' + scryptSync(password, salt, 32).toString('hex'); };
const matches = (password, encoded) => { const [salt, key] = encoded.split(':'); return timingSafeEqual(scryptSync(password, salt, 32), Buffer.from(key, 'hex')); };
const deny = (message, status = 403) => { throw Object.assign(new Error(message), { status }); };

// Credentials and session token hashes live on the persistent disk, outside public resources.
export function openFamily({ dir, parentPassword }) {
  if (typeof parentPassword !== 'string' || parentPassword.length < 8) throw new Error('APP_PASSWORD должен содержать не менее 8 символов');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const authPath = join(dir, 'accounts.sqlite');
  const db = new DatabaseSync(authPath);
  chmodSync(authPath, 0o600);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, password TEXT NOT NULL, issued INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, account TEXT NOT NULL, profile TEXT NOT NULL, expires INTEGER NOT NULL);`);
  const insert = db.prepare('INSERT OR IGNORE INTO accounts(id,password,issued) VALUES(?,?,?)');
  if (!db.prepare('SELECT id FROM accounts WHERE id=?').get('parent')) insert.run('parent', encode(parentPassword), 1);
  for (const child of CHILDREN) if (!db.prepare('SELECT id FROM accounts WHERE id=?').get(child.id)) insert.run(child.id, encode(randomBytes(32).toString('hex')), 0);
  const dummy = encode(randomBytes(32).toString('hex'));
  const stores = new Map(CHILDREN.map(({ id }) => [id, openStore(join(dir, 'profiles', id + '.sqlite'))]));
  const attempts = new Map();
  const describe = (session) => ({ account: session.account, role: session.account === 'parent' ? 'parent' : 'child', profile: session.profile, name: CHILDREN.find((c) => c.id === session.profile).name, scope: session.account + ':' + session.profile, profiles: session.account === 'parent' ? CHILDREN : undefined });
  const family = {
    db, dir,
    login(username, password, address = 'local') {
      const now = Date.now();
      for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
      const attempt = attempts.get(address) || { count: 0, until: now + 15 * 60000 };
      if (attempt.count >= 20) deny('Слишком много попыток. Попробуйте через 15 минут.', 429);
      if (typeof username !== 'string' || typeof password !== 'string' || password.length > 200 || username.length > 100) deny('Проверьте логин и пароль', 401);
      const account = db.prepare('SELECT * FROM accounts WHERE id=?').get(username.trim().toLowerCase());
      const valid = matches(password, account?.password || dummy);
      if (!valid || !account?.issued) { attempt.count++; attempts.set(address, attempt); deny('Проверьте логин и пароль', 401); }
      attempts.delete(address);
      db.prepare('DELETE FROM sessions WHERE expires<?').run(now);
      const token = randomBytes(32).toString('base64url');
      const profile = account.id === 'parent' ? 'amelie' : account.id;
      const maxAge = account.id === 'parent' ? 12 * 3600 : 30 * 86400;
      db.prepare('INSERT INTO sessions(token,account,profile,expires) VALUES(?,?,?,?)').run(hash(token), account.id, profile, now + maxAge * 1000);
      return { token, maxAge };
    },
    session(cookie = '') {
      const token = cookie.split(';').map((s) => s.trim()).find((s) => s.startsWith('amelie_session='))?.slice(15);
      if (!token || !/^[\w-]{43}$/.test(token)) return null;
      return db.prepare('SELECT * FROM sessions WHERE token=? AND expires>?').get(hash(token), Date.now()) || null;
    },
    describe,
    store: (session) => stores.get(session.profile),
    requireParent(session) { if (session.account !== 'parent') deny('Нужен вход родителя'); },
    checkPicture(session, picture) { if (!pictureForProfile(picture, session.profile)) deny('Этот рисунок недоступен в выбранном альбоме'); },
    checkScope(session, scope) { if (scope !== describe(session).scope) deny('Выбран другой профиль. Обновите страницу перед сохранением.', 409); },
    select(session, profile) {
      family.requireParent(session);
      if (!stores.has(profile)) throw new ValidationError('Профиль не найден');
      db.prepare('UPDATE sessions SET profile=? WHERE token=?').run(profile, session.token);
    },
    logout(session) { db.prepare('DELETE FROM sessions WHERE token=?').run(session.token); },
    access(session) {
      family.requireParent(session);
      return CHILDREN.map((child) => ({ ...child, login: child.id, ready: Boolean(db.prepare('SELECT issued FROM accounts WHERE id=?').get(child.id).issued) }));
    },
    resetPassword(session, accountId) {
      family.requireParent(session);
      if (!CHILDREN.some((c) => c.id === accountId)) throw new ValidationError('Выберите детский аккаунт');
      const password = randomBytes(9).toString('base64url');
      db.prepare('UPDATE accounts SET password=?,issued=1 WHERE id=?').run(encode(password), accountId);
      db.prepare('DELETE FROM sessions WHERE account=?').run(accountId);
      return { login: accountId, password };
    },
    async backup(session, label = 'before-import') {
      const directory = join(dir, 'backups');
      mkdirSync(directory, { recursive: true, mode: 0o700 });
      const name = `${session.profile}-${label}-${Date.now()}-${randomBytes(3).toString('hex')}.sqlite`;
      const path = join(directory, name);
      await backup(family.store(session).db, path);
      chmodSync(path, 0o600);
      return name;
    },
    async importProgress(session, data, { dryRun = false } = {}) {
      family.requireParent(session);
      const store = family.store(session);
      store.importProgress(data, { dryRun: true });
      for (const drawing of data.data.gallery) family.checkPicture(session, drawing.pic);
      const normalized = { ...data.data, assignments: data.data.assignments || [] };
      const summary = { stars: normalized.profile[0]?.stars || 0, stickers: normalized.profile[0]?.stickers?.length || 0, drawings: normalized.gallery.length, cards: normalized.progress.length };
      if (dryRun) return { dryRun: true, profile: session.profile, summary };
      const backupName = await family.backup(session);
      store.importProgress(data);
      return { imported: true, profile: session.profile, summary, backup: backupName };
    },
    async migrateProgress(profile, data, migrationId, { dryRun = false } = {}) {
      if (!stores.has(profile)) throw new ValidationError('Профиль не найден');
      const session = { account: 'parent', profile };
      const store = family.store(session);
      const check = store.importProgress(data, { dryRun: true, migrationId });
      for (const drawing of data.data.gallery) family.checkPicture(session, drawing.pic);
      if (check.alreadyImported) return check;
      if (dryRun) return { dryRun: true, profile };
      const backupName = await family.backup(session, 'before-migration');
      return { ...store.importProgress(data, { migrationId }), profile, backup: backupName };
    },
    close() { for (const store of stores.values()) store.close(); db.close(); },
  };
  return family;
}
