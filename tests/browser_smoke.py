"""Functional checks against real static and SQLite servers. Requires Python Playwright + Chromium."""
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
from contextlib import contextmanager
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]

@contextmanager
def running(command, env=None):
    proc = subprocess.Popen(command, cwd=ROOT, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
        line = proc.stdout.readline()
        assert line, proc.stderr.read() if proc.poll() is not None else 'No startup output'
        match = re.search(r'127\.0\.0\.1:(\d+)|port (\d+)', line)
        assert match, line
        yield 'http://127.0.0.1:' + next(g for g in match.groups() if g) + '/'
    finally:
        proc.terminate()
        proc.wait(timeout=10)


def login(page, username='parent', password='local-test-only'):
    expect(page.locator('#login-form')).to_be_visible()
    page.locator('#login-name').fill(username)
    page.locator('#login-password').fill(password)
    page.locator('#login-form button').click()
    expect(page.locator('#stars')).to_be_visible()


def parents(page):
    page.evaluate("location.hash='/parents'")
    page.wait_for_function("document.querySelector('#ans') || document.querySelector('#npd')")
    if page.locator('#ans').count():
        a, b = map(int, re.search(r'(\d+) × (\d+)', page.locator('#view').inner_text()).groups())
        page.locator('#ans').fill(str(a*b))
        page.locator('#go').click()
    expect(page.locator('#npd')).to_be_visible()


def homework(page, server):
    def data(expr):
        return page.evaluate("async () => {const m=await import('./js/lib.js'); return " + expr + ';}')
    baseline = data('m.exportProgress()')
    before = data('structuredClone(m.S.progress)')
    parents(page)
    page.locator('#npd').select_option('10')
    page.locator('.parent-tabs a[href="#/parents/homework"]').click()
    expect(page.locator('#homework-form')).to_be_visible()
    page.locator('#hw-pages').fill('66–68')
    page.locator('#hw-task').fill('Повторить red и blue, послушать слова')
    for word in ['colours-red', 'colours-blue']:
        page.locator(f'#homework-form input[value="{word}"]').check()
    page.locator('#homework-form button[type="submit"]').click()
    expect(page.locator('#hw-message')).to_contain_text('Задание сохранено')
    if server:
        assert data('await m.flushSaves()'), data('m.SYNC')
    assignment = data('m.S.assignments[0]')
    assert data('m.S.progress') == before
    queue = page.evaluate("async () => (await import('./js/srs.js')).todayQueue().map(x=>x.w.id)")
    assert queue[:2] == ['colours-red', 'colours-blue'], queue
    page.evaluate("location.hash='/'")
    expect(page.locator('.school-section')).to_contain_text('66–68')
    page.locator('.homework-start').click()
    expect(page.locator('.lesson-source')).to_contain_text('66–68')
    page.locator('#next').click()
    page.locator('#next').click()
    expect(page.locator('#view .word-ru')).to_contain_text('Ты повторила 2')
    assert data('m.S.progress.filter(x=>x.id.startsWith("colours-")).every(x=>x.box===1 && x.due>Date.now())')
    ids = page.evaluate("async () => (await import('./js/srs.js')).todayQueue().map(x=>x.w.id)")
    assert 'colours-red' not in ids and 'colours-blue' not in ids
    original_now = page.evaluate('Date.now()')
    next_day = data('m.S.progress.find(x=>x.id==="colours-red").due') + 3600000
    page.clock.set_fixed_time(next_day / 1000)
    assert page.evaluate("async () => (await import('./js/srs.js')).assignmentQueue((await import('./js/lib.js')).S.assignments[0]).length") == 2
    page.evaluate("async () => {const srs=await import('./js/srs.js'); srs.grade('colours-red',false); srs.grade('colours-red',true);}")
    assert data('m.S.progress.find(x=>x.id==="colours-red").box') == 1
    assert page.evaluate("async () => {const m=await import('./js/lib.js'); return m.S.progress.find(x=>x.id==='colours-red').due===m.startOfDay()+m.DAY;}")
    page.clock.set_fixed_time(original_now / 1000)
    parents(page)
    page.locator('.parent-tabs a[href="#/parents/homework"]').click()
    page.locator(f'[data-edit="{assignment["id"]}"]').click()
    page.locator('#hw-pages').fill('70')
    page.locator('#homework-form button[type="submit"]').click()
    assert data('m.S.assignments[0].pages') == '70'
    after = data('structuredClone(m.S.progress)')
    backup = data('m.exportProgress()')
    if server:
        assert data('await m.flushSaves()'), data('m.SYNC')
    with page.expect_navigation(wait_until='networkidle'):
        page.locator('#imp').set_input_files({'name':'with-homework.json','mimeType':'application/json','buffer':json.dumps(backup).encode()})
    expect(page.locator('#hw-pages' if server else '#ans')).to_be_visible()
    parents(page)
    assert data('m.S.assignments[0].pages') == '70'
    assert data('m.S.progress') == after
    page.locator('.parent-tabs a[href="#/parents/homework"]').click()
    page.locator(f'[data-toggle="{assignment["id"]}"]').click()
    assert data('m.S.assignments[0].active') is False
    page.evaluate("location.hash='/'")
    expect(page.locator('.school-section .homework-card')).to_have_count(0)
    expect(page.locator('.school-manage')).to_be_visible()
    assert data('m.S.progress') == after
    page.evaluate('(backup) => import("./js/lib.js").then(m=>m.importProgress(backup))',baseline)
    page.reload(wait_until='networkidle')
    print('PASS:', 'server' if server else 'static', 'textbook assignment creation, priority, next-day scheduling, editing, backup and completion')


def exercise(browser, base, server=False):
    context = browser.new_context(viewport={'width': 390, 'height': 844}, http_credentials={'username': 'test-family', 'password': 'local-test-only'})
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda err: errors.append(str(err)))
    page.goto(base, wait_until='networkidle')
    if server:
        login(page)
    expect(page.locator('h1')).to_have_text('Hello, Amelie!')
    assert page.locator('.welcome-art').evaluate('(img) => img.complete && img.naturalWidth>0')
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    if server:
        page.screenshot(path='/tmp/amelie-home-mobile.png', full_page=True)
        page.set_viewport_size({'width': 1280, 'height': 900})
        page.screenshot(path='/tmp/amelie-home-desktop.png', full_page=True)
        page.set_viewport_size({'width': 390, 'height': 844})
    module = "await import('./js/lib.js')"
    def data(expr):
        return page.evaluate('async () => { const m = ' + module + '; return ' + expr + '; }')
    assert data('m.MODE') == ('server' if server else 'static')
    assert data('m.S.words.length') == 110
    def route(path, selector):
        page.evaluate('(path) => location.hash=path', path)
        expect(page.locator(selector)).to_be_visible()
    # The textbook remains discoverable before there are any assignments.
    expect(page.locator('.school-manage')).to_be_visible()
    page.locator('.school-manage').click()
    if not server:
        expect(page.locator('#ans')).to_be_visible()
        a, b = map(int, re.search(r'(\d+) × (\d+)', page.locator('#view').inner_text()).groups())
        page.locator('#ans').fill(str(a*b))
        page.locator('#go').click()
    expect(page.locator('#hw-pages')).to_be_visible()
    expect(page.locator('#parent-overview')).to_be_hidden()
    if server:
        page.screenshot(path='/tmp/amelie-textbook-mobile.png', full_page=True)
    page.set_viewport_size({'width': 320, 'height': 740})
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.evaluate("location.hash='/'")
    expect(page.locator('h1')).to_be_visible()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.set_viewport_size({'width': 390, 'height': 844})
    route('/words', '#view .grid2')
    assert page.locator('#view a[href^="#/topic/"]').count() == 12
    # Audit the entire illustration replacement, including color/number cards and small screens.
    topics = data('m.S.topics.map(t=>({id:t.id,count:m.S.words.filter(w=>w.topic===t.id).length}))')
    for topic in topics:
        route('/topic/'+topic['id'], '#view .wgrid')
        assert page.locator('.w').count() == topic['count']
        assert page.locator('.w .emo').count() == 0
        assert page.locator('.w > [role="img"]').count() == topic['count']
        for width in [320, 390]:
            page.set_viewport_size({'width':width,'height':844})
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), topic['id']
        assert page.evaluate(r"""() => {
            const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
            while(walker.nextNode()){
                const node=walker.currentNode;
                if(node.parentElement.closest('script,style,textarea,option'))continue;
                if(/\p{Extended_Pictographic}/u.test(node.textContent))return false;
            }
            return true;
        }"""), topic['id']
    # Old saved emoji stickers must render as drawings, without changing profile records.
    unchanged = data('JSON.stringify(m.S.profile)')
    page.evaluate("async () => {const m=await import('./js/lib.js');m.celebrate('Новая наклейка! ⭐','🦄');}")
    expect(page.locator('.cel-emo .sketch-ink')).to_be_visible()
    assert data('JSON.stringify(m.S.profile)') == unchanged
    page.locator('.celebrate').click()
    print('PASS: drawings cover all 110 words, legacy reward renders, no platform emoji; all topics fit 320/390px')
    route('/topic/animals', '#view .wgrid')
    assert page.locator('.w .sketch-art').count() == 11
    if server:
        page.screenshot(path='/tmp/amelie-animals-mobile.png', full_page=True)
    route('/learn', '#next')
    page.locator('#next').click()
    if server:
        assert data('await m.flushSaves()'), data('m.SYNC')
        assert len(page.evaluate("async () => (await fetch('api/db/progress', {headers:{'X-Amelie-Scope':(await import('./js/auth.js')).SESSION.scope}})).json()")) == 1
        # A failed POST must be retained, overlaid after reload, and eventually sent exactly once.
        page.route('**/api/db/**', lambda r: r.abort() if r.request.method == 'POST' else r.continue_())
        page.locator('#next').click()
        page.wait_for_function('async () => {const m=await import("./js/lib.js");return JSON.parse(localStorage.getItem(m.storageKey("pending")) || "[]").length>0;}')
        assert data('await m.flushSaves()') is False, data('m.SYNC')
        page.reload(wait_until='networkidle')
        assert data('m.S.progress.length') == 2
        page.unroute('**/api/db/**')
        assert data('await m.flushSaves()'), data('m.SYNC')
        assert len(page.evaluate("async () => (await fetch('api/db/progress', {headers:{'X-Amelie-Scope':(await import('./js/auth.js')).SESSION.scope}})).json()")) == 2
        assert len(data('m.S.progress')) == 2
        assert data('JSON.parse(localStorage.getItem(m.storageKey("pending"))).length') == 0
        page.route('**/api/db/**', lambda r: r.abort() if r.request.method == 'POST' else r.continue_())
        page.evaluate('''() => { window.originalStorageSet = Storage.prototype.setItem;
            Storage.prototype.setItem = function(key, value) { if (key.endsWith(':pending')) throw new DOMException('Quota', 'QuotaExceededError'); return window.originalStorageSet.call(this, key, value); }; }''')
        data('await m.saveProfile({rate: 0.7})')
        assert data('m.SYNC.durable') is False
        page.evaluate('() => { Storage.prototype.setItem = window.originalStorageSet; }')
        page.unroute('**/api/db/**')
        # Wait for the failed in-flight request before explicitly retrying.
        data('await m.flushSaves()')
        assert data('await m.flushSaves()'), data('m.SYNC')
        print('PASS: failed saves survive reload and synchronize without duplicated records')
    page.reload(wait_until='networkidle')
    assert data('m.S.progress.length') == (2 if server else 1)
    route('/play', '#view .grid2')
    route('/listen', '#view .opts')
    assert page.locator('.opt').count() == 4
    route('/spell', '#view .letters')
    route('/sensei', '#view .opts')
    route('/abc', '#view .abc')
    assert page.locator('#view [data-l]').count() == 26
    page.locator('[data-l="A"]').click()
    expect(page.locator('#card')).to_contain_text('A is for')
    route('/colour/house/free', '#save')
    page.locator('[data-c="red"]').click()
    page.locator('#cv [data-w="sun"]').focus()
    page.locator('#cv [data-w="sun"]').press('Enter')
    expect(page.locator('#cv [data-w="sun"]')).to_have_attribute('fill', '#FF4D4F')
    page.locator('#save').click()
    page.wait_for_function('async () => {const m=await import("./js/lib.js");return JSON.parse(localStorage.getItem(m.storageKey("gallery")) || "[]").length===1;}')
    if server:
        assert data('await m.flushSaves()'), data('m.SYNC')
    route('/gallery', '#view .pics')
    page.reload(wait_until='networkidle')
    expect(page.locator('#view .pics [data-w="sun"]')).to_have_attribute('fill', '#FF4D4F')
    parents(page)
    page.locator('#npd').select_option('2')
    if server:
        assert data('await m.flushSaves()'), data('m.SYNC')
        expect(page.locator('#sync-status')).to_have_text('Все результаты сохранены на сервере.')
    with page.expect_download() as download:
        page.locator('#exp').click()
    backup = json.loads(Path(download.value.path()).read_text())
    assert backup['data']['profile'][0]['newPerDay'] == 2
    assert len(backup['data']['gallery']) == 1
    # Import the old prototype's export through the adult UI.
    backup['data']['profile'][0]['stars'] = 11
    backup['data'].pop('assignments', None)  # A real legacy export has no homework collection.
    page.on('dialog', lambda dialog: dialog.accept())
    with page.expect_navigation(wait_until='networkidle'):
        page.locator('#imp').set_input_files({'name': 'old-progress.json', 'mimeType': 'application/json', 'buffer': json.dumps(backup).encode()})
    expect(page.locator('#npd' if server else '#ans')).to_be_visible()
    assert data('m.profile().stars') == 11
    homework(page, server)
    if server:
        parents(page)
        page.locator('#content-import').set_input_files(str(ROOT / 'docs/content-example.json'))
        expect(page.locator('#content-result')).to_contain_text('Готово: тем — 1, слов — 2.')
        assert data('m.S.topics.length') == 13
        assert data('m.S.words.length') == 112
        assert data('m.profile().stars') == 11
        # A broken server must show an error, not silently start a separate static profile.
        page.route('**/api/db/topics', lambda r: r.fulfill(status=503, content_type='application/json', body='{}'))
        page.reload(wait_until='networkidle')
        expect(page.locator('[role="alert"]')).to_contain_text('Не получилось открыть альбом')
        page.unroute('**/api/db/topics')
        page.locator('#retry').click()
        expect(page.locator('#npd')).to_be_visible()
        assert data('m.profile().stars') == 11
        print('PASS: content import, old progress migration, and explicit server failure recovery')
    # Adding a missing textbook word must preserve the already entered assignment.
    parents(page)
    page.locator('.parent-tabs a[href="#/parents/homework"]').click()
    page.locator('#hw-pages').fill('72')
    page.locator('#hw-task').fill('My paper boat')
    page.locator('#homework-form input[value="toys-ball"]').check()
    expect(page.locator('#hw-selected')).to_contain_text('ball')
    page.locator('#hw-selected [data-remove="toys-ball"]').click()
    expect(page.locator('#homework-form input[value="toys-ball"]')).not_to_be_checked()
    page.locator('.new-word-panel summary').click()
    page.locator('#add [name="en"]').fill('boat')
    page.locator('#add [name="ru"]').fill('лодка')
    page.locator('#add button').click()
    expect(page.locator('#hw-selected')).to_contain_text('boat')
    expect(page.locator('#hw-pages')).to_have_value('72')
    expect(page.locator('#hw-task')).to_have_value('My paper boat')
    page.locator('#homework-form button[type="submit"]').click()
    expect(page.locator('#hw-message')).to_contain_text('Задание сохранено')
    assert data('m.S.assignments.some(a=>a.pages==="72" && a.wordIds.some(id=>m.wordById(id)?.en==="boat"))')
    if server:
        assert data('await m.flushSaves()'), data('m.SYNC')
    assert not errors, errors
    print('PASS:', 'server' if server else 'GitHub Pages', 'navigation, learning, games, ABC, painting, persistence, adult settings and backup round-trip')
    context.close()

