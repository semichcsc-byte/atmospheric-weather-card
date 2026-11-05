const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { source, createContext } = require('./sandbox.cjs');

test('the shipped links belong to the maintained repository and the icon guide exists', () => {
    assert.ok(!source.includes('https://github.com/shpongledsummer/'));
    assert.ok(source.includes('https://github.com/semichcsc-byte/atmospheric-weather-card#weather-icons'));
    const readme = readFileSync(resolve(__dirname, '..', 'README.md'), 'utf8');
    assert.match(readme, /^## Weather icons$/m);
});

test('the NonCommercial shader is absent from the shipped file and archive', () => {
    assert.doesNotMatch(source, /Heartfelt|shadertoy|CC BY-NC|DropLayer2|StaticDrops|vec3 N13/);
    assert.equal(existsSync(resolve(__dirname, '..', 'legacy', 'v5.0', 'atmospheric-weather-card.js')), false);
    const { card: Card } = createContext();
    const shader = Card.prototype._glslFragWater.call(Card.prototype);
    for (const uniform of ['u_time', 'u_resolution', 'u_dark', 'u_fx_speed', 'u_rain_intensity', 'u_lightning']) {
        assert.ok(shader.includes(uniform), `missing water uniform: ${uniform}`);
    }
    assert.match(shader, /vec3 rainLenses/);
    assert.match(shader, /fragColor = vec4\(col, 1\.0\)/);
});
