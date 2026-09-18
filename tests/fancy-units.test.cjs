const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');

// Load the shipped card without a browser or Home Assistant installation.
const source = readFileSync(require.resolve('../atmospheric-weather-card.js'), 'utf8');
const elements = new Map();
vm.runInNewContext(source, {
    HTMLElement: class {},
    customElements: { get: name => elements.get(name), define: (name, element) => elements.set(name, element) },
    window: {},
    console: { info() {} },
});
const Card = elements.get('atmospheric-weather-card');

function fixture() {
    const card = Object.create(Card.prototype);
    card._numFmt = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
    card._fcData = new Map([['weather.home|daily', { processed: [{
        condition: 'sunny', temperature: 30, templow: 20.5, humidity: 0,
        datetime: '2026-09-18T12:00:00Z',
    }] }]]);
    const hass = {
        states: {
            'weather.home': { state: 'sunny', attributes: { temperature: 30, temperature_unit: '°C' } },
            'sensor.low': { state: '20.5', attributes: { unit_of_measurement: '°C' } },
        },
        localize: key => key.endsWith('.sunny') ? 'Sonnig' : '',
    };
    const button = { entity: 'weather.home', forecast: 'daily', attribute: 'temperature',
        sub_value_attribute: 'templow', forecast_precision: 1, fancy_unit: true, hide_icon: true };
    const render = (overrides = {}) => card._renderButton(
        { ...button, ...overrides }, 0, hass, 'sunny', 'de-DE', false, 'theme', 'stacked', 0, {},
    );
    return { card, hass, render };
}

const fancy = (value, unit) => `${value}<span class="fancy-unit">${unit}</span>`;

function nativeDisplay(hass, method, parts) {
    hass[method] = () => parts.map(part => part.value).join('');
    hass[`${method}ToParts`] = () => parts;
}

function numericParts(value, unit) {
    return [{ type: 'value', value }, { type: 'literal', value: ' ' }, { type: 'unit', value: unit }];
}

for (const style of ['default', 'stacked', 'vertical']) {
    test(`forecast sub-value uses fancy units in ${style} layout`, () => {
        const { render } = fixture();
        const { html } = render({ style });
        assert.ok(html.includes(fancy('30', '°C')));
        assert.ok(html.includes(`<span class="button-sub">${fancy('20,5', '°C')}</span>`));
    });
}

for (const fancy_unit of [false, undefined]) {
    test(`plain rendering is preserved with fancy_unit=${fancy_unit}`, () => {
        const { render } = fixture();
        const { html } = render({ fancy_unit });
        assert.ok(html.includes('<span class="button-sub">20,5 °C</span>'));
        assert.ok(!html.includes('class="fancy-unit"'));
    });
}

test('custom sub-value units are styled, independently of main units', () => {
    const { render } = fixture();
    const { html } = render({ unit_format: ' main', sub_value_format: ' low' });
    assert.ok(html.includes(fancy('30', ' main')));
    assert.ok(html.includes(fancy('20,5', ' low')));
});

test('an empty sub-value format hides the unit without an empty span', () => {
    const { render } = fixture();
    assert.ok(render({ sub_value_format: '' }).html.includes('<span class="button-sub">20,5</span>'));
});

test('zero and fallback percent units are preserved', () => {
    const { render } = fixture();
    assert.ok(render({ sub_value_attribute: 'humidity' }).html.includes(fancy('0', '%')));
});

test('localized text and missing forecast attributes have no fabricated unit', () => {
    const { render } = fixture();
    assert.ok(render({ sub_value_attribute: 'condition' }).html.includes('<span class="button-sub">Sonnig</span>'));
    assert.ok(!render({ sub_value_attribute: 'missing' }).html.includes('class="button-sub"'));
});

