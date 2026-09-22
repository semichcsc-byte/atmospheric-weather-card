const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');

const source = readFileSync(require.resolve('../atmospheric-weather-card.js'), 'utf8');

// Minimal DOM so the bundled editor can be exercised without a browser.
function makeNode(tag) {
    let html = '';
    const node = {
        tagName: tag, children: [], _listeners: {}, style: {},
        className: '', textContent: '',
        appendChild(child) { this.children.push(child); return child; },
        append(...kids) { this.children.push(...kids); },
        prepend(...kids) { this.children.unshift(...kids); },
        setAttribute() {},
        click() { this.dispatchEvent({ type: 'click', preventDefault() {}, stopPropagation() {} }); },
        addEventListener(type, handler) { (this._listeners[type] = this._listeners[type] || []).push(handler); },
        dispatchEvent(ev) { (this._listeners[ev.type] || []).forEach(handler => handler(ev)); return true; },
    };
    Object.defineProperty(node, 'innerHTML', {
        get: () => html,
        set(value) { html = value; node.children.length = 0; },
    });
    return node;
}

function load({ haForm = true } = {}) {
    const elements = new Map();
    if (haForm) elements.set('ha-form', class {});
    const sandbox = {
        HTMLElement: class {
            constructor() { this._listeners = {}; }
            attachShadow() { this.shadowRoot = makeNode('#shadow'); return this.shadowRoot; }
            addEventListener(type, handler) { (this._listeners[type] = this._listeners[type] || []).push(handler); }
            dispatchEvent(ev) { (this._listeners[ev.type] || []).forEach(handler => handler(ev)); return true; }
        },
        CustomEvent: class { constructor(type, init) { this.type = type; Object.assign(this, init); } },
        customElements: {
            get: name => elements.get(name),
            define: (name, element) => elements.set(name, element),
            whenDefined: () => new Promise(() => {}),
        },
        document: { createElement: makeNode },
        window: { loadCardHelpers: async () => ({ createCardElement: async () => ({}) }) },
        setTimeout: haForm ? setTimeout : (fn => fn()),
        console: { info() {}, warn() {} },
    };
    vm.runInNewContext(source, sandbox);
    return { elements, Card: elements.get('atmospheric-weather-card') };
}

async function editorWith(config, options) {
    const { elements, Card } = load(options);
    const Editor = elements.get('atmospheric-weather-card-editor');
    const editor = new Editor();
    const emitted = [];
    editor.addEventListener('config-changed', ev => emitted.push(ev.detail.config));
    editor.hass = { states: {} };
    editor.setConfig(config);
    await new Promise(resolve => setTimeout(resolve, 0));
    return { editor, emitted, Card, elements };
}

// Values created inside the VM realm have a foreign prototype, so compare them as plain data.
const plain = value => JSON.parse(JSON.stringify(value));

// Finds the rendered form that owns a given option, so tests can drive it like a user would.
function formFor(editor, key) {
    const names = schema => schema.flatMap(entry => (Array.isArray(entry.schema) ? names(entry.schema) : [entry.name]));
    const entry = editor._forms.find(f => names(f.node.schema).includes(key));
    assert.ok(entry, `no form renders "${key}"`);
    return entry;
}

function change(editor, key, value) {
    const entry = formFor(editor, key);
    const detailValue = { ...entry.node.data, [key]: value };
    entry.node.dispatchEvent({ type: 'value-changed', detail: { value: detailValue }, stopPropagation() {} });
}

function findAddButton(editor, label) {
    const walk = node => {
        if (node.tagName === 'button' && node.textContent === label) return node;
        for (const child of node.children || []) {
            const found = walk(child);
            if (found) return found;
        }
        return null;
    };
    const node = walk(editor.shadowRoot);
    assert.ok(node, `no "${label}" button rendered`);
    return () => node.click();
}

test('the editor ships inside the card bundle', async () => {
    const { elements, Card } = load();
    assert.ok(elements.get('atmospheric-weather-card-editor'), 'editor element is not registered');
    const element = await Card.getConfigElement();
    assert.equal(element.tagName, 'atmospheric-weather-card-editor');
});

