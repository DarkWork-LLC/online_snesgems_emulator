"""
WSGI config for snes_project project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.1/howto/deployment/wsgi/
"""

import os
import sys

from pathlib import Path

# Ensure the project directory is on the path (required on PythonAnywhere).
PROJECT_DIR = Path(__file__).resolve().parent.parent
if str(PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'snes_project.settings')

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()
