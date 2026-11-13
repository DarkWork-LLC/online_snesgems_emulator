/* ------------------------------------------------------------------ */
/*  Unit tests for snes9x.config.js                                   */
/* ------------------------------------------------------------------ */

import { strict as assert } from 'node:assert';
import { bindConfig, createSettingsStore } from '../../static/snes/js/vendor/snes9x.config.js';
import { SNES9X_ENGINE_OPTIONS } from '../../static/snes/js/vendor/snes9x.options.js';

export async function run() {
    let passed = 0, failed = 0, results = [];
    function t(name, fn) {
        try { fn(); passed++; results.push(`  ok - ${name}`); }
        catch (e) { failed++; results.push(`  NOT ok - ${name}: ${e.message}`); }
    }

    function makeAppliers() {
        const calls = [];
        return {
            calls,
            volume: (v) => calls.push(['volume', v]),
            renderFilter: (v) => calls.push(['renderFilter', v]),
            aspect: () => calls.push(['aspect', undefined]),
            cropOverscan: () => calls.push(['cropOverscan', undefined]),
            gamepads: (v) => calls.push(['gamepads', v]),
            multitap: (v) => calls.push(['multitap', v]),
            logLevel: (v) => calls.push(['logLevel', v]),
        };
    }

    t('bindConfig supports keys with both option and applier', () => {
        const state = { volume: 1.0, renderFilter: 'pixelated' };
        const config = bindConfig(state, makeAppliers());
        assert.strictEqual(config.supports('volume'), true);
        assert.strictEqual(config.supports('renderFilter'), true);
    });
    t('bindConfig does not support keys without applier', () => {
        const state = { gamepads: true };
        const config = bindConfig(state, {});
        assert.strictEqual(config.supports('gamepads'), false);
        assert.strictEqual(config.supports('volume'), false);
    });
    t('bindConfig does not support unknown keys', () => {
        const config = bindConfig({}, makeAppliers());
        assert.strictEqual(config.supports('nonexistent'), false);
    });
    t('bindConfig read returns state value', () => {
        const state = { volume: 0.5, region: 'auto' };
        const config = bindConfig(state, makeAppliers());
        assert.strictEqual(config.read('volume'), 0.5);
        assert.strictEqual(config.read('region'), 'auto');
    });
    t('bindConfig read returns undefined for unknown option', () => {
        const config = bindConfig({}, makeAppliers());
        assert.strictEqual(config.read('nonexistent'), undefined);
    });
    t('bindConfig write coerces and applies value', () => {
        const state = { volume: 1.0 }; const appliers = makeAppliers();
        const config = bindConfig(state, appliers);
        assert.strictEqual(config.write('volume', 0.5), true);
        assert.strictEqual(state.volume, 0.5);
        assert.deepStrictEqual(appliers.calls, [['volume', 0.5]]);
    });
    t('bindConfig write returns false for unknown key', () => {
        const config = bindConfig({}, makeAppliers());
        assert.strictEqual(config.write('nonexistent', 'value'), false);
    });
    t('bindConfig write returns false when coercion fails', () => {
        const state = { volume: 1.0 }; const appliers = makeAppliers();
        const config = bindConfig(state, appliers);
        assert.strictEqual(config.write('volume', 'not-a-number'), false);
        assert.strictEqual(state.volume, 1.0);
        assert.deepStrictEqual(appliers.calls, []);
    });
    t('bindConfig write clamps out-of-range numbers', () => {
        const state = { volume: 1.0 }; const appliers = makeAppliers();
        const config = bindConfig(state, appliers);
        config.write('volume', 99);
        assert.strictEqual(state.volume, 1);
        assert.deepStrictEqual(appliers.calls, [['volume', 1]]);
    });
    t('bindConfig values returns snapshot of supported options', () => {
        const state = { volume: 0.5, renderFilter: 'pixelated', region: 'auto' };
        const config = bindConfig(state, makeAppliers());
        const vals = config.values();
        assert.strictEqual(vals.volume, 0.5);
        assert.strictEqual(vals.renderFilter, 'pixelated');
        assert.strictEqual(vals.region, undefined);
    });
    t('bindConfig restoreDefaults resets all options to defaults', () => {
        const state = { volume: 0.1, renderFilter: 'smooth', gamepads: false };
        const config = bindConfig(state, makeAppliers());
        config.restoreDefaults();
        const volOpt = SNES9X_ENGINE_OPTIONS.find((o) => o.key === 'volume');
        const rfOpt = SNES9X_ENGINE_OPTIONS.find((o) => o.key === 'renderFilter');
        const gpOpt = SNES9X_ENGINE_OPTIONS.find((o) => o.key === 'gamepads');
        assert.strictEqual(state.volume, volOpt.default);
        assert.strictEqual(state.renderFilter, rfOpt.default);
        assert.strictEqual(state.gamepads, gpOpt.default);
    });
    function makeStorage() {
        const stored = {};
        return {
            getItem(k) { return stored[k] ?? null; },
            setItem(k, v) { stored[k] = v; },
            removeItem(k) { delete stored[k]; },
            _stored: stored,
        };
    }
    t('createSettingsStore load returns {} when no localStorage', () => {
        const origLS = globalThis.localStorage;
        globalThis.localStorage = undefined;
        const store = createSettingsStore('test-ns');
        assert.deepStrictEqual(store.load(), {});
        globalThis.localStorage = origLS;
    });
    t('createSettingsStore save/load roundtrip', () => {
        const storage = makeStorage();
        const origLS = globalThis.localStorage;
        globalThis.localStorage = storage;
        const store = createSettingsStore('test-ns');
        store.save({ volume: 0.5, renderFilter: 'smooth' });
        const loaded = store.load();
        assert.strictEqual(loaded.volume, 0.5);
        assert.strictEqual(loaded.renderFilter, 'smooth');
        globalThis.localStorage = origLS;
    });
    t('createSettingsStore load handles invalid JSON gracefully', () => {
        const storage = makeStorage();
        storage._stored['snes9x:options:test-ns'] = 'not-json';
        const origLS = globalThis.localStorage;
        globalThis.localStorage = storage;
        const store = createSettingsStore('test-ns');
        assert.deepStrictEqual(store.load(), {});
        globalThis.localStorage = origLS;
    });
    t('createSettingsStore load drops unknown keys', () => {
        const storage = makeStorage();
        storage._stored['snes9x:options:test-ns'] = JSON.stringify({ volume: 0.5, unknown_key: 'foo' });
        const origLS = globalThis.localStorage;
        globalThis.localStorage = storage;
        const store = createSettingsStore('test-ns');
        const vals = store.load();
        assert.strictEqual(vals.volume, 0.5);
        assert.strictEqual(vals.unknown_key, undefined);
        globalThis.localStorage = origLS;
    });
    t('createSettingsStore load coerces stored values', () => {
        const storage = makeStorage();
        storage._stored['snes9x:options:test-ns'] = JSON.stringify({ volume: '2.0' });
        const origLS = globalThis.localStorage;
        globalThis.localStorage = storage;
        const store = createSettingsStore('test-ns');
        const vals = store.load();
        assert.strictEqual(vals.volume, 1);
        globalThis.localStorage = origLS;
    });
    t('createSettingsStore save writes JSON to storage', () => {
        const storage = makeStorage();
        const origLS = globalThis.localStorage;
        globalThis.localStorage = storage;
        const store = createSettingsStore('test-ns');
        store.save({ volume: 0.75 });
        const raw = storage._stored['snes9x:options:test-ns'];
        assert.ok(raw);
        assert.strictEqual(JSON.parse(raw).volume, 0.75);
        globalThis.localStorage = origLS;
    });
    t('createSettingsStore clear removes item from storage', () => {
        const storage = makeStorage();
        storage._stored['snes9x:options:test-ns'] = JSON.stringify({ volume: 0.5 });
        const origLS = globalThis.localStorage;
        globalThis.localStorage = storage;
        const store = createSettingsStore('test-ns');
        store.clear();
        assert.strictEqual(storage._stored['snes9x:options:test-ns'], undefined);
        globalThis.localStorage = origLS;
    });
    t('createSettingsStore storage access errors are caught', () => {
        const broken = {
            getItem() { throw new Error('unavailable'); },
            setItem() { throw new Error('unavailable'); },
            removeItem() { throw new Error('unavailable'); },
        };
        const origLS = globalThis.localStorage;
        globalThis.localStorage = broken;
        const store = createSettingsStore('test-ns');
        assert.deepStrictEqual(store.load(), {});
        assert.doesNotThrow(() => store.save({ volume: 0.5 }));
        assert.doesNotThrow(() => store.clear());
        globalThis.localStorage = origLS;
    });
    t('createSettingsStore storageKey uses namespace', () => {
        const seen = [];
        const storage = {
            getItem(k) { seen.push(k); return null; },
            setItem(k, v) { seen.push(k); },
            removeItem(k) { seen.push(k); },
        };
        const origLS = globalThis.localStorage;
        globalThis.localStorage = storage;
        const store = createSettingsStore('custom-namespace');
        store.load(); store.save({ volume: 0.5 }); store.clear();
        for (const k of seen) assert.strictEqual(k, 'snes9x:options:custom-namespace');
        globalThis.localStorage = origLS;
    });
    console.log(`config.test.mjs: ${passed} passed, ${failed} failed`);
    results.forEach((r) => console.log(r));
    return { passed, failed };
}