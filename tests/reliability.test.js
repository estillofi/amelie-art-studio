import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,readdirSync,cpSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync,spawn} from 'node:child_process';
import {once} from 'node:events';
import {existsSync,statSync} from 'node:fs';
import {openStore} from '../server/store.js';
import {openFamily} from '../server/family.js';
import {automaticBackups} from '../server/backups.js';
import {awardStars,nextReward,completeStep,STICKERS} from '../js/rewards.js';
import {createApp} from '../server.js';
const ts=Date.UTC(2026,9,23,10);const day='2026-10-23';const dayStart=Date.UTC(2026,9,23);
const star=(id,amount=1)=>({id,kind:'stars',amount,where:'test',ts});
const step=(id,name)=>({id,kind:'step',step:name,day,ts});
const review=(id,know=true,extra={})=>({id,kind:'review',word:'animals-cat',know,day,dayStart,ts,...extra});

test('legacy achievements keep the next promise; star thresholds grow gently and daily trophies are independent',()=>{
 const original=Array.from({length:20},(_,i)=>({s:'🐱',ts:i}));original.push({s:'🏆',bonus:true,ts:30});
 const p={id:'amelie',stars:305,stickers:original,days:{}};assert.equal(nextReward(p).remaining,10);
 let result=awardStars(p,10,star('first',10));assert.deepEqual(result.profile.stickers.slice(0,21),original);assert.equal(result.awarded[0].s,'sketch:cat');assert.equal(nextReward(result.profile).remaining,18);
 result=completeStep(result.profile,step('words','words'));result=completeStep(result.profile,step('play','play'));result=completeStep(result.profile,step('art','art'));
 assert.equal(result.awarded.length,1);const withTrophy=result.profile;assert.equal(nextReward(withTrophy).remaining,18);assert.equal(completeStep(withTrophy,step('again','art')).awarded.length,0);
 result=awardStars(withTrophy,18,star('second',18));assert.equal(nextReward(result.profile).remaining,22);
 let growing={stars:0,stickers:[],days:{}};const gaps=[];let last=0;
 for(let i=1;i<=1100;i++){const r=awardStars(growing,1,star('many-'+i));growing=r.profile;if(r.awarded.length){gaps.push(i-last);last=i;}}
 assert.deepEqual(gaps.slice(0,10),[15,18,22,27,33,40,48,58,60,60]);assert.ok(gaps.every((gap)=>gap<=60));assert.equal(p.stars,305);assert.equal(p.stickers.length,21);
 const positions=JSON.parse(readFileSync(new URL('../js/art.js',import.meta.url),'utf8').split('const POSITIONS = ')[1].split(';')[0]);
 for(const s of STICKERS.filter(s=>s.startsWith('sketch:')))assert.ok(positions[s.slice(7)],s);
});

test('activity receipts survive lost replies, duplicate retries, reconnects and stale absolute profile updates',()=>{
 const dir=mkdtempSync(join(tmpdir(),'amelie-receipt-'));let store;
 try{const path=join(dir,'a.sqlite');store=openStore(path);store.put('profile',{id:'amelie',stars:14});
 const event=star('lost-reply');store.activity(event);store.close();store=openStore(path);
 for(let i=0;i<5;i++)assert.equal(store.activity(event).duplicate,true);
 assert.equal(store.get('profile','amelie').stars,15);assert.equal(store.get('profile','amelie').stickers.length,1);
 const before=store.exportProgress().data;assert.throws(()=>store.activity({...event,amount:5}));assert.deepEqual(store.exportProgress().data,before);
 store.put('profile',{id:'amelie',stars:2,stickers:[],rate:.7});assert.equal(store.get('profile','amelie').stars,15);assert.equal(store.get('profile','amelie').stickers.length,1);assert.equal(store.get('profile','amelie').rate,.7);
 assert.throws(()=>store.put('profile',{id:'amelie',stars:-1}));assert.throws(()=>store.activity(star('negative',-1)));assert.equal(store.db.prepare('SELECT count(*) AS n FROM activity_events').get().n,1);
 assert.throws(()=>store.put('profile',{id:'amelie',stickers:[null]}),/наклейки/);assert.throws(()=>store.put('profile',{id:'amelie',days:{invalid:{words:1}}}));assert.equal(store.get('profile','amelie').stars,15);
 }finally{store?.close();rmSync(dir,{recursive:true,force:true});}
});

