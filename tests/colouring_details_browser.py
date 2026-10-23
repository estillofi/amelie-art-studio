"""Focused browser regression: detailed fills, duplicate protection and mixed-version gallery."""
from pathlib import Path
import os,tempfile
from playwright.sync_api import sync_playwright,expect
path=Path(__file__).with_name('browser_smoke.py');ns={'__file__':str(path)}
exec(compile(path.read_text().split("with tempfile.TemporaryDirectory(prefix='amelie-browser-')")[0],str(path),'exec'),ns)
with tempfile.TemporaryDirectory(prefix='amelie-detail-test-') as directory,sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 env={**os.environ,'PORT':'0','HOST':'127.0.0.1','DATA_DIR':directory,'APP_USER':'test-family','APP_PASSWORD':'local-test-only'}
 with ns['running'](['node','server.js'],env) as base:
  page=browser.new_page(viewport={'width':1000,'height':1100});page.goto(base,wait_until='networkidle');ns['login'](page)
  def data(expr):return page.evaluate('async()=>{const m=await import("./js/lib.js");return '+expr+';}')
  def scene():
   page.evaluate("location.hash='/colour/cat-dojo/free'");expect(page.locator('#cv')).to_be_visible();expect(page.locator('#save')).to_be_disabled()
  def fill(colour):
   page.locator('[data-c="green"]').click();page.locator('#cv .rg[data-w="cat"]').focus();page.locator('#cv .rg[data-w="cat"]').press('Enter')
   # Pick one of the large closed face/body details and use a real pointer, not a dispatched event.
   target=page.locator('#cv .rg[data-w="cat"] [data-part]').first
   part=target.get_attribute('data-part');page.locator('[data-c="'+colour+'"]').click();page.locator('#cv').scroll_into_view_if_needed()
   point=target.evaluate('''shape=>{const b=shape.getBBox();for(let y=.1;y<1;y+=.1)for(let x=.1;x<1;x+=.1){const p=new DOMPoint(b.x+b.width*x,b.y+b.height*y);if(!shape.isPointInFill(p))continue;const q=p.matrixTransform(shape.getScreenCTM());if(document.elementFromPoint(q.x,q.y)===shape)return {x:q.x,y:q.y};}throw Error('No fill target');}''')
   page.mouse.click(point['x'],point['y']);expect(target).to_have_attribute('fill', '#3A86FF' if colour=='blue' else '#FF4D4F')
   expect(page.locator('#cv .rg[data-w="cat"]')).to_have_attribute('fill','#3BB273')
   return part
  scene();part=fill('blue');before=data('m.profile().stars')
  page.locator('#save').evaluate('(b)=>{b.click();b.click();b.click()}');expect(page.locator('#save')).to_be_disabled()
  assert data('m.S.gallery.length')==1;assert data('m.profile().stars')==before+2;assert data('await m.flushSaves()')
  page.evaluate("location.hash='/paint'");expect(page.locator('.colouring-tile')).to_have_count(9);scene();fill('blue')
  expect(page.locator('#save')).to_be_disabled();expect(page.locator('#save')).to_contain_text('Уже в галерее')
  fill('red');expect(page.locator('#save')).to_be_enabled();page.locator('#save').click();assert data('m.S.gallery.length')==2;assert data('m.profile().stars')==before+4;assert data('await m.flushSaves()')
  page.locator('#reset').click();expect(page.locator('#save')).to_be_disabled()
  for i in [1,2]:
   response=page.request.post(base+'api/db/gallery',headers={'X-Amelie-Scope':'parent:amelie'},data={'id':'old-copy-'+str(i),'pic':'house','fills':{'sun':'#FFD23F'},'ts':i});assert response.ok
  page.goto(base+'#/gallery',wait_until='networkidle');page.reload(wait_until='networkidle');expect(page.locator('.gallery-picture')).to_have_count(3);expect(page.locator('.gallery-note')).to_contain_text('4 сохранений')
  expect(page.locator('.saved-copies summary')).to_have_text('Сохранений: 2')
  expect(page.locator('svg.legacy-colouring')).to_have_count(1);expect(page.locator('svg.illustrated-colouring')).to_have_count(2)
  expect(page.locator(f'.gallery-picture [data-part="{part}"][fill="#3A86FF"]')).to_have_count(1);expect(page.locator(f'.gallery-picture [data-part="{part}"][fill="#FF4D4F"]')).to_have_count(1)
  assert page.locator('svg.illustrated-colouring [data-part]').first.evaluate('(p)=>getComputedStyle(p).stroke')=='none'
  page.screenshot(path='/tmp/ink-mixed-gallery.png',full_page=True)
  print('PASS: independent detail colours persist; empty/repeated/triple saves award no extra stars; changed variants save; old/new artwork coexist; grouping preserves all records')
 browser.close()
