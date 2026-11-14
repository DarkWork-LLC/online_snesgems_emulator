<<<<<<< HEAD
/* SNES emulator app (frontend). */
import { load } from './vendor/snes9x.sdk.js';
import {
    VirtualState,
    applyVirtualState,
    bindVirtualAction,
    bindThumbstick,
    VIRTUAL_KEYMAP,
} from './controller.js';
import { SaveStateStore } from './savedstates.js';

function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatSize(n) {
    if (n >= 1 << 20) return (n / (1 << 20)).toFixed(1) + ' MB';
    if (n >= 1 << 10) return (n / (1 << 10)).toFixed(1) + ' KB';
    return n + ' B';
}

function palette(id) {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    return colors[id % colors.length];
}

let toastTimer = null;
function flash(msg) {
    let el = document.getElementById('toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'toast';
        el.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#262c3a;color:#e6e9ef;padding:10px 16px;border-radius:8px;font-size:14px;pointer-events:none;z-index:999;opacity:0;transition:opacity 0.2s;';
        document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.style.opacity = '0'; }, 2200);
}

const engine = { current: null };
let currentRomId = null;
const ROMS = [];
const store = new SaveStateStore();
const $ = (id) => document.getElementById(id);
const canvas = $('snes');
const stage = $('stage');
const placeholder = $('placeholder');
const fpsEl = $('fps');
const romLibrary = $('rom-library');
const playBtn = $('play');
const pauseBtn = $('pause');
const resetBtn = $('reset');
const screenshotBtn = $('screenshot');

