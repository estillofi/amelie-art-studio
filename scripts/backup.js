import { backup, DatabaseSync } from 'node:sqlite';
import { chmod, mkdir, access } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { openStore, ROOT } from '../server/store.js';

const family = process.argv[2] === '--family';
const file = process.argv[family ? 3 : 2];
if (!file || process.argv.length !== (family ? 4 : 3)) {
  console.error('Usage: npm run backup -- [--family] /safe/path/backup');
  process.exitCode = 1;
} else {
  let store;
  try {
    const destination = resolve(file);
    const exists = await access(destination).then(() => true, () => false);
    if (exists) throw new Error('Файл уже существует. Выберите новое имя резервной копии.');
    if (family) {
      const directory = process.env.DATA_DIR || join(ROOT, '.local');
      const files = ['accounts.sqlite', 'profiles/amelie.sqlite', 'profiles/demo.sqlite', 'profiles/sandbox.sqlite'];
      for (const name of files) await access(join(directory, name));
      await mkdir(destination, { recursive: true, mode: 0o700 });
      for (const name of files) {
        const path = join(destination, name);
        await mkdir(dirname(path), { recursive: true, mode: 0o700 });
        const db = new DatabaseSync(join(directory, name), { readOnly: true });
        try { await backup(db, path); await chmod(path, 0o600); } finally { db.close(); }
      }
      console.log('Family SQLite backups created: ' + destination);
    } else {
      await mkdir(dirname(destination), { recursive: true, mode: 0o700 });
      store = openStore();
      await backup(store.db, destination);
      await chmod(destination, 0o600);
      console.log('SQLite backup created: ' + destination);
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { store?.close(); }
}