test('editing a card option keeps unknown keys untouched', async () => {
    const { editor, emitted } = await editorWith({
        type: 'custom:atmospheric-weather-card',
        weather_entity: 'weather.home',
        future_option: { keep: true },
    });
    change(editor, 'card_height', '300px');
    assert.equal(emitted.length, 1);
    assert.equal(emitted[0].card_height, '300px');
    assert.equal(emitted[0].weather_entity, 'weather.home');
    assert.deepEqual(emitted[0].future_option, { keep: true });
    assert.equal(emitted[0].type, 'custom:atmospheric-weather-card');
});

test('cleared fields and default values are removed from the config', async () => {
    const { editor, emitted } = await editorWith({ type: 'custom:x', card_height: '300px' });
    change(editor, 'card_height', '');
    assert.ok(!('card_height' in emitted[0]));
    change(editor, 'theme_adapt', true);
    assert.ok(!('theme_adapt' in emitted[1]), 'the default value should not be written out');
    change(editor, 'theme_adapt', false);
    assert.equal(emitted[2].theme_adapt, false);
});

test('areas and buttons can be added, edited and removed', async () => {
    const { editor, emitted } = await editorWith({ type: 'custom:x', weather_entity: 'weather.home' });
    editor._replaceAreas([{ position: 'bottom-left', buttons: [] }]);
    assert.deepEqual(plain(emitted[0].button_areas), [{ position: 'bottom-left', buttons: [] }]);

    editor._replaceButtons(0, [{ entity: 'sensor.a' }, { entity: 'sensor.b' }]);
    assert.equal(emitted[1].button_areas[0].buttons.length, 2);

    change(editor, 'layout', 'grid');
    assert.equal(emitted[2].button_areas[0].layout, 'grid');
    assert.equal(emitted[2].button_areas[0].buttons.length, 2, 'buttons must survive an area edit');

    editor._replaceButtons(0, [{ entity: 'sensor.b' }]);
    assert.deepEqual(plain(emitted[3].button_areas[0].buttons), [{ entity: 'sensor.b' }]);
});

test('button edits only touch the targeted button', async () => {
    const { editor, emitted } = await editorWith({
        type: 'custom:x',
        button_areas: [{ position: 'right', buttons: [{ entity: 'sensor.a', custom_key: 1 }, { entity: 'sensor.b' }] }],
    });
    editor._patchButton(0, 0, { text_size: '20px' });
    const buttons = emitted[0].button_areas[0].buttons;
    assert.deepEqual(plain(buttons[0]), { entity: 'sensor.a', custom_key: 1, text_size: '20px' });
    assert.deepEqual(plain(buttons[1]), { entity: 'sensor.b' });
});

test('ring options and thresholds are editable for ring buttons', async () => {
    const { editor, emitted } = await editorWith({
        type: 'custom:x',
        button_areas: [{ buttons: [{ entity: 'sensor.a', type: 'ring', ring_thresholds: [{ value: '0', color: 'red' }] }] }],
    });
    change(editor, 'ring_max', 50);
    assert.equal(emitted[0].button_areas[0].buttons[0].ring_max, 50);

    const threshold = formFor(editor, 'color');
    assert.deepEqual(plain(threshold.node.data), { value: '0', color: 'red' });
    threshold.node.dispatchEvent({
        type: 'value-changed',
        detail: { value: { value: '10', color: 'blue' } },
        stopPropagation() {},
    });
    assert.deepEqual(plain(emitted[1].button_areas[0].buttons[0]).ring_thresholds, [{ value: '10', color: 'blue' }]);
});

test('bar options are only rendered for bar buttons', async () => {
    const ring = await editorWith({
        type: 'custom:x', button_areas: [{ buttons: [{ entity: 'sensor.a', type: 'ring' }] }],
    });
    assert.throws(() => formFor(ring.editor, 'bar_max'));

    const bar = await editorWith({
        type: 'custom:x', button_areas: [{ buttons: [{ entity: 'sensor.a', type: 'bar' }] }],
    });
    assert.ok(formFor(bar.editor, 'bar_max'));
});

