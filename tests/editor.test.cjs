const assert = require('node:assert/strict');
const { test } = require('node:test');
const { source, createContext } = require('./sandbox.cjs');

// The upstream editor shipped as a separate file that HACS never installed, and it pulled Lit
// from a CDN. Both are bundled now, so neither failure mode can come back.
test('the bundle has no runtime dependency on the network', () => {
    const imports = source.match(/^\s*import\s+[^;]*from\s+["'][^"']+["']/gm) || [];
    assert.deepEqual(imports, [], 'the shipped file must not import anything');
    const dynamic = source.match(/\bimport\(\s*["'][^"']+["']\s*\)/g) || [];
    assert.deepEqual(dynamic, [], 'the shipped file must not fetch modules at runtime');
});

test('the visual editor is registered by the card bundle', () => {
    const { elements } = createContext();
    assert.ok(elements.get('atmospheric-weather-card'), 'card element missing');
    assert.ok(elements.get('atmospheric-weather-card-editor'), 'editor element missing');
});

test('getConfigElement returns the editor without loading anything else', async () => {
    const { card, created } = createContext();
    const before = created.length;
    const element = await card.getConfigElement();
    assert.ok(element);
    assert.deepEqual(created.slice(before), ['atmospheric-weather-card-editor']);
});

test('the stub config still describes a usable card', () => {
    const { card } = createContext();
    const stub = card.getStubConfig({ states: { 'weather.home': { state: 'sunny', attributes: {} } } });
    assert.equal(stub.weather_entity, 'weather.home');
    assert.ok(Array.isArray(stub.button_areas) && stub.button_areas.length > 0);
});

test('Lit and the original editor keep their attribution', () => {
    assert.match(source, /original by shpongledsummer \(MIT\)/);
    assert.match(source, /Lit 3\.2\.1 is BSD-3-Clause, Copyright Google LLC/);
});