test('reviews write schedule, answer history and stars atomically; an error returns to a one-day interval',()=>{
 const store=openStore(':memory:');
 try{store.activity(review('first'));assert.equal(store.get('profile','amelie').stars,1);assert.equal(store.get('progress','animals-cat').reps,1);assert.equal(store.get('log','first').wasNew,true);
 const before=store.exportProgress().data;assert.throws(()=>store.activity(review('bad',true,{assignment:'missing'})));assert.deepEqual(store.exportProgress().data,before);
 store.activity(review('miss',false));assert.equal(store.get('progress','animals-cat').box,0);assert.equal(store.get('progress','animals-cat').due,0);store.activity(review('miss',false));
 store.activity(review('retry'));assert.equal(store.get('progress','animals-cat').reps,3);assert.equal(store.get('progress','animals-cat').box,1);assert.equal(store.get('progress','animals-cat').due,dayStart+86400000);assert.equal(store.get('profile','amelie').stars,2);assert.equal(store.list('log').length,3);
 assert.throws(()=>store.activity({...step('invalid-date','words'),day:'2026-13-01'}));
 }finally{store.close();}
});

test('same-day reviews cannot advance several learning levels; delayed offline answers retain a newer interval',()=>{
 const store=openStore(':memory:');
 try{
  store.activity(review('device-one'));store.activity(review('device-two'));assert.equal(store.get('progress','animals-cat').box,1);assert.equal(store.get('progress','animals-cat').reps,2);
  store.activity(review('next-day',true,{day:'2026-10-24',dayStart:dayStart+86400000,ts:ts+86400000}));const newer=store.get('progress','animals-cat');assert.equal(newer.box,2);
  store.activity(review('delayed-offline-miss',false));const after=store.get('progress','animals-cat');assert.equal(after.box,newer.box);assert.equal(after.due,newer.due);assert.equal(after.last,newer.last);assert.equal(after.reps,4);assert.equal(store.list('log').length,4);
 }finally{store.close();}
});

test('a receipt remains safe after an explicit legacy restore removed its old assignment and results',()=>{
 const store=openStore(':memory:');
 try {
  store.put('assignments',{id:'previous-task',book:'Book',pages:'1',wordIds:['animals-cat'],active:true,createdAt:ts});
  const event=review('ack-lost-before-restore',true,{assignment:'previous-task'});store.activity(event);
  store.importProgress({app:'amelie-art-studio',version:1,data:{profile:[],progress:[],log:[],gallery:[],assignments:[],words:[]}});
  const replay=store.activity(event);assert.equal(replay.duplicate,true);assert.equal(replay.profile.stars,0);assert.equal(replay.progress,null);assert.equal(replay.log,null);assert.equal(store.list('profile').length,0);
 } finally {store.close();}
});