for (const nativeFormatting of [false, true]) {
    test(`sensor sub-value supports fancy units (HA formatting: ${nativeFormatting})`, () => {
        const { hass, render } = fixture();
        if (nativeFormatting) nativeDisplay(hass, 'formatEntityState', numericParts('20,5', '°C'));
        const { html } = render({ sub_value_entity: 'sensor.low', sub_value_attribute: undefined });
        assert.ok(html.includes(`<span class="button-sub">${fancy(nativeFormatting ? '20,5 ' : '20,5', '°C')}</span>`));
    });
}

test('HA-formatted attributes use native value parts without duplicating units', () => {
    const { hass, render } = fixture();
    nativeDisplay(hass, 'formatEntityAttributeValue', numericParts('30', '°C'));
    const overrides = { sub_value_entity: 'weather.home', sub_value_attribute: 'temperature' };
    assert.ok(render(overrides).html.includes(`<span class="button-sub">${fancy('30 ', '°C')}</span>`));
    assert.ok(render({ ...overrides, sub_value_format: ' degrees' }).html.includes(fancy('30', ' degrees')));
    assert.ok(render({ ...overrides, sub_value_format: '' }).html.includes('<span class="button-sub">30</span>'));
});

test('weather attribute units also work without HA formatters', () => {
    const { hass, render } = fixture();
    hass.states['weather.home'].attributes.wind_speed = 12;
    hass.states['weather.home'].attributes.wind_speed_unit = 'km/h';
    assert.ok(render({ sub_value_entity: 'weather.home', sub_value_attribute: 'wind_speed' }).html.includes(fancy('12', 'km/h')));
});

test('unavailable, missing and nonnumeric sensors do not become NaN', () => {
    const { hass, render } = fixture();
    hass.states['sensor.low'].state = 'unavailable';
    hass.formatEntityState = () => 'Nicht verfügbar';
    const overrides = { sub_value_entity: 'sensor.low', sub_value_attribute: undefined };
    assert.ok(render(overrides).html.includes('<span class="button-sub">Nicht verfügbar</span>'));
    delete hass.states['sensor.low'];
    assert.ok(render(overrides).html.includes('<span class="button-sub">N/A</span>'));
});

test('marquee, hidden main value and custom text order retain fancy sub-values', () => {
    const { render } = fixture();
    const { html } = render({ sub_value_overflow: 'marquee', hide_value: true, text_order: 'label,sub,value' });
    assert.ok(html.includes('class="button-sub awc-marquee-host"'));
    assert.ok(html.includes(`<span class="awc-marquee-text">${fancy('20,5', '°C')}</span>`));
    assert.ok(!html.includes('class="button-val'));
});

test('hiding the sub-value suppresses it and toggling fancy units changes the render signature', () => {
    const { render } = fixture();
    assert.ok(!render({ hide_sub_value: true }).html.includes('class="button-sub'));
    assert.notEqual(render().sig, render({ fancy_unit: false }).sig);
});

