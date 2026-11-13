# Makefile for online_snesgems_emulator (Django web app)
#
# Targets:
#   make venv        - create a Python virtual environment in .venv/
#   make setup       - full first-time setup: venv, deps, migrate, seed, collectstatic
#   make install     - install dependencies into current Python/venv
#   make collectstatic - gather static files into staticfiles/ for production
#   make checkstatic - verify staticfiles/ has the expected files (debug PA static mapping)
#   make migrate     - run Django migrations
#   make seed        - seed ROMs into the database
#   make build       - install deps, migrate, seed ROMs, collectstatic
#   make run         - run the Django dev server (http://127.0.0.1:8000/)
#   make test        - run the Playwright end-to-end smoke test
#   make clean       - remove generated artifacts (db, caches, collected static, venv)
#   make pa          - print PythonAnywhere deployment steps
#   make help        - show this help

PYTHON ?= python3
PIP    ?= pip3
VENV   ?= .venv
PORT   ?= 8000
ADDR   ?= 127.0.0.1

# PEP 668 (externally-managed-environment) safe install flags. On Debian/Ubuntu
# system Python, plain pip install fails; --break-system-packages is required.
PIP_INSTALL_FLAGS ?= --break-system-packages

# Resolve venv python/pip if the venv exists, otherwise fall back to system python/pip.
VENV_PYTHON = $(VENV)/bin/python
VENV_PIP    = $(VENV)/bin/pip
PY = $(if $(wildcard $(VENV_PYTHON)),$(VENV_PYTHON),$(PYTHON))
PIP_CMD = $(if $(wildcard $(VENV_PIP)),$(VENV_PIP),$(PIP))

.PHONY: clean setup install venv collectstatic checkstatic migrate seed build run test pa help

help:
	@echo "Targets:"
	@echo "  venv        - create a Python virtual environment in $(VENV)/"
	@echo "  setup       - full first-time setup (venv, deps, migrate, seed, collectstatic)"
	@echo "  install     - install dependencies into current Python/venv"
	@echo "  collectstatic - gather static files into staticfiles/ for production"
	@echo "  checkstatic   - verify staticfiles/ has the expected files (debug PA static mapping)"
	@echo "  migrate     - run Django migrations"
	@echo "  seed        - seed ROMs into the database"
	@echo "  build       - install deps, migrate, seed ROMs, collectstatic"
	@echo "  run         - run the Django dev server on $(ADDR):$(PORT)"
	@echo "  test        - run the Playwright end-to-end smoke test"
	@echo "  clean       - remove build artifacts (db.sqlite3, __pycache__, staticfiles, $(VENV))"
	@echo "  pa          - print PythonAnywhere deployment steps"

venv:
	@if [ ! -d "$(VENV)" ]; then \
		echo "Creating virtual environment in $(VENV)..."; \
		$(PYTHON) -m venv $(VENV); \
	else \
		echo "Virtual environment $(VENV) already exists."; \
	fi
	@echo ""
	@echo "To activate:  source $(VENV)/bin/activate"

install:
	$(PIP_CMD) install $(PIP_INSTALL_FLAGS) --quiet -r requirements.txt

migrate:
	$(PY) manage.py migrate

seed:
	$(PY) manage.py seed_roms

collectstatic:
	$(PY) manage.py collectstatic --noinput

checkstatic:
	@echo "=== Static files check ==="
	@echo "STATIC_ROOT = $(CURDIR)/staticfiles"
	@if [ -d "staticfiles" ]; then \
		echo "staticfiles/ exists: YES"; \
		echo "Key files:"; \
		ls -la staticfiles/snes/css/style.css staticfiles/snes/js/app.js staticfiles/favicon.ico 2>/dev/null || echo "  (some files missing)"; \
	else \
		echo "staticfiles/ exists: NO  (run: make collectstatic)"; \
	fi
	@echo ""
	@echo "PythonAnywhere Web tab -> Static files should be:"
	@echo "  URL: /static/"
	@echo "  Dir: $(CURDIR)/staticfiles"

build: install migrate seed collectstatic

setup: venv install migrate seed collectstatic
	@echo ""
	@echo "Setup complete. Next steps:"
	@echo "  - Activate the venv:  source $(VENV)/bin/activate"
	@echo "  - Run the server:     make run"
	@echo "  - On PythonAnywhere:  make pa"

run:
	$(PY) manage.py runserver $(ADDR):$(PORT)

test:
	$(PY) validation/test_emulator.py

pa:
	@echo "PythonAnywhere deployment steps:"
	@echo ""
	@echo "  1. Web tab -> Add a new web app:"
	@echo "     - Choose \"Manual configuration\""
	@echo "     - Select your Python version (3.10+ recommended)"
	@echo ""
	@echo "  2. Web tab -> Configure the web app:"
	@echo "     - Source code:      /home/<username>/online_snesgems_emulator"
	@echo "     - Working directory: /home/<username>/online_snesgems_emulator"
	@echo "     - WSGI file:        src/snes_project/wsgi.py"
	@echo ""
	@echo "  3. Web tab -> Static files:"
	@echo "     - URL: /static/"
	@echo "     - Directory: /home/<username>/online_snesgems_emulator/staticfiles"
	@echo "     (NOT the static/ source directory — that is only read by collectstatic.)"
	@echo ""
	@echo "  4. Bash console:"
	@echo "     workon snesenv   (or: source .venv/bin/activate)"
	@echo "     cd /home/<username>/online_snesgems_emulator"
	@echo "     python manage.py collectstatic --noinput"
	@echo ""
	@echo "  5. Web tab -> Reload your web app."
	@echo "     Visit https://<username>.pythonanywhere.com/"
	@echo ""
	@echo "  Re-run collectstatic whenever you change CSS, JS, or vendor files."

clean:
	rm -f db.sqlite3
	find . -type d -name __pycache__ -prune -exec rm -rf {} +
	rm -rf staticfiles $(VENV)
	rm -f /tmp/snes_server.log /tmp/snes_server.pid
	rm -f /tmp/emu_test*.log /tmp/debug_*.log
