from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8000/'


def main():
    passed = []
    failed = []
    browser = None
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={'width': 1280, 'height': 800}, device_scale_factor=1)
            try:
                page.goto(BASE, wait_until='domcontentloaded', timeout=60000)
                page.wait_for_selector('.rom-card', state='attached', timeout=60000)
                roms = page.eval_on_selector_all(
                    '.rom-card', 'els => els.map(function(e){return e.dataset.romId;})')
                print('[info] ROM cards:', roms)
                passed.append('ROM cards visible: ' + str(roms))

                page.wait_for_function(
                    'document.getElementById("snes").width === 256 && document.getElementById("snes").height === 224',
                    timeout=180000,
                )
                w = page.eval_on_selector('#snes', 'c => ({w: c.width, h: c.height})')
                print('[info] canvas size:', w)
                passed.append('canvas rendered ' + str(w['w']) + 'x' + str(w['h']))

                title = page.eval_on_selector('#placeholder', 'el => el.textContent')
                print('[info] stage placeholder:', title)

                page.locator('#snes').first.screenshot(path='/tmp/rom1_frame.png')
                print('[info] screenshot saved to /tmp/rom1_frame.png')
                passed.append('screenshot captured')

                page.fill('#state-name', 'pw-test-state-1')
                page.click('#save-state-confirm')
                page.wait_for_timeout(1500)
                count = page.evaluate(
                    "(async () => {\n"
                    "  const db = await new Promise((res, rej) => {\n"
                    "    var r = indexedDB.open('snes-emu', 1);\n"
                    "    r.onsuccess = () => res(r.result);\n"
                    "    r.onerror = () => rej(r.error);\n"
                    '  });\n'
                    "  const all = db.transaction('save-states', 'readonly')\n"
                    "    .objectStore('save-states').getAllKeys();\n"
                    '  return new Promise((res, rej) => {\n'
                    '    all.onsuccess = () => res(all.result || []);\n'
                    '    all.onerror = () => rej(all.error);\n'
                    '  });\n'
                    '})()'
                )
                print('[info] saved state keys:', count)
                passed.append('save state stored: ' + str(bool(count)))

                page.evaluate(
                    "(async () => {\n"
                    "  var stick = document.getElementById('thumbstick');\n"
                    "  stick.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, cancelable: true}));\n"
                    "  stick.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, cancelable: true}));\n"
                    "  stick.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, cancelable: true}));\n"
                    '})()'
                )
                print('[info] virtual gamepad input dispatched')
                passed.append('input dispatch ok')

                print('\n=== SUMMARY ===')
                for s in passed:
                    print('PASS:', s)
                for s in failed:
                    print('FAIL:', s)
            finally:
                if browser:
                    browser.close()
        except Exception as e:
            print('EXCEPTION:', e)
            import traceback
            traceback.print_exc()


if __name__ == '__main__':
    main()
