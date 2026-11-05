const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { source } = require('./sandbox.cjs');

const archived = name => readFileSync(resolve(__dirname, '..', 'legacy', 'v5.0', name), 'utf8');

test('the shipped editor matches the archive apart from maintained repository links', () => {
    const editor = archived('atmospheric-weather-card-editor.js');
    const withoutImport = editor.replace(/^import \{[^}]*\} from "https:\/\/esm\.sh\/lit@[^"]*";\n/m, '');
    assert.notEqual(withoutImport, editor, 'expected the original to import Lit from a CDN');
    const maintained = withoutImport.replaceAll(
        'https://github.com/shpongledsummer/atmospheric-weather-card',
        'https://github.com/semichcsc-byte/atmospheric-weather-card',
    );
    assert.ok(source.includes(maintained.trim()), 'the bundled editor diverged from the archive');
});

test('the archived original still carries its attribution', () => {
    assert.match(archived('atmospheric-weather-card-editor.js'), /ATMOSPHERIC WEATHER CARD — VISUAL EDITOR/);
});

test('the archive is documented and kept out of the HACS download', () => {
    const notes = readFileSync(resolve(__dirname, '..', 'legacy', 'README.md'), 'utf8');
    assert.match(notes, /AWC-28062026/);
    const hacs = JSON.parse(readFileSync(resolve(__dirname, '..', 'hacs.json'), 'utf8'));
    assert.equal(hacs.filename, 'atmospheric-weather-card.js', 'HACS must install the root file only');
});