def family_access(browser, base):
    context = browser.new_context(viewport={'width': 320, 'height': 740})
    context.add_init_script("if(!localStorage.getItem('old-server-test')) {localStorage.setItem('amelie:v1:serverUsed','true'); localStorage.setItem('amelie:v1:profile',JSON.stringify([{id:'amelie',stars:999}])); localStorage.setItem('amelie:v1:pending',JSON.stringify([{col:'profile',item:{id:'amelie',stars:999}}])); localStorage.setItem('old-server-test','true');}")
    page = context.new_page()
    page.goto(base, wait_until='networkidle')
    login(page)
    expect(page.locator('#stars')).to_have_text('3')
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    parents(page)
    with page.expect_navigation(wait_until='networkidle'):
        page.locator('#family-profile').select_option('demo')
    expect(page.locator('#family-profile')).to_have_value('demo')
    expect(page.locator('#stars')).to_have_text('0')
    page.locator('.family-panel summary').click()
    with page.expect_response('**/api/auth/password') as response:
        page.locator('[data-password="demo"]').click()
    access = response.value.json()
    expect(page.locator('#access-message')).to_contain_text('Пароль показан только сейчас')
    with page.expect_navigation(wait_until='networkidle'):
        page.locator('#sign-out').click()
    login(page, access['login'], access['password'])
    expect(page.locator('#stars')).to_have_text('0')
    page.evaluate("location.hash='/'")
    expect(page.locator('h1')).to_have_text('Демо')
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.evaluate("location.hash='/learn'")
    page.locator('#next').click()
    assert page.evaluate("async () => (await import('./js/lib.js')).flushSaves()")
    page.evaluate("location.hash='/parents'")
    expect(page.locator('#parent-login')).to_be_visible()
    assert page.locator('#family-profile').count() == 0
    assert page.locator('#imp').count() == 0
    assert page.evaluate("async () => (await import('./js/lib.js')).storageKey('pending')") == 'amelie:v2:demo:demo:pending'
    with page.expect_navigation(wait_until='networkidle'):
        page.locator('#parent-login').click()
    login(page)
    expect(page.locator('#stars')).to_have_text('3')
    parents(page)
    expect(page.locator('#family-profile')).to_have_value('amelie')
    print('PASS: parent/child login UI, password handoff, separate empty demo, cache isolation and child permissions at 320px')
    context.close()


