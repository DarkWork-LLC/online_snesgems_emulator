#!/usr/bin/env python3
"""Test runner for the SNES emulator Django tests.

Discovers tests in the tests/django/ directory without interfering with
the app's own test discovery.
"""
import importlib
import os
import sys
import traceback
import unittest

# Ensure the project root and src/ are on sys.path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
SRC_DIR = os.path.join(PROJECT_ROOT, 'src')
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'snes_project.settings')
import django  # noqa: E402
django.setup()

from django.core.management import call_command
call_command('migrate', verbosity=0)
call_command('seed_roms', verbosity=0)

test_modules = [
    'tests.django.test_models',
    'tests.django.test_views',
]

failed = 0
total = 0

for module_name in test_modules:
    try:
        module = importlib.import_module(module_name)
        loader = unittest.TestLoader()
        suite = loader.loadTestsFromModule(module)
        total += suite.countTestCases()
        result = unittest.TextTestRunner(verbosity=2).run(suite)
        if not result.wasSuccessful():
            failed += 1
    except Exception as e:
        print(f'ERROR importing/running {module_name}: {e}')
        traceback.print_exc()
        failed += 1

print(f'\n=== Django Tests: {total} tests, {failed} failed ===')
sys.exit(1 if failed else 0)