test('panel headers follow the config without rebuilding the editor', async () => {
    const { editor } = await editorWith({
        type: 'custom:x',
        button_areas: [{ position: 'right', buttons: [{ entity: 'sensor.a' }] }],
    });
    const header = key => editor._headers.find(h => h.read().title === key);
    const form = formFor(editor, 'entity').node;
    assert.ok(header('sensor.a'), 'button header should start at the current entity');

    change(editor, 'entity', 'sensor.zzz');
    assert.equal(formFor(editor, 'entity').node, form, 'an entity change must not rebuild');
    const titles = editor._headers.map(h => h.title.textContent);
    assert.ok(titles.includes('sensor.zzz'), `stale header: ${titles.join(', ')}`);

    change(editor, 'position', 'left');
    assert.ok(editor._headers.map(h => h.title.textContent).includes('left'));
});

test('the editor degrades to a notice when ha-form is unavailable', async () => {
    const { editor } = await editorWith({ type: 'custom:x' }, { haForm: false });
    assert.equal(editor._built, false);
    assert.match(editor.shadowRoot.innerHTML, /Visual editor unavailable/);
    assert.match(editor.shadowRoot.innerHTML, /Show code editor/);
});

test('the config Home Assistant echoes back does not rebuild the form', async () => {
    const { editor, emitted } = await editorWith({ type: 'custom:x', card_height: '200px' });
    const before = formFor(editor, 'card_height').node;
    change(editor, 'card_height', '300px');
    // Home Assistant pushes the new config straight back into the editor.
    editor.setConfig(emitted[0]);
    assert.equal(formFor(editor, 'card_height').node, before, 'rebuilding here would steal focus');
    assert.equal(formFor(editor, 'card_height').node.data.card_height, '300px');
});

test('adding an area or button keeps edits made since the panel was rendered', async () => {
    const { editor, emitted } = await editorWith({
        type: 'custom:x',
        button_areas: [{ position: 'right', buttons: [{ entity: 'sensor.a' }] }],
    });
    change(editor, 'layout', 'grid');
    change(editor, 'text_size', '20px');
    const addArea = findAddButton(editor, '+ Add button');
    addArea();
    const buttons = emitted[emitted.length - 1].button_areas[0].buttons;
    assert.equal(buttons[0].text_size, '20px', 'the earlier button edit must not be reverted');
    assert.equal(emitted[emitted.length - 1].button_areas[0].layout, 'grid');
    assert.equal(buttons.length, 2);

    findAddButton(editor, '+ Add area')();
    const areas = emitted[emitted.length - 1].button_areas;
    assert.equal(areas.length, 2);
    assert.equal(areas[0].layout, 'grid', 'the earlier area edit must not be reverted');
    assert.equal(areas[0].buttons.length, 2);
});

test('an empty unit format is preserved and can be set from the editor', async () => {
    const { editor, emitted } = await editorWith({
        type: 'custom:x',
        button_areas: [{ buttons: [{ entity: 'sensor.a', sub_value_format: '', unit_format: '' }] }],
    });
    change(editor, 'card_height', '300px');
    const button = emitted[0].button_areas[0].buttons[0];
    assert.equal(button.sub_value_format, '', 'an explicit empty unit must not be dropped');
    assert.equal(button.unit_format, '');

    change(editor, '_hide_sub_unit', false);
    assert.ok(!('sub_value_format' in emitted[1].button_areas[0].buttons[0]), 'unticking removes the override');

    change(editor, '_hide_sub_unit', true);
    assert.equal(emitted[2].button_areas[0].buttons[0].sub_value_format, '');

    change(editor, 'unit_format', '°');
    assert.equal(emitted[3].button_areas[0].buttons[0].unit_format, '°');
    assert.ok(!('_hide_unit' in emitted[3].button_areas[0].buttons[0]), 'UI-only keys never reach the config');
});
