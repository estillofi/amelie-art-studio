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


def parents(page):
    page.evaluate("location.hash='/parents'")
    expect(page.locator('#ans')).to_be_visible()
    a, b = map(int, re.search(r'(\d+) × (\d+)', page.locator('#view').inner_text()).groups())
    page.locator('#ans').fill(str(a*b))
    page.locator('#go').click()
    expect(page.locator('#npd')).to_be_visible()


def exercise(browser, base, server=False):
    context = browser.new_context(viewport={'width': 390, 'height': 844}, http_credentials={'username': 'test-family', 'password': 'local-test-only'})
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda err: errors.append(str(err)))
    page.goto(base, wait_until='networkidle')
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
    route('/words', '#view .grid2')
    assert page.locator('#view a[href^="#/topic/"]').count() == 12
    route('/learn', '#next')
    page.locator('#next').click()
    if server:
        assert data('await m.flushSaves()')
        assert len(page.evaluate("async () => (await fetch('api/db/progress')).json()")) == 1
        # A failed POST must be retained, overlaid after reload, and eventually sent exactly once.
        page.route('**/api/db/**', lambda r: r.abort() if r.request.method == 'POST' else r.continue_())
        page.locator('#next').click()
        page.wait_for_function('JSON.parse(localStorage.getItem("amelie:v1:pending") || "[]").length>0')
        assert data('await m.flushSaves()') is False
        page.reload(wait_until='networkidle')
        assert data('m.S.progress.length') == 2
        page.unroute('**/api/db/**')
        assert data('await m.flushSaves()')
        assert len(page.evaluate("async () => (await fetch('api/db/progress')).json()")) == 2
        assert len(data('m.S.progress')) == 2
        assert page.evaluate('JSON.parse(localStorage.getItem("amelie:v1:pending")).length') == 0
        page.route('**/api/db/**', lambda r: r.abort() if r.request.method == 'POST' else r.continue_())
        page.evaluate('''() => { window.originalStorageSet = Storage.prototype.setItem;
            Storage.prototype.setItem = function(key, value) { if (key.endsWith(':pending')) throw new DOMException('Quota', 'QuotaExceededError'); return window.originalStorageSet.call(this, key, value); }; }''')
        data('await m.saveProfile({rate: 0.7})')
        assert data('m.SYNC.durable') is False
        page.evaluate('() => { Storage.prototype.setItem = window.originalStorageSet; }')
        page.unroute('**/api/db/**')
        # Wait for the failed in-flight request before explicitly retrying.
        data('await m.flushSaves()')
        assert data('await m.flushSaves()')
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
    page.locator('#cv [data-w="sun"] circle').click()
    expect(page.locator('#cv [data-w="sun"]')).to_have_attribute('fill', '#FF4D4F')
    page.locator('#save').click()
    page.wait_for_function('JSON.parse(localStorage.getItem("amelie:v1:gallery") || "[]").length===1')
    if server:
        assert data('await m.flushSaves()')
    route('/gallery', '#view .pics')
    page.reload(wait_until='networkidle')
    expect(page.locator('#view .pics [data-w="sun"]')).to_have_attribute('fill', '#FF4D4F')
    parents(page)
    page.locator('#npd').select_option('2')
    if server:
        assert data('await m.flushSaves()')
        expect(page.locator('#sync-status')).to_have_text('Все результаты сохранены на сервере.')
    with page.expect_download() as download:
        page.locator('#exp').click()
    backup = json.loads(Path(download.value.path()).read_text())
    assert backup['data']['profile'][0]['newPerDay'] == 2
    assert len(backup['data']['gallery']) == 1
    # Import the old prototype's export through the adult UI.
    backup['data']['profile'][0]['stars'] = 11
    page.on('dialog', lambda dialog: dialog.accept())
    page.locator('#imp').set_input_files({'name': 'old-progress.json', 'mimeType': 'application/json', 'buffer': json.dumps(backup).encode()})
    expect(page.locator('#ans')).to_be_visible()
    assert data('m.profile().stars') == 11
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
        expect(page.locator('#ans')).to_be_visible()
        assert data('m.profile().stars') == 11
        print('PASS: content import, old progress migration, and explicit server failure recovery')
    assert not errors, errors
    print('PASS:', 'server' if server else 'GitHub Pages', 'navigation, learning, games, ABC, painting, persistence, adult settings and backup round-trip')
    context.close()

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
        assert page.evaluate("async () => (await import('./js/lib.js')).profile().stars") == 11
        parents(page)
        expect(page.locator('#migrate')).to_be_visible()
        page.on('dialog', lambda dialog: dialog.accept())
        page.locator('#migrate').click()
        expect(page.locator('#ans')).to_be_visible()
        assert page.evaluate("async () => (await import('./js/lib.js')).profile().stars") == 3
        context.close()
        print('PASS: same-origin prototype progress is preserved until explicit adult migration')
    with running(['python3', '-u', '-m', 'http.server', '0', '--bind', '127.0.0.1']) as base:
        exercise(browser, base)
    browser.close()
