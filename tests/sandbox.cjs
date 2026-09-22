const { readFileSync } = require('node:fs');
const vm = require('node:vm');

const sourcePath = require.resolve('../atmospheric-weather-card.js');
const source = readFileSync(sourcePath, 'utf8');

// The shipped bundle carries the card, Lit and the visual editor, so evaluating it needs a
// handful of DOM globals. This is the smallest stub that lets the module body run in Node.
function makeNode(tag) {
    const node = {
        tagName: tag, children: [], style: {}, content: null,
        appendChild(child) { this.children.push(child); return child; },
        append(...kids) { this.children.push(...kids); },
        prepend(...kids) { this.children.unshift(...kids); },
        insertBefore(child) { this.children.push(child); return child; },
        removeChild() {}, remove() {},
        setAttribute() {}, removeAttribute() {}, getAttribute() { return null; },
        addEventListener() {}, removeEventListener() {},
        querySelector() { return null; }, querySelectorAll() { return []; },
    };
    if (tag === 'template') node.content = makeNode('#fragment');
    return node;
}

function createContext(overrides = {}) {
    const elements = new Map();
    const created = [];
    const document = {
        createElement: tag => { created.push(tag); return makeNode(tag); },
        createComment: () => makeNode('#comment'),
        createTextNode: () => makeNode('#text'),
        createDocumentFragment: () => makeNode('#fragment'),
        createTreeWalker: () => ({ currentNode: null, nextNode: () => null }),
        importNode: node => node,
        adoptNode: node => node,
    };
    const sandbox = {
        HTMLElement: class {},
        customElements: {
            get: name => elements.get(name),
            define: (name, element) => elements.set(name, element),
            whenDefined: () => new Promise(() => {}),
        },
        document,
        window: {},
        setTimeout,
        clearTimeout,
        console: { info() {}, warn() {}, error() {} },
        ...overrides,
    };
    vm.runInNewContext(source, sandbox);
    return { elements, created, sandbox, card: elements.get('atmospheric-weather-card') };
}

module.exports = { source, sourcePath, createContext, makeNode };
