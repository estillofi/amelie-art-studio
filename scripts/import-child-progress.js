import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { openFamily } from '../server/family.js';
import { ROOT } from '../server/store.js';

export async function importChildFile(family, path, { apply = false, profile = 'amelie' } = {}) {
  const source = readFileSync(path);
  if (source.length > 8 * 1024 * 1024) throw new Error('Файл слишком большой');
  const id = createHash('sha256').update(source).digest('hex');
  return family.migrateProgress(profile, JSON.parse(source.toString('utf8')), id, { dryRun: !apply });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [path, ...options] = process.argv.slice(2);
  if (!path || options.some((o) => !['--apply', '--demo', '--sandbox'].includes(o))) throw new Error('node scripts/import-child-progress.js FILE [--apply] [--demo|--sandbox]');
  const family = openFamily({ dir: process.env.DATA_DIR || join(ROOT, '.local'), parentPassword: process.env.APP_PASSWORD });
  try { console.log(JSON.stringify(await importChildFile(family, path, { apply: options.includes('--apply'), profile: options.includes('--demo') ? 'demo' : options.includes('--sandbox') ? 'sandbox' : 'amelie' }))); }
  finally { family.close(); }
}
