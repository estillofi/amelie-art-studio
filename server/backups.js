import { backup, DatabaseSync } from 'node:sqlite';
import { mkdir, chmod, readFile, writeFile, readdir, rm, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { randomBytes, createHash } from 'node:crypto';
import { CHILDREN } from './family.js';

// A consistent SQLite snapshot for each independent database; completed directories are immutable.
export function automaticBackups(family, { keep = 14, now = () => new Date() } = {}) {
  const root = join(family.dir, 'backups');
  let running = null;
  const state = { enabled: true, lastSuccess: null, error: '' };
  async function run() {
    if (running) return running;
    running = (async () => {
      await mkdir(root, { recursive: true, mode: 0o700 });
      const name = 'auto-' + now().toISOString().slice(0,10);
      const final = join(root,name);
      try { const report = JSON.parse(await readFile(join(final,'manifest.json'),'utf8')); state.lastSuccess = report.createdAt; state.error = ''; return report; }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      const temporary = join(root,'.'+name+'-'+randomBytes(6).toString('hex'));
      await mkdir(join(temporary,'profiles'),{recursive:true,mode:0o700});
      try {
        const files = [{ name:'accounts.sqlite', db:family.db }, ...CHILDREN.map(({id})=>({name:'profiles/'+id+'.sqlite',db:family.store({profile:id}).db}))];
        const manifest={createdAt:now().toISOString(),files:[]};
        for(const file of files){
          const path=join(temporary,file.name);await backup(file.db,path);await chmod(path,0o600);
          const check=new DatabaseSync(path,{readOnly:true});
          try { if(check.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('Проверка резервной копии не прошла'); }finally{check.close();}
          manifest.files.push({name:file.name,sha256:createHash('sha256').update(await readFile(path)).digest('hex')});
        }
        await writeFile(join(temporary,'manifest.json'),JSON.stringify(manifest,null,2),{mode:0o600});
        await rename(temporary,final);
        const previous=(await readdir(root)).filter((n)=>/^auto-\d{4}-\d{2}-\d{2}$/.test(n)).sort();
        for(const old of previous.slice(0,Math.max(0,previous.length-keep)))await rm(join(root,old),{recursive:true});
        state.lastSuccess=manifest.createdAt;state.error='';return manifest;
      }catch(error){await rm(temporary,{recursive:true,force:true});throw error;}
    })().catch((error)=>{state.error=error.message;throw error;}).finally(()=>{running=null;});
    return running;
  }
  return { run, status:()=>({...state,keep,location:'persistent-volume'}) };
}
