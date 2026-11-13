"""
WSGI config for snes_project project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.1/howto/deployment/wsgi/
"""

import os
import sys

from pathlib import Path

# wsgi.py lives at src/snes_project/wsgi.py.
#   parent.parent = src/        (needed so `snes_project` is importable)
#   parent.parent.parent = /    project root (needed so `staticfiles/`, `static/`, `roms/` resolve)
PROJECT_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
for _dir in (PROJECT_DIR, ROOT_DIR):
    if str(_dir) not in sys.path:
        sys.path.insert(0, str(_dir))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'snes_project.settings')

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()