test('two HTTP devices retain every activity, and repeated completion earns only one daily trophy',async(t)=>{
 const dir=mkdtempSync(join(tmpdir(),'amelie-concurrent-'));const family=openFamily({dir,parentPassword:'two-device-test-password'});const legacy=openStore(':memory:');const app=createApp({store:legacy,family});
 await new Promise(r=>app.listen(0,'127.0.0.1',r));t.after(async()=>{await new Promise(r=>app.close(r));family.close();legacy.close();rmSync(dir,{recursive:true,force:true});});
 const base=`http://127.0.0.1:${app.address().port}/api/`;
 const login=async()=>{const r=await fetch(base+'auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({login:'parent',password:'two-device-test-password'})});return r.headers.get('set-cookie').split(';')[0];};
 const [a,b]=await Promise.all([login(),login()]);
 const post=(cookie,event)=>fetch(base+'activity',{method:'POST',headers:{Cookie:cookie,'X-Amelie-Scope':'parent:amelie','Content-Type':'application/json'},body:JSON.stringify(event)});
 const events=[...Array.from({length:40},(_,i)=>star('device-'+i)),...['words','play','art','art'].map((name,i)=>step('step-'+i,name))];
 const results=await Promise.all(events.map((e,i)=>post(i%2?a:b,e)));assert.ok(results.every(r=>r.status===200));
 const store=family.store({profile:'amelie'});assert.equal(store.get('profile','amelie').stars,40);assert.equal(store.get('profile','amelie').stickers.filter(s=>s.bonus).length,1);
 for(const e of events)assert.equal((await post(a,e)).status,200);assert.equal(store.get('profile','amelie').stars,40);assert.equal(store.db.prepare('SELECT count(*) AS n FROM activity_events').get().n,44);
});

test('new content, changed definitions and homework preserve learning; a complete export restores a new custom topic',()=>{
 const store=openStore(':memory:');const restored=openStore(':memory:');
 try{store.activity(review('learn-cat'));const before=store.get('progress','animals-cat');const personal=store.get('profile','amelie');
 const topic={id:'forest',en:'Forest',ru:'Лес',icon:'🌲',color:'#3BB273',order:20};const word={id:'forest-owl',topic:'forest',en:'owl',ru:'сова',order:0,pic:'sketch:owl'};
 store.importContent({topics:[topic],words:[word,{...store.get('words','animals-cat'),ex:'A little cat.'}]});assert.deepEqual(store.get('progress','animals-cat'),before);assert.deepEqual(store.get('profile','amelie'),personal);
 store.put('assignments',{id:'forest-page',book:'Workbook',pages:'3',task:'Listen',wordIds:['forest-owl','animals-cat'],active:true,createdAt:ts,picture:'house'});
 const file=store.exportProgress();assert.ok(file.data.topics.some(t=>t.id==='forest'));assert.ok(file.data.words.some(w=>w.id==='forest-owl'));restored.importProgress(JSON.parse(JSON.stringify(file)));assert.deepEqual(restored.exportProgress().data,file.data);
 assert.equal(restored.activity(review('learn-cat')).duplicate,true);assert.deepEqual(restored.exportProgress().data,file.data);
 const invalid=structuredClone(file);invalid.data.words.find(w=>w.id==='forest-owl').topic='missing';assert.throws(()=>restored.importProgress(invalid));assert.deepEqual(restored.exportProgress().data,file.data);
 }finally{store.close();restored.close();}
});

test('daily snapshots pass SQLite checks, restore credentials/content/results, and retain only their own completed copies',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'amelie-daily-'));let family=openFamily({dir,parentPassword:'backup-test-password'});let restored;
 try{const store=family.store({profile:'amelie'});store.activity(review('backup-review'));const unchanged=store.exportProgress().data;
 let date=new Date('2026-10-23T10:00:00Z');const auto=automaticBackups(family,{keep:2,now:()=>date});const first=await auto.run();assert.equal(first.files.length,4);await auto.run();assert.equal(readdirSync(join(dir,'backups')).length,1);assert.deepEqual(store.exportProgress().data,unchanged);
 const target=join(dir,'restored');cpSync(join(dir,'backups','auto-2026-10-23'),target,{recursive:true});restored=openFamily({dir:target,parentPassword:'ignored-original-credential'});assert.ok(restored.login('parent','backup-test-password').token);assert.deepEqual(restored.store({profile:'amelie'}).exportProgress().data,unchanged);
 date=new Date('2026-10-24T10:00:00Z');await auto.run();date=new Date('2026-10-25T10:00:00Z');await auto.run();assert.deepEqual(readdirSync(join(dir,'backups')).sort(),['auto-2026-10-24','auto-2026-10-25']);
 }finally{restored?.close();family.close();rmSync(dir,{recursive:true,force:true});}
});