test('both fancy-unit CSS rules also style sub-values', () => {
    assert.match(source, /\.button-val \.fancy-unit,\s*\.button-sub \.fancy-unit\s*\{/);
    assert.match(source, /\.button \.button-val \.fancy-unit,\s*\.button \.button-sub \.fancy-unit\s*\{/);
});

for (const display of ['1.23', '1,2300', '1.234,5678', '١٫٢٣', '0,00', '−1,230']) {
    test(`native sensor precision and localization survive fancy units: ${display}`, () => {
        const { hass, render } = fixture();
        hass.states['sensor.low'].state = '1.2300';
        nativeDisplay(hass, 'formatEntityState', numericParts(display, '°C'));
        const overrides = { sub_value_entity: 'sensor.low', sub_value_attribute: undefined };
        assert.ok(render(overrides).html.includes(`<span class="button-sub">${fancy(`${display} `, '°C')}</span>`));
        assert.ok(render({ ...overrides, sub_value_format: ' degrees' }).html.includes(fancy(display, ' degrees')));
        assert.ok(render({ ...overrides, sub_value_format: '' }).html.includes(`<span class="button-sub">${display}</span>`));
        assert.ok(render({ ...overrides, fancy_unit: false }).html.includes(`<span class="button-sub">${display} °C</span>`));
    });
}

test('climate attribute uses the unit and precision supplied by HA, not metadata', () => {
    const { hass, render } = fixture();
    hass.states['climate.room'] = { state: 'heat', attributes: { current_temperature: 21.23 } };
    nativeDisplay(hass, 'formatEntityAttributeValue', numericParts('21,23', '°C'));
    const overrides = { sub_value_entity: 'climate.room', sub_value_attribute: 'current_temperature' };
    assert.ok(render(overrides).html.includes(`<span class="button-sub">${fancy('21,23 ', '°C')}</span>`));
    assert.ok(render({ ...overrides, sub_value_format: '' }).html.includes('<span class="button-sub">21,23</span>'));
});

test('currency prefix, sign and bidi literals retain their native order', () => {
    const { hass, render } = fixture();
    nativeDisplay(hass, 'formatEntityState', [
        { type: 'literal', value: '\u200e' }, { type: 'value', value: '-' },
        { type: 'unit', value: '$' }, { type: 'value', value: '12.00' },
    ]);
    const overrides = { sub_value_entity: 'sensor.low', sub_value_attribute: undefined };
    assert.ok(render(overrides).html.includes('<span class="button-sub">\u200e-<span class="fancy-unit">$</span>12.00</span>'));
});

test('a unitless native number keeps trailing zeros and gets no fabricated unit', () => {
    const { hass, render } = fixture();
    nativeDisplay(hass, 'formatEntityState', [{ type: 'value', value: '1,2300' }]);
    assert.ok(render({ sub_value_entity: 'sensor.low', sub_value_attribute: undefined }).html.includes('<span class="button-sub">1,2300</span>'));
});

for (const attribute of [undefined, 'current_temperature']) {
    test(`older HA without parts API preserves complete text (attribute: ${attribute})`, () => {
        const { hass, render } = fixture();
        const method = attribute ? 'formatEntityAttributeValue' : 'formatEntityState';
        hass[method] = () => '21,2300 °C';
        hass.states['sensor.low'].attributes.current_temperature = 21.23;
        const overrides = { sub_value_entity: 'sensor.low', sub_value_attribute: attribute };
        for (const sub_value_format of [undefined, '', ' degrees']) {
            assert.ok(render({ ...overrides, sub_value_format }).html.includes('<span class="button-sub">21,2300 °C</span>'));
        }
    });
}

for (const attribute of [undefined, 'next_rising']) {
    test(`fancy units preserve the card's timestamp display (attribute: ${attribute})`, () => {
        const { hass, render } = fixture();
        const timestamp = '2026-09-18T12:00:00Z';
        hass.states['sensor.time'] = { state: timestamp, attributes: { next_rising: timestamp } };
        const method = attribute ? 'formatEntityAttributeValue' : 'formatEntityState';
        nativeDisplay(hass, method, [{ type: 'value', value: 'Full native date and time' }]);
        const overrides = { sub_value_entity: 'sensor.time', sub_value_attribute: attribute };
        const subText = html => html.match(/<span class="button-sub">(.*?)<\/span>/)[1];
        const original = subText(render({ ...overrides, fancy_unit: false }).html);
        assert.notEqual(original, 'Full native date and time');
        assert.equal(subText(render(overrides).html), original);
    });
}

test('native parts methods receive the correct entity, attribute and hass context', () => {
    const { hass, render } = fixture();
    const entity = hass.states['sensor.low'];
    entity.attributes.temperature = 20.5;
    for (const attr of [undefined, 'temperature']) {
        const method = attr ? 'formatEntityAttributeValue' : 'formatEntityState';
        nativeDisplay(hass, method, numericParts('20,500', '°C'));
        let called = false;
        hass[`${method}ToParts`] = function (...args) {
            called = true;
            assert.equal(this, hass);
            assert.deepEqual(args, attr ? [entity, attr] : [entity]);
            return numericParts('20,500', '°C');
        };
        render({ sub_value_entity: 'sensor.low', sub_value_attribute: attr });
        assert.ok(called);
    }
});
