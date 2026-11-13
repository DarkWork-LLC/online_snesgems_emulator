"""
WSGI entry point for PythonAnywhere.

Points Django at the src-layout project.  On the PythonAnywhere "Web" tab, set
the WSGI file to the full path of this file, e.g.:

    /home/<username>/online_snesgems_emulator/wsgi.py

This file adds both `src/` (so `snes_project` is importable) and the project
root (so `staticfiles/`, `static/`, `roms/` resolve) to sys.path, then
delegates to src/snes_project/wsgi.py.
"""

import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
SRC_DIR = PROJECT_ROOT / 'src'

for _dir in (SRC_DIR, PROJECT_ROOT):
    if str(_dir) not in sys.path:
        sys.path.insert(0, str(_dir))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'snes_project.settings')

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()