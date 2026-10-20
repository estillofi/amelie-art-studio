import { backup } from 'node:sqlite';
import { chmod, mkdir, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { openStore } from '../server/store.js';

const file = process.argv[2];
if (!file || process.argv.length !== 3) {
  console.error('Usage: npm run backup -- /safe/path/amelie-YYYY-MM-DD.sqlite');
  process.exitCode = 1;
} else {
  let store;
  try {
    const destination = resolve(file);
    const exists = await access(destination).then(() => true, () => false);
    if (exists) throw new Error('Файл уже существует. Выберите новое имя резервной копии.');
    await mkdir(dirname(destination), { recursive: true, mode: 0o700 });
    store = openStore();
    await backup(store.db, destination);
    await chmod(destination, 0o600);
    console.log('SQLite backup created: ' + destination);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { store?.close(); }
}
