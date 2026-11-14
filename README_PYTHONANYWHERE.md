# PythonAnywhere deployment — WYSIWYG editor & SNES Emulator

This project includes a Super Nintendo (SNES) browser emulator and a Django WYSIWYG rich-text page editor, ready to deploy on [PythonAnywhere](https://www.pythonanywhere.com/). It uses only Django + SQLite (already in the project), so no extra external packages beyond Django are required.

## What is included

| File / Module | Purpose |
|------|---------|
| `src/snes/` | SNES emulator web app, views, models, and templates (serves 10 bundled ROMs and WebAssembly Snes9x runtime) |
| `src/wysiwyg/` | WYSIWYG rich-text page editor app (`Page` model, views, APIs, templates) |
| `static/snes/` | SNES emulator CSS, JS (virtual gamepad, remapping, saved states), and Snes9x WebAssembly assets |
| `static/wysiwyg/` | WYSIWYG editor styles and vanilla-JS editor implementation |

## URLs

| Path | View |
|------|------|
| `/` | SNES Emulator web app (ROM selection, virtual gamepad with touch feedback, button remapping, save states) |
| `/wysiwyg/` | Page list |
| `/wysiwyg/new/` | New page editor |
| `/wysiwyg/<slug>/edit/` | Edit a page |
| `/wysiwyg/<slug>/` | Public read-only view |
| `/wysiwyg/api/save/` | Create/update page (POST JSON) |
| `/wysiwyg/api/delete/` | Delete page (POST JSON) |
| `/admin/` | Django admin (manage ROMs & Pages) |

## PythonAnywhere deployment steps

1. **Upload the project** to your PythonAnywhere account (e.g. via the Files tab or `git clone`).

   Note: `staticfiles/` and `.venv/` are gitignored and **not** uploaded — they are created locally on PythonAnywhere.

2. **Create a web app** in the PythonAnywhere dashboard:
   - Web tab → Add a new web app.
   - Choose "Manual configuration" (not the Django quick installer) so you control the WSGI file.
   - Select your Python version (3.10+ recommended).

3. **Configure the web app**:
   - Source code: `/home/<username>/online_snesgems_emulator`
   - Working directory: same
   - WSGI file: point it at the project's root-level `wsgi.py`
     (e.g. `/home/<username>/online_snesgems_emulator/wsgi.py`).
   - This file adds `src/` to `sys.path` so `snes_project` is importable.
   - Do NOT point to `src/snes_project/wsgi.py` directly.

4. **Configure static files** on the Web tab:
   - Static files URL: `/static/`
   - Static files directory: `/home/<username>/online_snesgems_emulator/staticfiles`
   - **Important**: this is the `staticfiles/` directory (created by `collectstatic`), NOT the `static/` source directory.

5. **Install dependencies, seed ROMs, and collect static** in a bash console:
   ```bash
   mkvirtualenv --python=/usr/bin/python3.10 snesenv
   workon snesenv
   cd /home/<username>/online_snesgems_emulator
   pip install Django>=5.0
   python manage.py migrate
   python manage.py seed_roms
   python manage.py collectstatic --noinput
   python manage.py createsuperuser   # optional, for admin access
   ```

   Or use the provided Makefile targets:
   ```bash
   make venv
   source .venv/bin/activate
   make install
   make migrate
   make seed
   make collectstatic
   ```

6. **Reload** the web app from the PythonAnywhere dashboard. Visit `https://<username>.pythonanywhere.com/`.

   Re-run `collectstatic` whenever you change CSS, JS, or vendor files.

## Notes

- The WYSIWYG editor uses the browser's native `contenteditable` + `document.execCommand`, so it works without any frontend build step or external CDN.
- Content is stored in SQLite (single `db.sqlite3` file), which PythonAnywhere supports on free/paid accounts.
- CSRF protection is enabled on the save/delete API endpoints; the editor reads the Django `csrftoken` cookie automatically.
- The SNES emulator runs client-side via WebAssembly (Snes9x), supporting virtual gamepad touch feedback, button remapping, audio unlock, and IndexedDB/OPFS persistence.

### Troubleshooting: static files served as `text/html` (MIME mismatch)

If your browser console shows errors like:

> The resource from ".../static/snes/css/style.css" was blocked due to MIME type ("text/html")
> Loading module from ".../static/snes/js/app.js" was blocked because of a disallowed MIME type ("text/html")

this means PythonAnywhere is returning an HTML page (usually a 404) instead of the actual CSS/JS file. The fix:

1. **Confirm the static files mapping** on the PythonAnywhere "Web" tab:
   - Static files URL: `/static/`
   - Static files directory: `/home/<username>/online_snesgems_emulator/staticfiles`
   - (NOT the `static/` source directory — that's only for `collectstatic` to read from.)

2. **Run `collectstatic`** in a bash console on PythonAnywhere (this step is required after every deploy, because `staticfiles/` is gitignored and not uploaded):

   ```bash
   workon snesenv
   cd /home/<username>/online_snesgems_emulator
   python manage.py collectstatic --noinput
   ```

   This copies everything from `static/` into `staticfiles/`, which PythonAnywhere serves directly at `/static/`.

3. **Reload** the web app from the PythonAnywhere dashboard.

Re-run `collectstatic` whenever you change CSS, JS, or vendor files.
