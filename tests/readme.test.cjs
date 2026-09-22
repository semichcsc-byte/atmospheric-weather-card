const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { source } = require('./sandbox.cjs');

const readme = readFileSync(require.resolve('../README.md'), 'utf8');

// Option names live in the first column of the reference tables, as `code` spans.
function documentedOptions() {
    const names = new Set();
    for (const line of readme.split('\n')) {
        if (!line.startsWith('| `')) continue;
        const firstColumn = line.split('|')[1];
        for (const [, name] of firstColumn.matchAll(/`([a-z][a-z0-9_]+)`/g)) names.add(name);
    }
    return [...names];
}

test('the README documents a meaningful number of options', () => {
    assert.ok(documentedOptions().length > 80, 'the option reference looks truncated');
});

// Catches documentation drift, such as documenting `entity` when the card reads `weather_entity`.
test('every documented option is read by the card', () => {
    const missing = documentedOptions().filter(name => !new RegExp(`\\b${name}\\b`).test(source));
    assert.deepEqual(missing, [], `options documented but never read: ${missing.join(', ')}`);
});

test('the YAML examples configure the card, not a v4 layout', () => {
    const blocks = [...readme.matchAll(/```yaml\n([\s\S]*?)```/g)].map(m => m[1]);
    assert.ok(blocks.length >= 3, 'expected the usage and example configurations');
    const joined = blocks.join('\n');
    assert.match(joined, /weather_entity:/);
    assert.match(joined, /button_areas:/);
    for (const legacy of ['chips:', 'card_style:', 'chip_area_position:', 'perf_mode:']) {
        assert.ok(!joined.includes(legacy), `v4 option in an example: ${legacy}`);
    }
});
