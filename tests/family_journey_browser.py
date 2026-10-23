"""Fault injection and real family workflow against an isolated local family, never production."""
from pathlib import Path
import os,tempfile,json
from playwright.sync_api import sync_playwright,expect
path=Path(__file__).with_name('browser_smoke.py');ns={'__file__':str(path)}
exec(compile(path.read_text().split("with tempfile.TemporaryDirectory(prefix='amelie-browser-')")[0],str(path),'exec'),ns)
with tempfile.TemporaryDirectory(prefix='amelie-family-journey-') as directory,sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 env={**os.environ,'PORT':'0','HOST':'127.0.0.1','DATA_DIR':directory,'APP_USER':'test-family','APP_PASSWORD':'local-test-only'}
 with ns['running'](['node','server.js'],env) as base:
  context=browser.new_context(viewport={'width':390,'height':844});page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base,wait_until='networkidle');ns['login'](page)
  def data(expr):return page.evaluate('async()=>{const m=await import("./js/lib.js");return '+expr+';}')
  # First commit succeeds but its HTTP response is lost; the queued request must be retried once.
  lost={'once':False,'release':False}
  def lose_response(route):
   if not lost['once']:
    lost['once']=True;response=route.fetch();assert response.ok;route.abort()
   elif lost['release']:route.continue_()
   else:route.abort()
  page.route('**/api/activity',lose_response)
  data('await m.addStars(1,"journey")');assert data('await m.flushSaves()') is False
  expect(page.locator('#sync-notice')).to_be_visible()
  page.reload(wait_until='networkidle');lost['release']=True;assert data('await m.flushSaves()');assert data('m.profile().stars')==1
  page.unroute('**/api/activity');assert data('m.SYNC.pending')==0
  print('PASS: committed activity + lost response + reload + retry earns exactly one star')
  # A new device can act from its own stale screen without losing the first device's result.
  other=browser.new_context(viewport={'width':320,'height':740});second=other.new_page();second.goto(base,wait_until='networkidle');ns['login'](second)
  data('await m.addStars(1,"first-device");await m.flushSaves()')
  second.evaluate('async()=>{const m=await import("./js/lib.js");await m.addStars(1,"second-device");await m.flushSaves()}')
  page.reload(wait_until='networkidle');assert data('m.profile().stars')==3
  print('PASS: two real browser contexts preserve both independent activities')
  # Invalid adult input must not poison the durable queue or block later child results.
  pending=data('m.SYNC.pending')
  rejected=page.evaluate("""async()=>{const m=await import('./js/lib.js');try{await m.save('words',{id:'bad-word',topic:'animals',en:'<bad>',ru:'тест',order:1});return false}catch{return true}}""")
  assert rejected;assert data('m.SYNC.pending')==pending;assert not data('m.S.words.some(w=>w.id==="bad-word")')
  print('PASS: malformed word is rejected before entering the persistent synchronization queue')
  # Preparations are drafts until the parent deliberately publishes the form.
  ns['parents'](page);page.locator('.parent-tabs a[href="#/parents/homework"]').click();page.locator('.lesson-preparations').first.locator('summary').click()
  page.locator('[data-template="reading-68-tree"]').click();assert data('m.S.assignments.length')==0
  expect(page.locator('#hw-pages')).to_have_value('68');expect(page.locator('#hw-selected')).to_contain_text('tree');expect(page.locator('#hw-picture')).to_have_value('house')
  page.locator('#homework-form button[type="submit"]').click();expect(page.locator('#hw-message')).to_contain_text('Задание сохранено');assert data('await m.flushSaves()')
  assert data('m.S.assignments.length')==1;old_progress=data('structuredClone(m.S.progress)')
  page.locator('#nav a[href="#/school"]').click();expect(page.locator('h1')).to_have_text('Мой учебник');expect(page.locator('.school-assignment')).to_contain_text('68');expect(page.locator('.school-assignment a[href="#/colour/house/free"]')).to_be_visible()
  page.locator('.school-assignment details summary').click();page.locator('[data-say="picture-tree"]').click();assert data('m.S.progress')==old_progress
  # Work from the second browser is picked up after refresh and keeps one schedule per word.
  second.goto(base+'#/school',wait_until='networkidle');second.reload(wait_until='networkidle');expect(second.locator('.school-assignment')).to_have_count(1)
  print('PASS: parent template -> explicit publication -> child school tab -> listen/practice and linked colouring; no schedule reset')
  for width in [320,390,768]:
   page.set_viewport_size({'width':width,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.screenshot(path='/tmp/family-school-journey.png',full_page=True)
  # Twenty-five stickers span sheets; empty future space exists without an unbounded scroll.
  data('await m.saveProfile({stickers:Array.from({length:25},(_,i)=>({s:i<20?"🐱":"sketch:cat",ts:i+1}))});await m.flushSaves()')
  page.evaluate("location.hash='/gallery'");expect(page.locator('.album-heading')).to_contain_text('Лист 2 из 2');expect(page.locator('.stickers .stk')).to_have_count(20);expect(page.locator('.stickers .got')).to_have_count(5)
  page.locator('.album-pages a').click();expect(page.locator('.album-heading')).to_contain_text('Лист 1 из 2');expect(page.locator('.stickers .got')).to_have_count(20)
  print('PASS: automatic 20-slot album sheets, old/new sticker art and mobile layout')
  # Leaving a game cancels its pending next-round transition and any completion reward.
  page.add_init_script("speechSynthesis.speak=(u)=>window.lastSpeech=u.text")
  page.reload(wait_until='networkidle');page.evaluate("location.hash='/listen'");expect(page.locator('.opts')).to_be_visible();page.wait_for_function('window.lastSpeech')
  word=page.evaluate('async()=>{const m=await import("./js/lib.js");return m.S.words.find(w=>w.en===window.lastSpeech).id}')
  before=data('m.profile().stars');page.locator('.opt[data-id="'+word+'"]').evaluate('(b)=>{b.click();b.click();b.click()}');assert data('m.profile().stars')==before+1
  page.evaluate("location.hash='/'");expect(page.locator('h1')).to_have_text('Hello, Amelie!');page.wait_for_timeout(1400);expect(page.locator('h1')).to_have_text('Hello, Amelie!');assert data('m.profile().stars')==before+1
  page.evaluate("window.lastSpeech=null;location.hash='/abc/quiz'");expect(page.locator('.opts')).to_be_visible();page.wait_for_function('window.lastSpeech')
  names=['ay','bee','see','dee','ee','ef','jee','aitch','eye','jay','kay','el','em','en','oh','pee','cue','ar','es','tee','you','vee','double you','ex','why','zed']
  letter=chr(65+names.index(page.evaluate('window.lastSpeech')));before=data('m.profile().stars')
  page.locator('.opt[data-l="'+letter+'"]').evaluate('(b)=>{b.click();b.click();b.click()}');assert data('m.profile().stars')==before+1
  page.evaluate("location.hash='/'");page.wait_for_timeout(1100);expect(page.locator('h1')).to_have_text('Hello, Amelie!');assert data('m.profile().stars')==before+1
  print('PASS: ABC quiz rapid taps award once and its delayed round is cancelled on exit')
  assert data('await m.flushSaves()');assert not errors,errors
  print('PASS: rapid repeated game taps award once; navigation cancels pending rounds and late writes')
  # A long backlog starts a six-card lesson; an early stop keeps every remaining schedule.
  data('await Promise.all(m.S.words.slice(0,15).map(w=>m.save("progress",{id:w.id,box:1,reps:1,due:0})));await m.flushSaves()')
  before_progress=data('structuredClone(m.S.progress)');page.evaluate("location.hash='/learn'");expect(page.locator('.lesson-size')).to_contain_text('6 карточек')
  for _ in range(2):
   if page.locator('#show').count():page.locator('#show').click()
   page.locator('#know' if page.locator('#know').count() else '#next').click()
  page.locator('#lesson-break').click();expect(page.locator('h1')).to_have_text('Hello, Amelie!');assert data('await m.flushSaves()')
  after_progress=data('m.S.progress');before_by_id={v['id']:v for v in before_progress};after_by_id={v['id']:v for v in after_progress}
  assert set(after_by_id)>=set(before_by_id);assert sum(after_by_id[k]!=v for k,v in before_by_id.items())<=2
  print('PASS: six-card session cap and early stop retain the complete outstanding backlog')
  ns['parents'](page);expect(page.locator('#backup-status')).to_contain_text('Автокопия:')
  print('PASS: daily backup status is visible to the parent')
  context.close();other.close()
 browser.close()
