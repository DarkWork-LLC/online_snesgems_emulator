/* ------------------------------------------------------------------ */
/*  Unit tests for controller.js - Virtual gamepad logic              */
/* ------------------------------------------------------------------ */

import { strict as assert } from 'node:assert';

const dispatched = [];
globalThis.window = {
    dispatchEvent(event) {
        dispatched.push(event);
        return true;
    },
};
globalThis.KeyboardEvent = class KeyboardEvent {
    constructor(type, init = {}) {
        this.type = type; this.code = init.code; this.key = init.key;
        this.bubbles = init.bubbles === undefined ? true : init.bubbles;
        this.cancelable = init.cancelable === undefined ? true : init.cancelable;
    }
};
globalThis.document = {
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getElementById() { return null; },
};
function resetEvents() { dispatched.length = 0; }

import * as controller from '../../static/snes/js/controller.js';

export async function run() {
    let passed = 0, failed = 0, results = [];
    function t(name, fn) {
        try { fn(); passed++; results.push(`  ok - ${name}`); }
        catch (e) { failed++; results.push(`  NOT ok - ${name}: ${e.message}`); }
    }

    t('VIRTUAL_KEYMAP maps all 12 p1 actions to player-1 key codes', () => {
        assert.deepStrictEqual(controller.VIRTUAL_KEYMAP, {
            'p1.up': 'ArrowUp', 'p1.down': 'ArrowDown', 'p1.left': 'ArrowLeft',
            'p1.right': 'ArrowRight', 'p1.a': 'KeyS', 'p1.b': 'KeyX',
            'p1.x': 'KeyA', 'p1.y': 'KeyZ', 'p1.l': 'KeyQ', 'p1.r': 'KeyW',
            'p1.start': 'Enter', 'p1.select': 'ShiftRight',
        });
    });
    t('VIRTUAL_KEYMAP does not collide with player-2 key codes', () => {
        const p2 = ['KeyI','KeyL','KeyH','KeyG','KeyB','KeyT','KeyY','Digit2','Digit1'];
        for (const code of Object.values(controller.VIRTUAL_KEYMAP)) {
            assert.ok(!p2.includes(code), `${code} should not be a player-2 code`);
        }
    });

    t('pressKey dispatches keydown with correct code', () => {
        resetEvents(); controller.pressKey('KeyS');
        assert.strictEqual(dispatched.length, 1);
        assert.strictEqual(dispatched[0].type, 'keydown');
        assert.strictEqual(dispatched[0].code, 'KeyS');
        assert.strictEqual(dispatched[0].key, 'S');
    });
    t('pressKey dispatches keydown for Arrow keys', () => {
        resetEvents(); controller.pressKey('ArrowUp');
        assert.strictEqual(dispatched[0].type, 'keydown');
        assert.strictEqual(dispatched[0].code, 'ArrowUp');
        assert.strictEqual(dispatched[0].key, 'ArrowUp');
    });
    t('pressKey dispatches keydown for Enter', () => {
        resetEvents(); controller.pressKey('Enter');
        assert.strictEqual(dispatched[0].type, 'keydown');
        assert.strictEqual(dispatched[0].code, 'Enter');
        assert.strictEqual(dispatched[0].key, 'Enter');
    });
    t('pressKey dispatches keydown for ShiftRight', () => {
        resetEvents(); controller.pressKey('ShiftRight');
        assert.strictEqual(dispatched[0].type, 'keydown');
        assert.strictEqual(dispatched[0].code, 'ShiftRight');
        assert.strictEqual(dispatched[0].key, 'ShiftRight');
    });
    t('releaseKey dispatches keyup with correct code', () => {
        resetEvents(); controller.releaseKey('KeyS');
        assert.strictEqual(dispatched[0].type, 'keyup');
        assert.strictEqual(dispatched[0].code, 'KeyS');
    });
    t('pressKey and releaseKey events are cancelable and bubbling', () => {
        resetEvents(); controller.pressKey('KeyA');
        const e = dispatched[0];
        assert.strictEqual(e.bubbles, true);
        assert.strictEqual(e.cancelable, true);
    });
    t('VirtualState initializes all 13 actions to false', () => {
        assert.deepStrictEqual(controller.VirtualState, {
            up: false, down: false, left: false, right: false,
            a: false, b: false, x: false, y: false,
            l: false, r: false, start: false, select: false,
        });
    });
    t('applyVirtualState sets a single action and dispatches keydown', () => {
        resetEvents(); controller.VirtualState.up = false;
        controller.applyVirtualState({ up: true });
        assert.strictEqual(controller.VirtualState.up, true);
        assert.strictEqual(dispatched.length, 1);
        assert.strictEqual(dispatched[0].type, 'keydown');
        assert.strictEqual(dispatched[0].code, 'ArrowUp');
    });
    t('applyVirtualState releases a key when action goes false', () => {
        resetEvents();
        controller.setVirtual('down', true); // populates pressedCodes properly
        resetEvents(); // clear the press event
        controller.applyVirtualState({ down: false });
        assert.strictEqual(controller.VirtualState.down, false);
        assert.strictEqual(dispatched.length, 1);
        assert.strictEqual(dispatched[0].type, 'keyup');
        assert.strictEqual(dispatched[0].code, 'ArrowDown');
    });
    t('applyVirtualState ignores undefined values', () => {
        resetEvents();
        const before = { ...controller.VirtualState };
        controller.applyVirtualState({ up: undefined, down: undefined });
        assert.deepStrictEqual(controller.VirtualState, before);
        assert.strictEqual(dispatched.length, 0);
    });
    t('applyVirtualState is a no-op when value does not change', () => {
        resetEvents(); controller.VirtualState.left = true;
        controller.applyVirtualState({ left: true });
        assert.strictEqual(dispatched.length, 0);
    });
    t('applyVirtualState processes multiple actions at once', () => {
        resetEvents();
        controller.VirtualState.a = false; controller.VirtualState.b = false;
        controller.applyVirtualState({ a: true, b: true, right: true });
        assert.strictEqual(controller.VirtualState.a, true);
        assert.strictEqual(controller.VirtualState.b, true);
        assert.strictEqual(controller.VirtualState.right, true);
        assert.strictEqual(dispatched.length, 3);
        assert.strictEqual(dispatched[0].code, 'ArrowRight');
        assert.strictEqual(dispatched[1].code, 'KeyS');
        assert.strictEqual(dispatched[2].code, 'KeyX');
    });
    t('setVirtual changes state and dispatches', () => {
        resetEvents(); controller.setVirtual('r', true);
        assert.strictEqual(controller.VirtualState.r, true);
        assert.strictEqual(dispatched.length, 1);
        assert.strictEqual(dispatched[0].code, 'KeyW');
    });
    t('setVirtual is a no-op when value is unchanged', () => {
        resetEvents(); controller.VirtualState.select = true;
        controller.setVirtual('select', true);
        assert.strictEqual(dispatched.length, 0);
    });
    t('setVirtual with unknown action does nothing', () => {
        resetEvents(); controller.setVirtual('nonexistent', true);
        assert.strictEqual(dispatched.length, 0);
    });
    t('clearVirtual resets all actions to false and dispatches keyups', () => {
        // Reset ALL VirtualState keys to ensure no stale state from previous tests
        for (const k of Object.keys(controller.VirtualState)) {
            controller.setVirtual(k, false);
        }
        // Now set exactly 3 keys via setVirtual (properly populates pressedCodes)
        resetEvents();
        controller.setVirtual('up', true);
        controller.setVirtual('a', true);
        controller.setVirtual('start', true);
        resetEvents();
        controller.clearVirtual();
        assert.strictEqual(controller.VirtualState.up, false);
        assert.strictEqual(controller.VirtualState.a, false);
        assert.strictEqual(controller.VirtualState.start, false);
        const keyups = dispatched.filter((e) => e.type === 'keyup');
        assert.strictEqual(keyups.length, 3);
    });
    t('bindVirtualAction pointerdown sets action true', () => {
        resetEvents();
        const el = { addEventListener(type, handler) {
            el._listeners = el._listeners || {}; el._listeners[type] = handler;
        }};
        controller.bindVirtualAction('y', el);
        el._listeners.pointerdown({ preventDefault() {} });
        assert.strictEqual(controller.VirtualState.y, true);
        assert.strictEqual(dispatched.length, 1);
        assert.strictEqual(dispatched[0].code, 'KeyZ');
    });
    t('bindVirtualAction pointerup sets action false', () => {
        resetEvents();
        const el = { addEventListener(type, handler) {
            el._listeners = el._listeners || {}; el._listeners[type] = handler;
        }};
        controller.bindVirtualAction('x', el);
        el._listeners.pointerdown({ preventDefault() {} });
        assert.strictEqual(controller.VirtualState.x, true);
        resetEvents(); el._listeners.pointerup({});
        assert.strictEqual(controller.VirtualState.x, false);
        assert.strictEqual(dispatched.length, 1);
        assert.strictEqual(dispatched[0].type, 'keyup');
    });
    t('bindVirtualAction pointercancel sets action false', () => {
        const el = { addEventListener(type, handler) {
            el._listeners = el._listeners || {}; el._listeners[type] = handler;
        }};
        controller.bindVirtualAction('l', el);
        el._listeners.pointerdown({ preventDefault() {} });
        assert.strictEqual(controller.VirtualState.l, true);
        el._listeners.pointercancel({});
        assert.strictEqual(controller.VirtualState.l, false);
    });
    t('bindVirtualAction pointerleave sets action false', () => {
        const el = { addEventListener(type, handler) {
            el._listeners = el._listeners || {}; el._listeners[type] = handler;
        }};
        controller.bindVirtualAction('r', el);
        el._listeners.pointerdown({ preventDefault() {} });
        assert.strictEqual(controller.VirtualState.r, true);
        el._listeners.pointerleave({});
        assert.strictEqual(controller.VirtualState.r, false);
    });
    t('bindVirtualAction calls preventDefault on pointerdown', () => {
        let prevented = false;
        const el = { addEventListener(type, handler) {
            el._listeners = el._listeners || {}; el._listeners[type] = handler;
        }};
        controller.bindVirtualAction('b', el);
        el._listeners.pointerdown({ preventDefault() { prevented = true; } });
        assert.strictEqual(prevented, true);
    });
    function makeThumbstick(innerPresent = true) {
        const rect = { left: 0, top: 0, width: 100, height: 100 };
        const el = {
            querySelector() { return innerPresent ? { style: { transform: '' } } : null; },
            getBoundingClientRect() { return rect; },
            addEventListener(type, handler) {
                el._listeners = el._listeners || {}; el._listeners[type] = handler;
            },
        };
        return el;
    }
    t('bindThumbstick pointerdown at center yields {0,0}', () => {
        let lastDir = null; const el = makeThumbstick();
        controller.bindThumbstick(el, (dir) => { lastDir = dir; });
        el._listeners.pointerdown({ clientX: 50, clientY: 50, pointerId: 1, preventDefault() {} });
        assert.deepStrictEqual(lastDir, { x: 0, y: 0 });
    });
    t('bindThumbstick pointermove up yields negative y', () => {
        let lastDir = null; const el = makeThumbstick();
        controller.bindThumbstick(el, (dir) => { lastDir = dir; });
        el._listeners.pointerdown({ clientX: 50, clientY: 10, pointerId: 1, preventDefault() {} });
        el._listeners.pointermove({ clientX: 50, clientY: 10, pointerId: 1, preventDefault() {} });
        assert.ok(lastDir.y < -0.15, `expected up, got ${JSON.stringify(lastDir)}`);
    });
    t('bindThumbstick pointermove down yields positive y', () => {
        let lastDir = null; const el = makeThumbstick();
        controller.bindThumbstick(el, (dir) => { lastDir = dir; });
        el._listeners.pointerdown({ clientX: 50, clientY: 90, pointerId: 1, preventDefault() {} });
        el._listeners.pointermove({ clientX: 50, clientY: 90, pointerId: 1, preventDefault() {} });
        assert.ok(lastDir.y > 0.15, `expected down, got ${JSON.stringify(lastDir)}`);
    });
    t('bindThumbstick pointermove left yields negative x', () => {
        let lastDir = null; const el = makeThumbstick();
        controller.bindThumbstick(el, (dir) => { lastDir = dir; });
        el._listeners.pointerdown({ clientX: 10, clientY: 50, pointerId: 1, preventDefault() {} });
        el._listeners.pointermove({ clientX: 10, clientY: 50, pointerId: 1, preventDefault() {} });
        assert.ok(lastDir.x < -0.15, `expected left, got ${JSON.stringify(lastDir)}`);
    });
    t('bindThumbstick pointermove right yields positive x', () => {
        let lastDir = null; const el = makeThumbstick();
        controller.bindThumbstick(el, (dir) => { lastDir = dir; });
        el._listeners.pointerdown({ clientX: 90, clientY: 50, pointerId: 1, preventDefault() {} });
        el._listeners.pointermove({ clientX: 90, clientY: 50, pointerId: 1, preventDefault() {} });
        assert.ok(lastDir.x > 0.15, `expected right, got ${JSON.stringify(lastDir)}`);
    });
    t('bindThumbstick pointerup yields {0,0}', () => {
        let lastDir = { x: 1, y: 1 }; const el = makeThumbstick();
        controller.bindThumbstick(el, (dir) => { lastDir = dir; });
        el._listeners.pointerdown({ clientX: 90, clientY: 50, pointerId: 1, preventDefault() {} });
        el._listeners.pointerup({});
        assert.deepStrictEqual(lastDir, { x: 0, y: 0 });
    });
    t('bindThumbstick pointercancel yields {0,0}', () => {
        let lastDir = { x: 1, y: 1 }; const el = makeThumbstick();
        controller.bindThumbstick(el, (dir) => { lastDir = dir; });
        el._listeners.pointerdown({ clientX: 90, clientY: 50, pointerId: 1, preventDefault() {} });
        el._listeners.pointercancel({});
        assert.deepStrictEqual(lastDir, { x: 0, y: 0 });
    });
    t('bindThumbstick pointerleave yields {0,0}', () => {
        let lastDir = { x: 1, y: 1 }; const el = makeThumbstick();
        controller.bindThumbstick(el, (dir) => { lastDir = dir; });
        el._listeners.pointerdown({ clientX: 90, clientY: 50, pointerId: 1, preventDefault() {} });
        el._listeners.pointerleave({});
        assert.deepStrictEqual(lastDir, { x: 0, y: 0 });
    });
    t('bindThumbstick clamps coordinates to [0, 1]', () => {
        let lastDir = null; const el = makeThumbstick();
        controller.bindThumbstick(el, (dir) => { lastDir = dir; });
        el._listeners.pointerdown({ clientX: -999, clientY: -999, pointerId: 1, preventDefault() {} });
        el._listeners.pointermove({ clientX: -999, clientY: -999, pointerId: 1, preventDefault() {} });
        assert.ok(lastDir.x < 0); assert.ok(lastDir.y < 0);
        el._listeners.pointerdown({ clientX: 9999, clientY: 9999, pointerId: 1, preventDefault() {} });
        el._listeners.pointermove({ clientX: 9999, clientY: 9999, pointerId: 1, preventDefault() {} });
        assert.ok(lastDir.x > 0); assert.ok(lastDir.y > 0);
    });
    t('bindThumbstick handles missing inner element gracefully', () => {
        let called = false; const el = makeThumbstick(false);
        controller.bindThumbstick(el, () => { called = true; });
        el._listeners.pointerdown({ clientX: 50, clientY: 50, pointerId: 1, preventDefault() {} });
        assert.strictEqual(called, true);
    });
    t('bindGamepad returns early when selector matches nothing', () => {
        const orig = globalThis.document.querySelector;
        globalThis.document.querySelector = () => null;
        assert.doesNotThrow(() => controller.bindGamepad('.nonexistent'));
        globalThis.document.querySelector = orig;
    });
    t('bindGamepad binds all buttons with data-action', () => {
        const listeners = {};
        function makeBtn(action) {
            return {
                dataset: { action },
                addEventListener(type, handler) {
                    listeners[type] = (listeners[type] || 0) + 1;
                },
            };
        }
        const btnA = makeBtn('a');
        const btnB = makeBtn('b');
        const btnStart = makeBtn('start');
        const pad = { querySelectorAll() { return [btnA, btnB, btnStart]; } };
        const orig = globalThis.document.querySelector;
        globalThis.document.querySelector = () => pad;
        controller.bindGamepad('.gamepad');
        globalThis.document.querySelector = orig;
        // bindVirtualAction attaches 4 listeners per button (pointerdown, up, cancel, leave)
        assert.strictEqual(listeners.pointerdown, 3);
        assert.strictEqual(listeners.pointerup, 3);
        assert.strictEqual(listeners.pointercancel, 3);
        assert.strictEqual(listeners.pointerleave, 3);
    });
    t('bindGamepad skips buttons without data-action', () => {
        const listeners = {};
        function makeBtn(action) {
            return {
                dataset: action ? { action } : {},
                addEventListener(type, handler) {
                    listeners[type] = (listeners[type] || 0) + 1;
                },
            };
        }
        const btnNoAction = makeBtn(null);
        const btnA = makeBtn('a');
        const pad = { querySelectorAll() { return [btnNoAction, btnA]; } };
        const orig = globalThis.document.querySelector;
        globalThis.document.querySelector = () => pad;
        controller.bindGamepad('.gamepad');
        globalThis.document.querySelector = orig;
        // Only the button with data-action gets listeners (4 per button)
        assert.strictEqual(listeners.pointerdown, 1);
        assert.strictEqual(listeners.pointerup, 1);
        assert.strictEqual(listeners.pointercancel, 1);
        assert.strictEqual(listeners.pointerleave, 1);
    });

    for (const k of Object.keys(controller.VirtualState)) {
        controller.VirtualState[k] = false;
    }
    console.log(`controller.test.mjs: ${passed} passed, ${failed} failed`);
    results.forEach((r) => console.log(r));
    return { passed, failed };
}