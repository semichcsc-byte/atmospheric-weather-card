const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createContext } = require('./sandbox.cjs');

const payload = `&<img src=x onerror="alert('x')">`;
const escaped = '&amp;&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;';

function fixture() {
    const { card: Card } = createContext();
    const card = Object.create(Card.prototype);
    const hass = {
        states: {
            'sensor.text': { state: payload, attributes: { text: payload, unit_of_measurement: payload } },
            'sensor.number': { state: '12', attributes: { unit_of_measurement: payload } },
            'weather.home': { state: 'sunny', attributes: { temperature: 20, temperature_unit: payload } },
        },
    };
    const render = overrides => card._renderButton(
        { entity: 'sensor.text', hide_icon: true, ...overrides },
        0, hass, 'sunny', 'en', false, 'theme', 'stacked', 0, {},
    );
    return { card, hass, render };
}

for (const fancy_unit of [false, true]) {
    for (const marquee of [false, true]) {
        test(`all text sinks are escaped (fancy=${fancy_unit}, marquee=${marquee})`, () => {
            const { render } = fixture();
            const { html } = render({
                fancy_unit, name_sensor: 'sensor.text', name_attribute: 'text',
                name_format: payload, unit_format: payload,
                sub_value_entity: 'sensor.text', sub_value_attribute: 'text', sub_value_format: payload,
                overflow: marquee ? 'marquee' : 'ellipsis',
                label_overflow: marquee ? 'marquee' : 'ellipsis',
                sub_value_overflow: marquee ? 'marquee' : 'ellipsis',
            });
            assert.ok(!html.includes(payload));
            assert.ok(!html.includes('<img'));
            assert.ok(html.includes(escaped + escaped));
            assert.ok(!html.includes('&amp;amp;'), 'text must be escaped exactly once');
            if (fancy_unit) assert.ok(html.includes(`<span class="fancy-unit">${escaped}</span>`));
        });
    }
}

test('configured names, suffixes and entity units are escaped', () => {
    const { render } = fixture();
    const { html } = render({ name: payload, name_format: payload });
    assert.ok(html.includes(`<span class="button-name">${escaped}${escaped}</span>`));
    assert.ok(html.includes(`<span class="button-val">${escaped} ${escaped}</span>`));
});

for (const nativeParts of [false, true]) {
    test(`HA-formatted sub-values are escaped (parts=${nativeParts})`, () => {
        const { hass, render } = fixture();
        hass.formatEntityState = () => payload;
        if (nativeParts) hass.formatEntityStateToParts = () => [
            { type: 'value', value: payload },
            { type: 'literal', value: payload },
            { type: 'unit', value: payload },
        ];
        const config = { fancy_unit: true, sub_value_entity: 'sensor.number' };
        const { html } = render(config);
        assert.ok(!html.includes('<img'));
        assert.ok(html.includes(nativeParts
            ? `<span class="button-sub">${escaped}${escaped}<span class="fancy-unit">${escaped}</span></span>`
            : `<span class="button-sub">${escaped}</span>`));
        assert.ok(!render({ ...config, sub_value_format: payload }).html.includes('<img'));
    });
}

test('forecast text, localized conditions and units are escaped', () => {
    const { card, hass, render } = fixture();
    card._fcData = new Map([['weather.home|daily', { processed: [{
        condition: 'sunny', temperature: 20, templow: payload, label: payload,
        datetime: '2026-11-05T12:00:00Z',
    }] }]]);
    hass.localize = () => payload;
    for (const attribute of ['condition', 'templow']) {
        const { html } = render({
            entity: 'weather.home', forecast: 'daily', attribute, name_attribute: 'label',
            sub_value_attribute: attribute, sub_value_format: payload, fancy_unit: true,
        });
        assert.ok(!html.includes('<img'));
        assert.ok(html.includes(`<span class="button-name">${escaped}</span>`));
        assert.ok(html.includes(escaped));
    }
});

test('icon and layout attributes cannot break out into markup', () => {
    const { render } = fixture();
    for (const type of ['default', 'ring', 'bar']) {
        const { html } = render({
            type, hide_icon: false, icon: payload, width: payload, height: payload,
            background_color: payload, icon_background_color: payload, padding: payload,
            text_size: payload, align: payload, overflow: payload,
            ring_color: payload, bar_color: payload,
        });
        assert.ok(!html.includes(payload));
        assert.ok(!html.includes('<img'));
        assert.ok(html.includes(escaped));
    }
    const { html } = render({ hide_icon: false, icon: 'sunny', icon_path: payload });
    assert.ok(html.includes(`src="${escaped}/sunny.svg"`));
    assert.ok(!html.includes(payload));
});

test('benign text and entity-looking strings are not interpreted as markup', () => {
    const { hass, render } = fixture();
    hass.states['sensor.text'].state = '5 < 10 & "quoted" \'text\' &lt;b&gt;';
    hass.states['sensor.text'].attributes.unit_of_measurement = '';
    assert.ok(render({}).html.includes('5 &lt; 10 &amp; &quot;quoted&quot; &#39;text&#39; &amp;lt;b&amp;gt;'));
});
