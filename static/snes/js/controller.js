/* ------------------------------------------------------------------ */
/*  Virtual gamepad for the SNES emulator.                             */
/*                                                                     */
/*  The Snes9x WASM engine already handles real keyboards and gamepads */
/*  (its keydown capture listener + in-loop gamepad polling).          */
/*  To keep a single, unified control model we expose a small virtual  */
/*  gamepad whose buttons and stick dispatch *synthetic keyboard*      */
/*  events.  Those events are understood by the engine once the host   */
/*  passes them to engine.setInput().                                  */
/* ------------------------------------------------------------------ */

// Every virtual action maps to a physical KeyboardEvent.code.  This set is
// deliberately separate from the engine defaults (arrows / WASD / etc.)
// so it never collides with keyboard play on desktop.
export const VIRTUAL_KEYMAP = {
    'p1.up':      'ArrowUp',
    'p1.down':    'ArrowDown',
    'p1.left':    'ArrowLeft',
    'p1.right':   'ArrowRight',
    'p1.a':       'KeyS',
    'p1.b':       'KeyP',
    'p1.x':       'KeyC',
    'p1.y':       'KeyF',
    'p1.l':       'KeyQ',
    'p1.r':       'KeyW',
    'p1.start':   'Enter',
    'p1.select':  'ShiftRight',
};

try {
    const saved = localStorage.getItem('snes_virtual_keymap');
    if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(VIRTUAL_KEYMAP, parsed);
    }
} catch (_) {}

export function setKeyBinding(action, code) {
    VIRTUAL_KEYMAP['p1.' + action] = code;
    try {
        localStorage.setItem('snes_virtual_keymap', JSON.stringify(VIRTUAL_KEYMAP));
    } catch (_) {}
}

// ---- low-level synthetic keyboard dispatch ----------------------------

function makeKeyEvent(code, down) {
    // Only `code` matters to the engine; `key` is provided for spec-compliance.
    const key = code.replace(/^Key/, '').replace(/^Digit/, '');
    return new KeyboardEvent(down ? 'keydown' : 'keyup', {
        code: code,
        key: key,
        bubbles: true,
        cancelable: true,
    });
}

export function pressKey(code) {
    window.dispatchEvent(makeKeyEvent(code, true));
}

export function releaseKey(code) {
    window.dispatchEvent(makeKeyEvent(code, false));
}

// ---- virtual state ---------------------------------------------------

// Logical state of the virtual gamepad.  Updated by the buttons and the
// thumbstick; synced to physical keys by applyState().
export const VirtualState = {
    up: false,
    down: false,
    left: false,
    right: false,
    a: false,
    b: false,
    x: false,
    y: false,
    l: false,
    r: false,
    start: false,
    select: false,
};

// Physical keys already pushed (so a repeated press doesn't double-press).
const pressedCodes = new Set();

function syncAction(action, down) {
    const code = VIRTUAL_KEYMAP['p1.' + action];
    if (!code) return;
    if (down && !pressedCodes.has(code)) {
        pressKey(code);
        pressedCodes.add(code);
    } else if (!down && pressedCodes.has(code)) {
        releaseKey(code);
        pressedCodes.delete(code);
    }
}

/** Apply the full virtual state to the engine. Call whenever the state
 *  changes (button press, thumbstick move, keyboard, gamepad, ...). */
export function applyVirtualState(next) {
    for (const action of Object.keys(VirtualState)) {
        if (next[action] !== undefined && next[action] !== VirtualState[action]) {
            VirtualState[action] = next[action];
            syncAction(action, VirtualState[action]);
        }
    }
}

/** Set a single virtual action and apply it. */
export function setVirtual(action, value) {
    if (VirtualState[action] !== value) {
        VirtualState[action] = value;
        syncAction(action, value);
    }
}

/** Clear every virtual button (used on release / navigation). */
export function clearVirtual() {
    Object.keys(VirtualState).forEach((a) => setVirtual(a, false));
}

// ---- binding helpers -------------------------------------------------

/** Attach a touch/mouse/trackpad-capable button to an action. */
export function bindVirtualAction(action, el) {
    // pointerdown  -> press; pointerup/cancel/leave -> release
    el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        setVirtual(action, true);
        if (el.classList && typeof el.classList.add === 'function') {
            el.classList.add('blue-flash');
        }
    });
    const commitRelease = () => {
        setVirtual(action, false);
        if (el.classList && typeof el.classList.remove === 'function') {
            el.classList.remove('blue-flash');
        }
    };
    el.addEventListener('pointerup', commitRelease);
    el.addEventListener('pointercancel', commitRelease);
    el.addEventListener('pointerleave', commitRelease);
}

/** Attach an analog thumbstick (drag = direction, release = centre).
 *  onDirection receives { x, y } in the range [-1..1] (0,0 = centre). */
export function bindThumbstick(el, onDirection) {
    let active = false;
    let cx = 0.5;
    let cy = 0.5;
    const inner = el.querySelector('.inner');

    function frame(e) {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        cx = Math.max(0, Math.min(1, x));
        cy = Math.max(0, Math.min(1, y));

        let dx = cx - 0.5;
        let dy = cy - 0.5;
        // Small dead zone to avoid drifting on a soft touch.
        if (Math.abs(dx) < 0.1) dx = 0;
        if (Math.abs(dy) < 0.1) dy = 0;
        onDirection({ x: dx, y: dy });
        if (inner) {
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            inner.style.transform = `rotate(${angle}deg)`;
        }
    }

    el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        active = true;
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
        frame(e);
    });
    el.addEventListener('pointermove', (e) => { if (active) frame(e); });
    const done = () => {
        active = false;
        onDirection({ x: 0, y: 0 });
        if (inner) inner.style.transform = 'rotate(0deg)';
    };
    el.addEventListener('pointerup', done);
    el.addEventListener('pointercancel', done);
    el.addEventListener('pointerleave', done);
}

// ---- entry point ---------------------------------------------------

/** Initialize the virtual gamepad bindings for the given DOM elements.
 *  It reads the button elements by their data-action attributes. */
export function bindGamepad(selector) {
    const pad = document.querySelector(selector);
    if (!pad) return;
    pad.querySelectorAll('[data-action]').forEach((btn) => {
        const action = btn.dataset.action;
        if (action) bindVirtualAction(action, btn);
    });
}
