const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { source } = require('./sandbox.cjs');

const archived = name => readFileSync(resolve(__dirname, '..', 'legacy', 'v5.0', name), 'utf8');

// The archive exists so the recovered originals cannot be lost again; it is only worth keeping
// if it still matches what the card actually ships.
test('the shipped editor is byte-for-byte the archived original', () => {
    const editor = archived('atmospheric-weather-card-editor.js');
    const withoutImport = editor.replace(/^import \{[^}]*\} from "https:\/\/esm\.sh\/lit@[^"]*";\n/m, '');
    assert.notEqual(withoutImport, editor, 'expected the original to import Lit from a CDN');
    assert.ok(source.includes(withoutImport.trim()), 'the bundled editor diverged from the archive');
});

test('the archived original still carries its attribution', () => {
    assert.match(archived('atmospheric-weather-card-editor.js'), /ATMOSPHERIC WEATHER CARD — VISUAL EDITOR/);
    assert.match(archived('atmospheric-weather-card.js'), /Version: 5\.0/);
});

test('the archive is documented and kept out of the HACS download', () => {
    const notes = readFileSync(resolve(__dirname, '..', 'legacy', 'README.md'), 'utf8');
    assert.match(notes, /AWC-28062026/);
    const hacs = JSON.parse(readFileSync(resolve(__dirname, '..', 'hacs.json'), 'utf8'));
    assert.equal(hacs.filename, 'atmospheric-weather-card.js', 'HACS must install the root file only');
});