async function init() {
    try {
        const res = await fetch('/api/roms/');
        if (!res.ok) throw new Error('ROM list load failed');
        const data = await res.json();
        ROMS.push(...data.roms);
    } catch (e) {
        flash('Could not load ROM list. Is the server running? ' + e.message);
    }
    if (!ROMS.length) {
        romLibrary.innerHTML = '<div class="placeholder" style="color:#8b93a3">No ROMs registered.</div>';
        return;
    }
    const romSelect = $('rom-select');
    ROMS.forEach((rom, i) => {
        const card = document.createElement('div');
        card.className = 'rom-card';
        card.dataset.romId = rom.id;
        const fileSize = rom.file_size ?? rom.size ?? 0;
        card.innerHTML =
            '<span class="dot" style="background:' + palette(i) + '"></span>' +
            '<div><div class="rom-name">' + escapeHtml(rom.name) + '</div>' +
            '<div class="rom-meta">' + escapeHtml(rom.filename) + ' &middot; ' + formatSize(fileSize) + '</div></div>';
        card.addEventListener('click', () => selectRom(rom.id));
        romLibrary.appendChild(card);

        if (romSelect) {
            const option = document.createElement('option');
            option.value = rom.id;
            option.textContent = rom.name;
            romSelect.appendChild(option);
        }
=======
/* SNES emulator app (frontend). */import { load } from './vendor/snes9x.sdk.js';import {    VirtualState,    applyVirtualState,    bindVirtualAction,    bindThumbstick,    VIRTUAL_KEYMAP,} from './controller.js';import { SaveStateStore } from './savedstates.js';function escapeHtml(s) {    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');}function formatSize(n) {    if (n >= 1 << 20) return (n / (1 << 20)).toFixed(1) + ' MB';    if (n >= 1 << 10) return (n / (1 << 10)).toFixed(1) + ' KB';    return n + ' B';}function palette(id) {    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];    return colors[id % colors.length];}let toastTimer = null;function flash(msg) {    let el = document.getElementById('toast');    if (!el) {        el = document.createElement('div');        el.id = 'toast';        el.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#262c3a;color:#e6e9ef;padding:10px 16px;border-radius:8px;font-size:14px;pointer-events:none;z-index:999;opacity:0;transition:opacity 0.2s;';        document.body.appendChild(el);    }    el.textContent = msg;    el.style.opacity = '1';    clearTimeout(toastTimer);    toastTimer = setTimeout(() => { el.style.opacity = '0'; }, 2200);}const engine = { current: null };let currentRomId = null;const ROMS = [];const store = new SaveStateStore();const $ = (id) => document.getElementById(id);const canvas = $('snes');const stage = $('stage');const placeholder = $('placeholder');const fpsEl = $('fps');const romLibrary = $('rom-library');const playBtn = $('play');const pauseBtn = $('pause');const resetBtn = $('reset');const screenshotBtn = $('screenshot');async function init() {    try {        const res = await fetch('/api/roms/');        if (!res.ok) throw new Error('ROM list load failed');        ROMS.push(...(await res.json()).roms);    } catch (e) {        flash('Could not load ROM list. Is the server running? ' + e.message);    }    if (!ROMS.length) {        romLibrary.innerHTML = '<div class="placeholder" style="color:#8b93a3">No ROMs registered.</div>';        return;    }    ROMS.forEach((rom, i) => {        const card = document.createElement('div');        card.className = 'rom-card';        card.dataset.romId = rom.id;        card.innerHTML =            '<span class="dot" style="background:' + palette(i) + '"></span>' +            '<div><div class="rom-name">' + escapeHtml(rom.name) + '</div>' +            '<div class="rom-meta">' + escapeHtml(rom.filename) + ' &middot; ' + formatSize(rom.size) + '</div></div>';        card.addEventListener('click', () => selectRom(rom.id));        romLibrary.appendChild(card);    });    const first = ROMS[0];    currentRomId = first.id;    selectRom(first.id);}async function selectRom(romId) {    document.querySelectorAll('.rom-card').forEach((c) => {        c.classList.toggle('selected', Number(c.dataset.romId) === romId);    });    currentRomId = romId;    if (engine.current) {        await engine.current.destroy();        engine.current = null;    }    const rom = ROMS.find((r) => r.id === romId);    if (!rom) return;    showPlaceholder('Loading game...');    const bytes = await fetchRomBytes(rom);    const options = readOptions();    try {        engine.current = await load({            assets: { rom: bytes },            canvasEl: canvas,            options: options,            persist: 'opfs',            storageNamespace: 'snes9x',            onEvent: onEvent,        });    } catch (e) {        showPlaceholder('Failed to load ROM: ' + e.message);        flash('ROM load error: ' + e.message);        return;    }    engine.current.setInput(VIRTUAL_KEYMAP);    engine.current.start();    playBtn.disabled = false;    pauseBtn.disabled = false;    resetBtn.disabled = false;    screenshotBtn.disabled = false;    $('state-name').disabled = false;    $('save-state-confirm').disabled = false;    $('state-list').disabled = false;    $('load-state').disabled = false;    $('delete-state').disabled = false;    showPlaceholder('');    flash('Loaded ' + rom.name);}async function fetchRomBytes(rom) {    const res = await fetch('/api/roms/' + rom.id + '/stream/');    if (!res.ok) throw new Error('ROM stream failed (' + res.status + ')');    const buffer = await res.arrayBuffer();    return new Uint8Array(buffer);}function readOptions() {    return {        region: $('region').value || 'auto',        aspect: $('aspect').value || '4:3',        renderFilter: $('filter').value || 'pixelated',        cropOverscan: true,        volume: parseFloat($('volume').value) || 1,        gamepads: $('gamepads').checked,        logLevel: 'error',        escMenu: true,        interpolation: 'gaussian',    };}playBtn.addEventListener('click', async () => { await engine.current.start(); updatePlayPause(); });pauseBtn.addEventListener('click', async () => { await engine.current.pause(); updatePlayPause(); });resetBtn.addEventListener('click', async () => { if (engine.current) await engine.current.reset(); });screenshotBtn.addEventListener('click', async () => {    if (!engine.current) return;    // Give the renderer a moment to stabilize so the captured frame is valid.    await new Promise((resolve) => setTimeout(resolve, 250));    const canvas = document.getElementById('snes');    canvas.toBlob((blob) => {        if (!blob) { flash('Screenshot failed.'); return; }        const url = URL.createObjectURL(blob);        const a = document.createElement('a');        a.href = url;        a.download = 'snes-shot.png';        document.body.appendChild(a);        a.click();        document.body.removeChild(a);        URL.revokeObjectURL(url);        flash('Screenshot saved.');    }, 'image/png');});function updatePlayPause() {    const e = engine.current;    playBtn.textContent = e && !e.paused ? 'Pause' : 'Play';    pauseBtn.textContent = e && e.paused ? 'Play' : 'Pause';}async function refreshStateList() {    const list = $('state-list');    const keys = await store.list();    list.innerHTML = '';    if (!keys.length) {        const opt = document.createElement('option');        opt.textContent = 'No saved states';        list.appendChild(opt);        $('delete-state').disabled = true;        return;    }    $('delete-state').disabled = false;    keys.forEach((k) => {        const opt = document.createElement('option');        opt.value = k;        opt.textContent = k + '  (bytes)';        list.appendChild(opt);    });}$('save-state-confirm').addEventListener('click', async () => {    if (!engine.current) { flash('No game running.'); return; }    const name = $('state-name').value.trim() || 'slot';    try {        const data = await engine.current.saveState();        await store.save(name, data);        $('state-name').value = '';        await refreshStateList();        flash('Save state stored.');    } catch (e) { flash('Save failed: ' + e.message); }});$('state-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('save-state-confirm').click(); });$('load-state').addEventListener('click', async () => {    if (!engine.current) { flash('No game running.'); return; }    const key = $('state-list').value;    if (!key) { flash('Choose a state first.'); return; }    try {        const data = await store.get(key);        if (!data) { flash('State not found.'); return; }        await engine.current.loadState(data);        flash('State loaded.');    } catch (e) { flash('Load failed: ' + e.message); }});$('delete-state').addEventListener('click', async () => {    const key = $('state-list').value;    if (!key) { flash('Choose a state first.'); return; }    if (!confirm('Delete this state?')) return;    try {        await store.remove(key);        await refreshStateList();        flash('Deleted.');    } catch (e) { flash('Delete failed: ' + e.message); }});$('volume').addEventListener('input', () => {    const v = parseFloat($('volume').value);    $('volume-label').textContent = v.toFixed(2);    if (engine.current) engine.current.config.write('volume', Math.max(0, Math.min(1, v)));});$('region').addEventListener('change', () => {    if (engine.current) engine.current.reset();});$('filter').addEventListener('change', () => {    if (engine.current) { engine.current.config.write('renderFilter', $('filter').value); engine.current.config.write('aspect', $('aspect').value); }});$('aspect').addEventListener('change', () => {    if (engine.current) engine.current.config.write('aspect', $('aspect').value);});$('gamepads').addEventListener('change', () => {    if (engine.current) engine.current.config.write('gamepads', $('gamepads').checked);});function bindVirtualGamepad() {    bindVirtualAction('a',    document.querySelector('[data-action="a"]'));    bindVirtualAction('b',    document.querySelector('[data-action="b"]'));    bindVirtualAction('x',    document.querySelector('[data-action="x"]'));    bindVirtualAction('y',    document.querySelector('[data-action="y"]'));    bindVirtualAction('l',    document.querySelector('[data-action="l"]'));    bindVirtualAction('r',    document.querySelector('[data-action="r"]'));    bindVirtualAction('start', document.querySelector('[data-action="start"]'));    bindVirtualAction('select', document.querySelector('[data-action="select"]'));        // D-pad directional buttons (data-dir, not data-action).        for (const dir of ['up', 'down', 'left', 'right']) {            const el = document.querySelector('[data-dir="' + dir + '"]');            if (el) bindVirtualAction(dir, el);        }    const stick = document.getElementById('thumbstick');    bindThumbstick(stick, (dir) => {        applyVirtualState({            up:    dir.y < -0.15,            down:  dir.y >  0.15,            left:  dir.x < -0.15,            right: dir.x >  0.15,        });    });}bindVirtualGamepad();    // Populate ROM select dropdown\n    ROMS.forEach((rom, i) => {
        const option = document.createElement("option");
        option.value = rom.id;
        option.textContent = rom.name;
        $("rom-select").append(option);
>>>>>>> 011aef165a900fa49fdc53c0c3cacefc2457968e
    });

    if (romSelect) {
        romSelect.addEventListener('change', (e) => {
            const id = Number(e.target.value);
            if (id) selectRom(id);
        });
    }

    const first = ROMS[0];
    currentRomId = first.id;
    selectRom(first.id);
}

async function selectRom(romId) {
    document.querySelectorAll('.rom-card').forEach((c) => {
        c.classList.toggle('selected', Number(c.dataset.romId) === romId);
    });
    const romSelect = $('rom-select');
    if (romSelect) {
        romSelect.value = romId;
    }
    currentRomId = romId;
    if (engine.current) {
        await engine.current.destroy();
        engine.current = null;
    }
    const rom = ROMS.find((r) => r.id === romId);
    if (!rom) return;
    showPlaceholder('Loading game...');
    const bytes = await fetchRomBytes(rom);
    const options = readOptions();
    try {
        engine.current = await load({
            assets: { rom: bytes },
            canvasEl: canvas,
            options: options,
            persist: 'opfs',
            storageNamespace: 'snes9x',
            onEvent: onEvent,
        });
    } catch (e) {
        showPlaceholder('Failed to load ROM: ' + e.message);
        flash('ROM load error: ' + e.message);
        return;
    }
    engine.current.setInput(VIRTUAL_KEYMAP);
    engine.current.start();
    playBtn.disabled = false;
    pauseBtn.disabled = false;
    resetBtn.disabled = false;
    screenshotBtn.disabled = false;
    $('state-name').disabled = false;
    $('save-state-confirm').disabled = false;
    $('state-list').disabled = false;
    $('load-state').disabled = false;
    $('delete-state').disabled = false;
    showPlaceholder('');
    flash('Loaded ' + rom.name);
}

async function fetchRomBytes(rom) {
    const res = await fetch('/api/roms/' + rom.id + '/stream/');
    if (!res.ok) throw new Error('ROM stream failed (' + res.status + ')');
    const buffer = await res.arrayBuffer();
    return new Uint8Array(buffer);
}

function readOptions() {
    return {
        region: $('region').value || 'auto',
        aspect: $('aspect').value || '4:3',
        renderFilter: $('filter').value || 'pixelated',
        cropOverscan: true,
        volume: parseFloat($('volume').value) || 1,
        gamepads: $('gamepads').checked,
        logLevel: 'error',
        escMenu: true,
        interpolation: 'gaussian',
    };
}

playBtn.addEventListener('click', async () => { await engine.current.start(); updatePlayPause(); });
pauseBtn.addEventListener('click', async () => { await engine.current.pause(); updatePlayPause(); });
resetBtn.addEventListener('click', async () => { if (engine.current) await engine.current.reset(); });
screenshotBtn.addEventListener('click', async () => {
    if (!engine.current) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
    const canvas = document.getElementById('snes');
    canvas.toBlob((blob) => {
        if (!blob) { flash('Screenshot failed.'); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'snes-shot.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        flash('Screenshot saved.');
    }, 'image/png');
});

function updatePlayPause() {
    const e = engine.current;
    playBtn.textContent = e && !e.paused ? 'Pause' : 'Play';
    pauseBtn.textContent = e && e.paused ? 'Play' : 'Pause';
}

async function refreshStateList() {
    const list = $('state-list');
    const keys = await store.list();
    list.innerHTML = '';
    if (!keys.length) {
        const opt = document.createElement('option');
        opt.textContent = 'No saved states';
        list.appendChild(opt);
        $('delete-state').disabled = true;
        return;
    }
    $('delete-state').disabled = false;
    keys.forEach((k) => {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = k + '  (bytes)';
        list.appendChild(opt);
    });
}

$('save-state-confirm').addEventListener('click', async () => {
    if (!engine.current) { flash('No game running.'); return; }
    const name = $('state-name').value.trim() || 'slot';
    try {
        const data = await engine.current.saveState();
        await store.save(name, data);
        $('state-name').value = '';
        await refreshStateList();
        flash('Save state stored.');
    } catch (e) { flash('Save failed: ' + e.message); }
});

$('state-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('save-state-confirm').click(); });

$('load-state').addEventListener('click', async () => {
    if (!engine.current) { flash('No game running.'); return; }
    const key = $('state-list').value;
    if (!key) { flash('Choose a state first.'); return; }
    try {
        const data = await store.get(key);
        if (!data) { flash('State not found.'); return; }
        await engine.current.loadState(data);
        flash('State loaded.');
    } catch (e) { flash('Load failed: ' + e.message); }
});

$('delete-state').addEventListener('click', async () => {
    const key = $('state-list').value;
    if (!key) { flash('Choose a state first.'); return; }
    if (!confirm('Delete this state?')) return;
    try {
        await store.remove(key);
        await refreshStateList();
        flash('Deleted.');
    } catch (e) { flash('Delete failed: ' + e.message); }
});

$('volume').addEventListener('input', () => {
    const v = parseFloat($('volume').value);
    $('volume-label').textContent = v.toFixed(2);
    if (engine.current) engine.current.config.write('volume', Math.max(0, Math.min(1, v)));
});

$('region').addEventListener('change', () => {
    if (engine.current) engine.current.reset();
});

$('filter').addEventListener('change', () => {
    if (engine.current) {
        engine.current.config.write('renderFilter', $('filter').value);
        engine.current.config.write('aspect', $('aspect').value);
    }
});

$('aspect').addEventListener('change', () => {
    if (engine.current) engine.current.config.write('aspect', $('aspect').value);
});

$('gamepads').addEventListener('change', () => {
    if (engine.current) engine.current.config.write('gamepads', $('gamepads').checked);
});

function bindVirtualGamepad() {
    bindVirtualAction('a', document.querySelector('[data-action="a"]'));
    bindVirtualAction('b', document.querySelector('[data-action="b"]'));
    bindVirtualAction('x', document.querySelector('[data-action="x"]'));
    bindVirtualAction('y', document.querySelector('[data-action="y"]'));
    bindVirtualAction('l', document.querySelector('[data-action="l"]'));
    bindVirtualAction('r', document.querySelector('[data-action="r"]'));
    bindVirtualAction('start', document.querySelector('[data-action="start"]'));
    bindVirtualAction('select', document.querySelector('[data-action="select"]'));

    for (const dir of ['up', 'down', 'left', 'right']) {
        const el = document.querySelector('[data-dir="' + dir + '"]');
        if (el) bindVirtualAction(dir, el);
    }

    const stick = document.getElementById('thumbstick');
    bindThumbstick(stick, (dir) => {
        applyVirtualState({
            up:    dir.y < -0.15,
            down:  dir.y >  0.15,
            left:  dir.x < -0.15,
            right: dir.x >  0.15,
        });
    });
}

bindVirtualGamepad();

function onEvent(e) {
    if (e.type === 'frame' && typeof e.fps === 'number') {
        fpsEl.textContent = 'FPS ' + Math.round(e.fps);
    } else if (e.type === 'ready') {
        updatePlayPause();
    } else if (e.type === 'exit') {
        flash('Session ended.');
    }
}

document.addEventListener('DOMContentLoaded', init);