def colouring_pack(browser, base):
    context = browser.new_context(viewport={'width':390,'height':844})
    page = context.new_page(); errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(base,wait_until='networkidle');login(page);parents(page)
    with page.expect_navigation(wait_until='networkidle'):
        page.locator('#family-profile').select_option('demo')
    page.evaluate("location.hash='/paint'")
    expect(page.locator('.colouring-tile')).to_have_count(3)
    page.evaluate("location.hash='/colour/dino-garden/free'")
    expect(page.locator('#view')).to_contain_text('Эта история сейчас недоступна')
    assert page.locator('#cv').count()==0
    parents(page)
    with page.expect_navigation(wait_until='networkidle'):
        page.locator('#family-profile').select_option('amelie')
    page.locator('.family-panel summary').click()
    with page.expect_response('**/api/auth/password') as response:
        page.locator('[data-password="amelie"]').click()
    access=response.value.json()
    with page.expect_navigation(wait_until='networkidle'):
        page.locator('#sign-out').click()
    login(page,access['login'],access['password'])
    def data(expr):return page.evaluate('async () => { const m=await import("./js/lib.js");return '+expr+';}')
    baseline=data('m.S.gallery.length')
    page.evaluate("location.hash='/paint'")
    expect(page.locator('.new-colouring .colouring-tile')).to_have_count(6)
    expect(page.locator('.colouring-tile')).to_have_count(9)
    for width in [320,390]:
        page.set_viewport_size({'width':width,'height':844})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.screenshot(path='/tmp/amelie-new-colouring-pack.png',full_page=True)
    pictures=page.evaluate("async () => (await import('./js/colouring/pictures.js')).ADVENTURE_PICTURES.map(p=>({id:p.id,en:p.en}))")
    def tap(region):
        point=page.locator(f'#cv .rg[data-w="{region}"]').first.evaluate('''g => {
            for(const shape of g.querySelectorAll('[data-part]')){
                if(!shape.isPointInFill)continue;
                const box=shape.getBBox();
                for(const fy of [.5,.3,.7,.15,.85])for(const fx of [.5,.3,.7,.15,.85]){
                    const p=new DOMPoint(box.x+box.width*fx,box.y+box.height*fy);
                    if(!shape.isPointInFill(p))continue;
                    const q=p.matrixTransform(shape.getScreenCTM());
                    if(document.elementFromPoint(q.x,q.y)?.closest('.rg')===g)return {x:q.x,y:q.y};
                }
            }
            throw new Error('Region has no accessible fill area: '+g.dataset.w);
        }''')
        page.mouse.click(point['x'],point['y'])
    natural={'dinosaur':'green','tree':'green','grass':'green','sun':'yellow','cloud':'blue','cat':'orange','belt':'yellow','mat':'green','water':'blue','carrot':'orange','strawberry':'red','rocket':'red','flame':'orange','moon':'yellow','star':'yellow','planet':'green'}
    for picture in pictures:
        page.evaluate('(id)=>location.hash="/colour/"+id+"/free"',picture['id'])
        expect(page.locator('#cv')).to_be_visible()
        expect(page.locator('#save')).to_be_disabled()
        regions=page.locator('#cv .rg').evaluate_all('(nodes)=>nodes.map(n=>n.dataset.w)')
        assert 5 <= len(set(regions)) <= 7, (picture, regions)
        regions = list(dict.fromkeys(regions))
        for region in regions:
            colour=natural.get(region,'pink')
            page.locator(f'[data-c="{colour}"]').click()
            # Scroll the canvas into view after selecting a crayon near its lower edge.
            page.locator('#cv').scroll_into_view_if_needed()
            tap(region)
            fill=data('m.S.words.find(w=>w.en==='+json.dumps(colour)+').color')
            assert page.locator(f'#cv .rg[data-w="{region}"] [data-part]').evaluate_all('(nodes, colour) => nodes.some(n=>n.getAttribute("fill")===colour)', fill)
        if picture['id']=='dino-garden':page.screenshot(path='/tmp/amelie-new-dino-coloured.png',full_page=True)
        before_count=data('m.S.gallery.length');before_stars=data('m.profile().stars')
        page.locator('#save').evaluate('(button)=>{button.click();button.click();button.click();}')
        expect(page.locator('#save')).to_be_disabled()
        expect(page.locator('#save')).to_contain_text('Уже в галерее')
        assert data('m.S.gallery.length')==before_count+1
        assert data('m.profile().stars')==before_stars+2
        assert data('await m.flushSaves()'),data('m.SYNC')
    page.evaluate("location.hash='/gallery'");page.reload(wait_until='networkidle')
    expect(page.locator('.pics > .tile')).to_have_count(baseline+6)
    for picture in pictures:
        expect(page.locator('.pics svg[aria-label="'+picture['en']+'"]')).to_be_visible()
    # Guided colour recognition and translated hints work on the new vocabulary.
    page.evaluate("location.hash='/colour/dino-garden'")
    expect(page.locator('#hear')).to_be_visible()
    for _ in range(6):
        task=page.locator('.task .en').inner_text()
        region,colour=re.search(r'Colour the (\w+) (\w+)\.',task).groups()
        page.locator('#hint').click()
        assert '→' in page.locator('#hint').inner_text()
        page.locator(f'[data-c="{colour}"]').click();page.locator('#cv').scroll_into_view_if_needed();tap(region)
        if _<5:page.wait_for_function('(old)=>document.querySelector(".task .en").textContent!==old',arg=task)
    expect(page.locator('.task')).to_contain_text('Free painting')
    # Keyboard access uses the same fill interaction.
    page.locator('[data-c="red"]').click()
    page.locator('#cv .rg[data-w="dinosaur"]').focus()
    page.locator('#cv .rg[data-w="dinosaur"]').press('Enter')
    expect(page.locator('#cv .rg[data-w="dinosaur"]')).to_have_attribute('fill','#FF4D4F')
    assert data('await m.flushSaves()')
    assert not errors,errors
    context.close()
    print('PASS: six personal scenes, every fill area tappable, save/reload, guided tasks, keyboard colouring and profile isolation')


