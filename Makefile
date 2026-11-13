# Makefile for online_snesgems_emulator (Django web app)
#
# Targets:
#   make clean   - remove generated artifacts (db, caches, collected static)
#   make build   - install dependencies, migrate, seed ROMs
#   make run     - run the Django dev server (http://127.0.0.1:8000/)
#   make test    - run the Playwright end-to-end smoke test

PYTHON ?= python3
PIP    ?= pip3
PORT   ?= 8000
ADDR   ?= 127.0.0.1

# PEP 668 (externally-managed-environment) safe install flags. On Debian/Ubuntu
# system Python, plain pip install fails; --break-system-packages is required.
PIP_INSTALL_FLAGS ?= --break-system-packages

.PHONY: clean build run test help

help:
	@echo "Targets:"
	@echo "  clean   - remove build artifacts (db.sqlite3, __pycache__, staticfiles)"
	@echo "  build   - install dependencies, migrate DB, seed ROMs"
	@echo "  run     - run the Django dev server on $(ADDR):$(PORT)"
	@echo "  test    - run the Playwright end-to-end smoke test"

clean:
	rm -f db.sqlite3
	find . -type d -name __pycache__ -prune -exec rm -rf {} +
	rm -rf staticfiles
	rm -f /tmp/snes_server.log /tmp/snes_server.pid
	rm -f /tmp/emu_test*.log /tmp/debug_*.log

build:
	$(PIP) install $(PIP_INSTALL_FLAGS) --quiet -r requirements.txt
	$(PYTHON) manage.py migrate
	$(PYTHON) manage.py seed_roms

run:
	$(PYTHON) manage.py runserver $(ADDR):$(PORT)

test:
	$(PYTHON) validation/test_emulator.py
