import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { openStore, ROOT } from '../server/store.js';

const [file, ...flags] = process.argv.slice(2);
let store;
try {
  let profile=null;let dryRun=false;
  for(let i=0;i<flags.length;i++){
    if(flags[i]==='--dry-run')dryRun=true;
    else if(flags[i]==='--profile' && !profile && ['amelie','demo','sandbox'].includes(flags[i+1]))profile=flags[++i];
    else throw Error('Usage: npm run content -- pack.json [--profile amelie|demo|sandbox] [--dry-run]');
  }
  if(!file)throw Error('Укажите файл набора');
  const dir=process.env.DATA_DIR || join(ROOT,'.local');
  if(existsSync(join(dir,'accounts.sqlite')) && !profile)throw Error('Выберите альбом: --profile amelie|demo|sandbox. Общая старая база не используется семьёй.');
  if(profile && !existsSync(join(dir,'profiles',profile+'.sqlite')))throw Error('Альбом не найден');
  store=openStore(profile ? join(dir,'profiles',profile+'.sqlite') : undefined);
  const result=store.importContent(JSON.parse(await readFile(file,'utf8')),{dryRun});
  console.log(JSON.stringify({...result,profile:profile || 'legacy',dryRun}));
}catch(error){console.error(error.message);process.exitCode=1;}
finally{store?.close();}