with tempfile.TemporaryDirectory(prefix='amelie-browser-') as directory, sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), headless=True, args=['--no-sandbox'])
    env = {**os.environ, 'PORT': '0', 'HOST': '127.0.0.1', 'DATA_DIR': directory, 'APP_USER': 'test-family', 'APP_PASSWORD': 'local-test-only'}
    with running(['node', 'server.js'], env) as base:
        exercise(browser, base, server=True)
        old = {'id': 'amelie', 'stars': 3, 'newPerDay': 4, 'days': {}, 'stickers': []}
        context = browser.new_context(http_credentials={'username': 'test-family', 'password': 'local-test-only'})
        context.add_init_script("if(!localStorage.getItem('migration-fixture')) {localStorage.setItem('amelie:v1:profile'," + json.dumps(json.dumps([old])) + ");localStorage.setItem('migration-fixture','1');}")
        page = context.new_page()
        page.goto(base, wait_until='networkidle')
        login(page)
        assert page.evaluate("async () => (await import('./js/lib.js')).profile().stars") == 11
        parents(page)
        expect(page.locator('#migrate')).to_be_visible()
        page.on('dialog', lambda dialog: dialog.accept())
        with page.expect_navigation(wait_until='networkidle'):
            page.locator('#migrate').click()
        expect(page.locator('#npd')).to_be_visible()
        assert page.evaluate("async () => (await import('./js/lib.js')).profile().stars") == 3
        context.close()
        print('PASS: same-origin prototype progress is preserved until explicit adult migration')
        family_access(browser, base)
        colouring_pack(browser, base)
    with running(['python3', '-u', '-m', 'http.server', '0', '--bind', '127.0.0.1']) as base:
        exercise(browser, base)
    browser.close()
