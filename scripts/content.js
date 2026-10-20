import { readFile } from 'node:fs/promises';
import { openStore } from '../server/store.js';

const [file, ...flags] = process.argv.slice(2);
if (!file || flags.some((f) => f !== '--dry-run')) {
  console.error('Usage: npm run content -- path/to/pack.json [--dry-run]');
  process.exitCode = 1;
} else {
  const store = openStore();
  try {
    const result = store.importContent(JSON.parse(await readFile(file, 'utf8')), { dryRun: flags.includes('--dry-run') });
    console.log(JSON.stringify({ ...result, dryRun: flags.includes('--dry-run') }));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { store.close(); }
}
