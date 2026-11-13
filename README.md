# online_snesgems_emulator

A **Python-Django web application** that runs Super Nintendo (SNES) games
directly in your web browser — playable on a desktop browser, a mobile phone
or a trackpad — with save states persisted in the user's browser. It also
includes a Django WYSIWYG rich-text page editor (`/wysiwyg/`) for authoring
pages that can be deployed on PythonAnywhere.

## Games bundled

- `Ken Griffey Jr. Presents Major League Baseball.smc`
- `Metal Marines (USA).sfc`
- `Ogre Battle - The March of the Black Queen (1).smc`

## How it works

The emulation runs **client-side in the browser** (Snes9x compiled to
WebAssembly, vendored under `static/snes/js/vendor/`). The Django backend
serves the UI, the ROM metadata and the binary ROM streams; the heavy lifting
happens in the browser, so there is no server-side latency and the app can run
on a modest host.

Features:

- Play bundled games in the browser (canvas rendering).
- Controls: keyboard (arrows + SNES diamond layout), USB gamepads (polled
  automatically), on-screen virtual gamepad (touch + mouse + trackpad) and a
  draggable thumbstick.
- Save states are stored in the user's browser (IndexedDB) and can be
  reloaded later — no server round-trip.
- Cartridge SRAM (battery-backed saves) is auto-persisted to the browser's
  Origin Private File System (OPFS) every 15 s and on pause/destroy.
- In-game settings menu (press Escape) for region, aspect, filter, volume,
  interpolation, sprite limit, etc.
- **WYSIWYG rich-text page editor** at `/wysiwyg/` — create, edit, preview and
  delete pages with formatted HTML content, backed by SQLite and the Django
  admin. No frontend build step or external CDN required.

## WYSIWYG editor (`/wysiwyg/`)

| Path | View |
|------|------|
| `/wysiwyg/` | Page list |
| `/wysiwyg/new/` | New page editor |
| `/wysiwyg/<slug>/edit/` | Edit a page |
| `/wysiwyg/<slug>/` | Public read-only view |
| `/wysiwyg/api/save/` | Create/update page (POST JSON) |
| `/wysiwyg/api/delete/` | Delete page (POST JSON) |
| `/admin/` | Django admin (manage Pages) |

The editor uses native `contenteditable` + `document.execCommand` and stores
content in SQLite. See `README_PYTHONANYWHERE.md` for PythonAnywhere-specific
deployment steps.

## Setup

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_roms
```

The `wysiwyg` app ships with its own migration (`wysiwyg/migrations/`), so
`migrate` creates the `Page` table automatically.

## Run

```bash
python manage.py runserver
```

Then open `http://127.0.0.1:8000/` in your browser. (OPFS / IndexedDB require a
secure context — `localhost` counts, so `runserver` works as-is.)

## Mobile / touchpad

Open the same URL on a phone or tablet. The on-screen virtual gamepad (D-pad,
face buttons, L/R, Start/Select and the analog thumbstick) supports touch,
mouse and trackpad input. Keyboard and USB gamepads also work on desktop.

## Validate

A Playwright end-to-end smoke test is provided in `validation/test_emulator.py`
(requires `playwright` and a Chromium install). It loads the first game,
verifies a frame is rendered, takes a screenshot, stores a save state in
IndexedDB and exercises the virtual gamepad.