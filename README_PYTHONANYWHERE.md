# PythonAnywhere deployment — WYSIWYG editor

This adds a Django WYSIWYG rich-text page editor to the SNES web emulator, ready to deploy on [PythonAnywhere](https://www.pythonanywhere.com/). It uses only Django + SQLite (already in the project), so no extra `pip` packages are required.

## What was added

| File | Purpose |
|------|---------|
| `wysiwyg/apps.py` | Django app config |
| `wysiwyg/models.py` | `Page` model (title, slug, rich HTML content, timestamps) |
| `wysiwyg/views.py` | list / new / edit / view pages + JSON save & delete API |
| `wysiwyg/urls.py` | `/wysiwyg/` routes |
| `wysiwyg/admin.py` | Admin registration for `Page` |
| `wysiwyg/templates/wysiwyg/` | base, list, editor, view templates |
| `wysiwyg/static/wysiwyg/css/editor.css` | Editor toolbar + editable area styles |
| `wysiwyg/static/wysiwyg/js/editor.js` | Vanilla-JS rich-text editor (contenteditable) + save/delete API calls |
| `wysiwyg/migrations/0001_initial.py` | Initial migration for `Page` |

## Changes to existing files

- `snes_project/settings.py` — added `'wysiwyg'` to `INSTALLED_APPS`
- `snes_project/urls.py` — added `path('wysiwyg/', include('wysiwyg.urls'))`
- `snes/static/snes/js/app.js` — removed the "Playing <game name>" overlay (placeholder is now cleared on load)

## URLs

| Path | View |
|------|------|
| `/wysiwyg/` | Page list |
| `/wysiwyg/new/` | New page editor |
| `/wysiwyg/<slug>/edit/` | Edit a page |
| `/wysiwyg/<slug>/` | Public read-only view |
| `/wysiwyg/api/save/` | Create/update page (POST JSON) |
| `/wysiwyg/api/delete/` | Delete page (POST JSON) |
| `/admin/` | Django admin (manage Pages) |

## PythonAnywhere deployment steps

1. **Upload the project** to your PythonAnywhere account (e.g. via the Files tab or `git clone`).

2. **Create a web app** in the PythonAnywhere dashboard:
   - Web tab → Add a new web app.
   - Choose "Manual configuration" (not the Django quick installer) so you control the WSGI file.
   - Select your Python version (3.10+ recommended).

3. **Install dependencies** in a virtualenv (bash console):
   ```bash
   mkvirtualenv --python=/usr/bin/python3.10 snesenv
   pip install Django>=5.0
   ```

4. **Configure the web app**:
   - Source code: `/home/<username>/online_snesgems_emulator`
   - Working directory: same
   - WSGI file: point it at the project's `snes_project/wsgi.py` (or use the default generated one and edit it to set the Django settings module and add the project to `sys.path`).
   - Static files URL: `/static/` → directory: `/home/<username>/online_snesgems_emulator/staticfiles` (this is the `STATIC_ROOT` directory after running `collectstatic`).
   - **Allowed hosts**: `ALLOWED_HOSTS` in `snes_project/settings.py` now defaults to `hoobylab.pythonanywhere.com,localhost,127.0.0.1`. You can override via the `ALLOWED_HOSTS` environment variable in your PythonAnywhere web app config (e.g. `ALLOWED_HOSTS=yourdomain.pythonanywhere.com,www.yourdomain.com`).

5. **Collect static files** (required on PythonAnywhere — Django does not serve static files in production):
   ```bash
   workon snesenv
   cd /home/<username>/online_snesgems_emulator
   python manage.py collectstatic --noinput
   ```
   This copies everything from `snes/static/` and `wysiwyg/static/` into `staticfiles/`, which PythonAnywhere serves directly at `/static/`.

   Re-run `collectstatic` whenever you change CSS, JS, or vendor files.

6. **Database**:
   ```bash
   workon snesenv
   cd /home/<username>/online_snesgems_emulator
   python manage.py migrate
   python manage.py createsuperuser   # optional, for admin access
   ```

7. **Reload** the web app from the PythonAnywhere dashboard. Visit `https://<username>.pythonanywhere.com/wysiwyg/`.

## Notes

- The editor uses the browser's native `contenteditable` + `document.execCommand`, so it works without any frontend build step or external CDN.
- Content is stored in SQLite (single `db.sqlite3` file), which PythonAnywhere supports on free/paid accounts.
- CSRF protection is enabled on the save/delete API endpoints; the editor reads the Django `csrftoken` cookie automatically.
- The SNES emulator overlay fix (`showPlaceholder('')`) means the game canvas is no longer covered by a persistent "Playing <name>" banner.
