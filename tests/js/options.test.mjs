/* ------------------------------------------------------------------ */
/*  Unit tests for snes9x.options.js                                  */
/* ------------------------------------------------------------------ */

import { strict as assert } from 'node:assert';
import {
    DEFAULT_SNES9X_OPTIONS, SNES9X_REGION_IDS, SNES9X_INTERPOLATION_IDS,
    SNES9X_LOG_LEVEL_IDS, SNES9X_ENGINE_OPTIONS, snes9xOption,
    coerceOptionValue, SNES9X_OPTIONS_SCHEMA,
} from '../../snes/static/snes/js/vendor/snes9x.options.js';

export async function run() {
    let passed = 0, failed = 0, results = [];
    function t(name, fn) {
        try { fn(); passed++; results.push(`  ok - ${name}`); }
        catch (e) { failed++; results.push(`  NOT ok - ${name}: ${e.message}`); }
    }

    t('DEFAULT_SNES9X_OPTIONS has all expected keys', () => {
        const keys = ['region','interpolation','renderFilter','cropOverscan',
            'aspect','multitap','maxSpriteTilesPerLine','superFXClockMultiplier',
            'volume','gamepads','logLevel'];
        for (const k of keys) assert.ok(k in DEFAULT_SNES9X_OPTIONS, `missing: ${k}`);
    });
    t('DEFAULT_SNES9X_OPTIONS has correct default values', () => {
        assert.strictEqual(DEFAULT_SNES9X_OPTIONS.region, 'auto');
        assert.strictEqual(DEFAULT_SNES9X_OPTIONS.interpolation, 'gaussian');
        assert.strictEqual(DEFAULT_SNES9X_OPTIONS.renderFilter, 'pixelated');
        assert.strictEqual(DEFAULT_SNES9X_OPTIONS.cropOverscan, true);
        assert.strictEqual(DEFAULT_SNES9X_OPTIONS.aspect, '4:3');
        assert.strictEqual(DEFAULT_SNES9X_OPTIONS.multitap, false);
        assert.strictEqual(DEFAULT_SNES9X_OPTIONS.maxSpriteTilesPerLine, 34);
        assert.strictEqual(DEFAULT_SNES9X_OPTIONS.superFXClockMultiplier, 100);
        assert.strictEqual(DEFAULT_SNES9X_OPTIONS.volume, 1.0);
        assert.strictEqual(DEFAULT_SNES9X_OPTIONS.gamepads, true);
        assert.strictEqual(DEFAULT_SNES9X_OPTIONS.logLevel, 'error');
    });
    t('SNES9X_REGION_IDS maps regions to numeric ids', () => {
        assert.strictEqual(SNES9X_REGION_IDS.auto, 0);
        assert.strictEqual(SNES9X_REGION_IDS.ntsc, 1);
        assert.strictEqual(SNES9X_REGION_IDS.pal, 2);
    });
    t('SNES9X_INTERPOLATION_IDS maps modes to numeric ids', () => {
        assert.strictEqual(SNES9X_INTERPOLATION_IDS.none, 0);
        assert.strictEqual(SNES9X_INTERPOLATION_IDS.linear, 1);
        assert.strictEqual(SNES9X_INTERPOLATION_IDS.gaussian, 2);
        assert.strictEqual(SNES9X_INTERPOLATION_IDS.cubic, 3);
        assert.strictEqual(SNES9X_INTERPOLATION_IDS.sinc, 4);
    });
    t('SNES9X_LOG_LEVEL_IDS maps levels to numeric ids', () => {
        assert.strictEqual(SNES9X_LOG_LEVEL_IDS.off, 0);
        assert.strictEqual(SNES9X_LOG_LEVEL_IDS.error, 1);
        assert.strictEqual(SNES9X_LOG_LEVEL_IDS.debug, 2);
    });
    t('SNES9X_ENGINE_OPTIONS is a flat array of all option definitions', () => {
        assert.ok(Array.isArray(SNES9X_ENGINE_OPTIONS));
        assert.ok(SNES9X_ENGINE_OPTIONS.length > 0);
        for (const opt of SNES9X_ENGINE_OPTIONS) {
            assert.ok(opt.key); assert.ok(opt.type); assert.ok('default' in opt);
        }
    });
    t('SNES9X_ENGINE_OPTIONS contains expected keys', () => {
        const keys = SNES9X_ENGINE_OPTIONS.map((o) => o.key);
        for (const k of ['region','volume','renderFilter','aspect','gamepads',
             'logLevel','interpolation','cropOverscan','multitap']) {
            assert.ok(keys.includes(k), `missing: ${k}`);
        }
    });
    t('snes9xOption returns option for known key', () => {
        const opt = snes9xOption('volume');
        assert.ok(opt); assert.strictEqual(opt.key, 'volume');
        assert.strictEqual(opt.type, 'number');
    });
    t('snes9xOption returns undefined for unknown key', () => {
        assert.strictEqual(snes9xOption('nonexistent'), undefined);
    });
    const boolOpt = { type: 'boolean', default: true };
    t('coerceOptionValue boolean accepts true', () => {
        assert.strictEqual(coerceOptionValue(boolOpt, true), true);
    });
    t('coerceOptionValue boolean accepts false', () => {
        assert.strictEqual(coerceOptionValue(boolOpt, false), false);
    });
    t('coerceOptionValue boolean rejects non-boolean', () => {
        assert.strictEqual(coerceOptionValue(boolOpt, 'true'), undefined);
        assert.strictEqual(coerceOptionValue(boolOpt, 1), undefined);
        assert.strictEqual(coerceOptionValue(boolOpt, 0), undefined);
        assert.strictEqual(coerceOptionValue(boolOpt, null), undefined);
    });
    const enumOpt = {
        type: 'enum', default: 'pixelated',
        values: [ { value: 'pixelated', label: 'Pixelated' },
                  { value: 'smooth', label: 'Smooth' } ],
    };
    t('coerceOptionValue enum accepts valid values', () => {
        assert.strictEqual(coerceOptionValue(enumOpt, 'pixelated'), 'pixelated');
        assert.strictEqual(coerceOptionValue(enumOpt, 'smooth'), 'smooth');
    });
    t('coerceOptionValue enum rejects invalid values', () => {
        assert.strictEqual(coerceOptionValue(enumOpt, 'invalid'), undefined);
        assert.strictEqual(coerceOptionValue(enumOpt, null), undefined);
        assert.strictEqual(coerceOptionValue(enumOpt, 42), undefined);
    });
    const numOpt = { type: 'number', default: 1.0, range: { minimum: 0, maximum: 1 } };
    t('coerceOptionValue number accepts in-range values', () => {
        assert.strictEqual(coerceOptionValue(numOpt, 0), 0);
        assert.strictEqual(coerceOptionValue(numOpt, 0.5), 0.5);
        assert.strictEqual(coerceOptionValue(numOpt, 1), 1);
    });
    t('coerceOptionValue number clamps above maximum', () => {
        assert.strictEqual(coerceOptionValue(numOpt, 2), 1);
        assert.strictEqual(coerceOptionValue(numOpt, 1.5), 1);
    });
    t('coerceOptionValue number clamps below minimum', () => {
        assert.strictEqual(coerceOptionValue(numOpt, -1), 0);
        assert.strictEqual(coerceOptionValue(numOpt, -0.5), 0);
    });
    t('coerceOptionValue number accepts numeric strings', () => {
        assert.strictEqual(coerceOptionValue(numOpt, '0.5'), 0.5);
    });
    t('coerceOptionValue number rejects NaN and Infinity', () => {
        assert.strictEqual(coerceOptionValue(numOpt, NaN), undefined);
        assert.strictEqual(coerceOptionValue(numOpt, Infinity), undefined);
        assert.strictEqual(coerceOptionValue(numOpt, 'abc'), undefined);
        assert.strictEqual(coerceOptionValue(numOpt, null), 0); // Number(null) === 0
    });
    const numNoRange = { type: 'number', default: 100,
        values: [ { value: 100, label: '100%' } ] };
    t('coerceOptionValue number without range checks against values', () => {
        assert.strictEqual(coerceOptionValue(numNoRange, 100), 100);
        assert.strictEqual(coerceOptionValue(numNoRange, 50), undefined);
    });
    console.log(`options.test.mjs: ${passed} passed, ${failed} failed`);
    results.forEach((r) => console.log(r));
    return { passed, failed };
}