test('content CLI requires the actual child profile instead of silently updating the unused legacy database',()=>{
 const dir=mkdtempSync(join(tmpdir(),'amelie-content-cli-'));const family=openFamily({dir,parentPassword:'content-cli-test-password'});
 try{assert.throws(()=>execFileSync(process.execPath,['scripts/content.js','docs/content-example.json'],{cwd:new URL('../',import.meta.url),env:{...process.env,DATA_DIR:dir},stdio:'pipe'}),/Command failed/);
 const result=JSON.parse(execFileSync(process.execPath,['scripts/content.js','docs/content-example.json','--profile','demo','--dry-run'],{cwd:new URL('../',import.meta.url),env:{...process.env,DATA_DIR:dir},encoding:'utf8'}));assert.equal(result.profile,'demo');assert.equal(result.dryRun,true);assert.equal(family.store({profile:'demo'}).list('words').length,110);
 }finally{family.close();rmSync(dir,{recursive:true,force:true});}
});


test('a real server recovers WAL data and login after SIGKILL and never re-applies the committed activity',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'amelie-hard-restart-'));let child;
 async function start(){
  child=spawn(process.execPath,['server.js'],{cwd:new URL('../',import.meta.url),env:{...process.env,DATA_DIR:dir,HOST:'127.0.0.1',PORT:'0',APP_USER:'restart-test',APP_PASSWORD:'restart-test-password'},stdio:['ignore','pipe','pipe']});
  return new Promise((resolve,reject)=>{let output='';let errors='';child.stderr.on('data',(chunk)=>{errors+=chunk;});const timer=setTimeout(()=>reject(Error('Server did not start: '+output.slice(0,300)+' '+errors.slice(0,1000))),10000);child.stdout.on('data',(chunk)=>{output+=chunk;const m=output.match(/127\.0\.0\.1:(\d+)/);if(m){clearTimeout(timer);resolve('http://127.0.0.1:'+m[1]+'/api/');}});child.once('exit',()=>{clearTimeout(timer);reject(Error('Server stopped before startup'));});child.once('error',(e)=>{clearTimeout(timer);reject(e);});});
 }
 try{
  let base=await start();const login=await fetch(base+'auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({login:'parent',password:'restart-test-password'})});const cookie=login.headers.get('set-cookie').split(';')[0];
  const request=(path,value)=>fetch(base+path,{method:value===undefined?'GET':'POST',headers:{Cookie:cookie,'X-Amelie-Scope':'parent:amelie','Content-Type':'application/json'},...(value===undefined?{}:{body:JSON.stringify(value)})});
  assert.equal((await request('activity',review('hard-restart'))).status,200);
  assert.equal((await request('content/import',{topics:[{id:'restart-topic',en:'Garden',ru:'Сад',icon:'🌲',color:'#3BB273',order:30}],words:[{id:'restart-topic-leaf',topic:'restart-topic',en:'leaf',ru:'лист',order:0,pic:'sketch:tree'}]})).status,200);
  const before=(await (await request('progress/export')).json()).data;const wal=join(dir,'profiles','amelie.sqlite-wal');assert.ok(existsSync(wal)&&statSync(wal).size>0);
  const exited=once(child,'exit');child.kill('SIGKILL');await exited;base=await start();
  const response=await request('progress/export');assert.equal(response.status,200);assert.deepEqual((await response.json()).data,before);
  assert.equal((await (await request('activity',review('hard-restart'))).json()).duplicate,true);assert.deepEqual((await (await request('progress/export')).json()).data,before);
 }finally{if(child && child.exitCode===null && child.signalCode===null){const exited=once(child,'exit');child.kill('SIGTERM');await exited;}rmSync(dir,{recursive:true,force:true});}
});
