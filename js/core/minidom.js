// A tiny DOM that runs anywhere (Web Worker, Node). It implements just enough
// of the real DOM API for the "DOM Dojo" lessons: querying, creating and
// editing elements, attributes, classList, dataset, style and events.
// Everything behaves like the browser for the supported surface; unsupported
// APIs are simply missing, so learners see a normal "is not a function" error.

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'wbr']);
const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

const decode = (s) => s.replace(/&(amp|lt|gt|quot|nbsp|#39);/g, (m) => ENTITIES[m]);
const escapeText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = (s) => escapeText(s).replace(/"/g, '&quot;');

class MiniEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.bubbles = init.bubbles ?? true;
    this.target = null;
    this.currentTarget = null;
    this.defaultPrevented = false;
    this._stopped = false;
    Object.assign(this, init.detail === undefined ? {} : { detail: init.detail });
  }
  preventDefault() {
    this.defaultPrevented = true;
  }
  stopPropagation() {
    this._stopped = true;
  }
}

class MiniNode {
  constructor(doc) {
    this.ownerDocument = doc;
    this.parentNode = null;
    this.childNodes = [];
    this._listeners = new Map();
  }
  get firstChild() {
    return this.childNodes[0] ?? null;
  }
  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] ?? null;
  }
  get nextSibling() {
    return this.parentNode?.childNodes[this.parentNode.childNodes.indexOf(this) + 1] ?? null;
  }
  get previousSibling() {
    return this.parentNode?.childNodes[this.parentNode.childNodes.indexOf(this) - 1] ?? null;
  }
  get parentElement() {
    return this.parentNode && this.parentNode.nodeType === 1 ? this.parentNode : null;
  }
  appendChild(child) {
    return this.insertBefore(child, null);
  }
  insertBefore(child, ref) {
    if (child.nodeType === 11) {
      for (const c of [...child.childNodes]) this.insertBefore(c, ref);
      return child;
    }
    for (let p = this; p; p = p.parentNode) {
      if (p === child) throw new Error('HierarchyRequestError: cannot insert a node into itself');
    }
    child.parentNode?.removeChild(child);
    const idx = ref ? this.childNodes.indexOf(ref) : -1;
    if (ref && idx === -1) throw new Error('NotFoundError: the reference node is not a child of this node');
    if (idx === -1) this.childNodes.push(child);
    else this.childNodes.splice(idx, 0, child);
    child.parentNode = this;
    return child;
  }
  removeChild(child) {
    const idx = this.childNodes.indexOf(child);
    if (idx === -1) throw new Error('NotFoundError: the node to be removed is not a child of this node');
    this.childNodes.splice(idx, 1);
    child.parentNode = null;
    return child;
  }
  replaceChild(next, prev) {
    this.insertBefore(next, prev);
    return this.removeChild(prev);
  }
  contains(node) {
    for (let n = node; n; n = n.parentNode) if (n === this) return true;
    return false;
  }
  remove() {
    this.parentNode?.removeChild(this);
  }
  addEventListener(type, fn) {
    if (typeof fn !== 'function') return;
    const list = this._listeners.get(type) ?? [];
    if (!list.includes(fn)) list.push(fn);
    this._listeners.set(type, list);
  }
  removeEventListener(type, fn) {
    const list = this._listeners.get(type);
    if (list) this._listeners.set(type, list.filter((f) => f !== fn));
  }
  dispatchEvent(event) {
    event.target = event.target ?? this;
    for (let node = this; node && !event._stopped; node = node.parentNode) {
      event.currentTarget = node;
      for (const fn of [...(node._listeners.get(event.type) ?? [])]) fn.call(node, event);
      if (!event.bubbles) break;
    }
    return !event.defaultPrevented;
  }
}

class MiniText extends MiniNode {
  constructor(doc, data) {
    super(doc);
    this.nodeType = 3;
    this.nodeName = '#text';
    this.data = String(data);
  }
  get textContent() {
    return this.data;
  }
  set textContent(v) {
    this.data = String(v);
  }
  get nodeValue() {
    return this.data;
  }
}

class MiniFragment extends MiniNode {
  constructor(doc) {
    super(doc);
    this.nodeType = 11;
    this.nodeName = '#document-fragment';
  }
  get children() {
    return this.childNodes.filter((n) => n.nodeType === 1);
  }
  get textContent() {
    return this.childNodes.map((n) => n.textContent).join('');
  }
  append(...nodes) {
    for (const n of nodes) this.appendChild(typeof n === 'string' ? this.ownerDocument.createTextNode(n) : n);
  }
  querySelector(sel) {
    return queryAll(this, sel, true)[0] ?? null;
  }
  querySelectorAll(sel) {
    return queryAll(this, sel);
  }
}

// ---- selectors --------------------------------------------------------

function parseCompound(src) {
  const compound = { tag: null, id: null, classes: [], attrs: [] };
  const re = /([#.]?)([\w-]+)|\[\s*([\w-]+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\]\s]+)))?\s*\]|\*/g;
  let m;
  let consumed = 0;
  while ((m = re.exec(src))) {
    if (m.index !== consumed) break;
    consumed = re.lastIndex;
    if (m[3]) compound.attrs.push([m[3], m[4] ?? m[5] ?? m[6] ?? null]);
    else if (m[1] === '#') compound.id = m[2];
    else if (m[1] === '.') compound.classes.push(m[2]);
    else if (m[2]) compound.tag = m[2].toLowerCase();
  }
  if (consumed !== src.length) throw new SyntaxError(`'${src}' is not a valid selector`);
  return compound;
}

function parseSelector(sel) {
  return String(sel)
    .split(',')
    .map((part) => part.trim().replace(/\s*>\s*/g, ' > '))
    .map((part) => {
      if (!part) throw new SyntaxError(`'${sel}' is not a valid selector`);
      const tokens = part.split(/\s+/);
      const chain = [];
      let combinator = ' ';
      for (const tok of tokens) {
        if (tok === '>') combinator = '>';
        else {
          chain.push({ combinator, compound: parseCompound(tok) });
          combinator = ' ';
        }
      }
      return chain;
    });
}

function matchesCompound(el, c) {
  if (c.tag && el.tagName.toLowerCase() !== c.tag) return false;
  if (c.id && el.id !== c.id) return false;
  if (!c.classes.every((cls) => el.classList.contains(cls))) return false;
  return c.attrs.every(([name, val]) => el.hasAttribute(name) && (val === null || el.getAttribute(name) === val));
}

function matchesChain(el, chain, i) {
  const { combinator, compound } = chain[i];
  if (!matchesCompound(el, compound)) return false;
  if (i === 0) return true;
  if (combinator === '>') return el.parentElement ? matchesChain(el.parentElement, chain, i - 1) : false;
  for (let p = el.parentElement; p; p = p.parentElement) if (matchesChain(p, chain, i - 1)) return true;
  return false;
}

function matches(el, sel) {
  return parseSelector(sel).some((chain) => matchesChain(el, chain, chain.length - 1));
}

function descendants(root) {
  const out = [];
  const walk = (n) => {
    for (const c of n.childNodes) {
      if (c.nodeType === 1) {
        out.push(c);
        walk(c);
      }
    }
  };
  walk(root);
  return out;
}

function queryAll(root, sel, firstOnly = false) {
  const chains = parseSelector(sel);
  const out = [];
  for (const el of descendants(root)) {
    if (chains.some((chain) => matchesChain(el, chain, chain.length - 1))) {
      out.push(el);
      if (firstOnly) break;
    }
  }
  return out;
}

// ---- elements ---------------------------------------------------------

function makeClassList(el) {
  const read = () => (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
  const write = (list) => el.setAttribute('class', list.join(' '));
  return {
    add: (...names) => write([...new Set([...read(), ...names])]),
    remove: (...names) => write(read().filter((c) => !names.includes(c))),
    contains: (name) => read().includes(name),
    toggle(name, force) {
      const has = read().includes(name);
      const want = force === undefined ? !has : Boolean(force);
      if (want && !has) this.add(name);
      if (!want && has) this.remove(name);
      return want;
    },
    get length() {
      return read().length;
    },
    toString: () => read().join(' '),
  };
}

const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

class MiniElement extends MiniNode {
  constructor(doc, tagName) {
    super(doc);
    this.nodeType = 1;
    this.tagName = tagName.toUpperCase();
    this.nodeName = this.tagName;
    this._attrs = new Map();
    this.classList = makeClassList(this);
    this.style = new Proxy(
      {},
      {
        set: (t, prop, v) => {
          t[camel(String(prop))] = String(v);
          return true;
        },
        get: (t, prop) => {
          if (prop === 'setProperty') return (name, v) => { t[camel(name)] = String(v); };
          if (prop === 'removeProperty') return (name) => { delete t[camel(name)]; };
          if (prop === 'cssText') return Object.entries(t).map(([k, v]) => `${kebab(k)}: ${v};`).join(' ');
          return t[camel(String(prop))] ?? '';
        },
        ownKeys: (t) => Reflect.ownKeys(t),
        getOwnPropertyDescriptor: (t, p) => Reflect.getOwnPropertyDescriptor(t, p),
      },
    );
    this.dataset = new Proxy(
      {},
      {
        get: (_, prop) => this.getAttribute(`data-${kebab(String(prop))}`) ?? undefined,
        set: (_, prop, v) => {
          this.setAttribute(`data-${kebab(String(prop))}`, String(v));
          return true;
        },
        deleteProperty: (_, prop) => {
          this.removeAttribute(`data-${kebab(String(prop))}`);
          return true;
        },
      },
    );
    this.value = '';
    this.checked = false;
    this.disabled = false;
  }
  get id() {
    return this.getAttribute('id') ?? '';
  }
  set id(v) {
    this.setAttribute('id', v);
  }
  get className() {
    return this.getAttribute('class') ?? '';
  }
  set className(v) {
    this.setAttribute('class', v);
  }
  get children() {
    return this.childNodes.filter((n) => n.nodeType === 1);
  }
  get childElementCount() {
    return this.children.length;
  }
  get firstElementChild() {
    return this.children[0] ?? null;
  }
  get lastElementChild() {
    return this.children[this.children.length - 1] ?? null;
  }
  get textContent() {
    return this.childNodes.map((n) => n.textContent).join('');
  }
  set textContent(v) {
    for (const c of [...this.childNodes]) this.removeChild(c);
    if (String(v) !== '') this.appendChild(this.ownerDocument.createTextNode(v));
  }
  get innerText() {
    return this.textContent;
  }
  set innerText(v) {
    this.textContent = v;
  }
  get innerHTML() {
    return this.childNodes.map(serialize).join('');
  }
  set innerHTML(html) {
    for (const c of [...this.childNodes]) this.removeChild(c);
    parseInto(this, String(html));
  }
  get outerHTML() {
    return serialize(this);
  }
  setAttribute(name, value) {
    this._attrs.set(String(name).toLowerCase(), String(value));
  }
  getAttribute(name) {
    return this._attrs.get(String(name).toLowerCase()) ?? null;
  }
  hasAttribute(name) {
    return this._attrs.has(String(name).toLowerCase());
  }
  removeAttribute(name) {
    this._attrs.delete(String(name).toLowerCase());
  }
  toggleAttribute(name, force) {
    const want = force === undefined ? !this.hasAttribute(name) : Boolean(force);
    if (want) this.setAttribute(name, '');
    else this.removeAttribute(name);
    return want;
  }
  append(...nodes) {
    for (const n of nodes) this.appendChild(typeof n === 'string' ? this.ownerDocument.createTextNode(n) : n);
  }
  prepend(...nodes) {
    const first = this.firstChild;
    for (const n of nodes) this.insertBefore(typeof n === 'string' ? this.ownerDocument.createTextNode(n) : n, first);
  }
  matches(sel) {
    return matches(this, sel);
  }
  closest(sel) {
    for (let el = this; el; el = el.parentElement) if (matches(el, sel)) return el;
    return null;
  }
  querySelector(sel) {
    return queryAll(this, sel, true)[0] ?? null;
  }
  querySelectorAll(sel) {
    return queryAll(this, sel);
  }
  getElementsByClassName(name) {
    return queryAll(this, `.${name}`);
  }
  getElementsByTagName(tag) {
    return queryAll(this, tag);
  }
  click() {
    this.dispatchEvent(new MiniEvent('click'));
  }
  focus() {}
  blur() {}
}

function serialize(node) {
  if (node.nodeType === 3) return escapeText(node.data);
  const attrs = [...node._attrs].map(([k, v]) => ` ${k}="${escapeAttr(v)}"`).join('');
  const style = node.style.cssText ? ` style="${escapeAttr(node.style.cssText)}"` : '';
  const tag = node.tagName.toLowerCase();
  if (VOID.has(tag)) return `<${tag}${attrs}${style}>`;
  return `<${tag}${attrs}${style}>${node.childNodes.map(serialize).join('')}</${tag}>`;
}

function parseInto(parent, html) {
  const doc = parent.ownerDocument;
  const tokenRe = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|([^<]+|<)/g;
  const attrRe = /([^\s=>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  const stack = [parent];
  let m;
  while ((m = tokenRe.exec(html))) {
    const top = stack[stack.length - 1];
    if (m[0].startsWith('<!--')) continue;
    if (m[1]) {
      const name = m[1].toUpperCase();
      const at = stack.map((n) => n.tagName).lastIndexOf(name);
      if (at > 0) stack.length = at;
    } else if (m[2]) {
      const el = doc.createElement(m[2]);
      let a;
      while ((a = attrRe.exec(m[3]))) el.setAttribute(a[1], decode(a[2] ?? a[3] ?? a[4] ?? ''));
      top.appendChild(el);
      if (!VOID.has(m[2].toLowerCase()) && !m[4]) stack.push(el);
    } else if (m[5] !== undefined) {
      top.appendChild(doc.createTextNode(decode(m[5])));
    }
  }
}

// ---- document ---------------------------------------------------------

class MiniDocument extends MiniNode {
  constructor() {
    super(null);
    this.ownerDocument = this;
    this.nodeType = 9;
    this.nodeName = '#document';
    this.documentElement = this.createElement('html');
    this.head = this.createElement('head');
    this.body = this.createElement('body');
    this.appendChild(this.documentElement);
    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);
  }
  createElement(tag) {
    if (!/^[a-zA-Z][\w-]*$/.test(String(tag))) throw new Error(`InvalidCharacterError: '${tag}' is not a valid tag name`);
    return new MiniElement(this, String(tag));
  }
  createTextNode(text) {
    return new MiniText(this, text);
  }
  createDocumentFragment() {
    return new MiniFragment(this);
  }
  getElementById(id) {
    return queryAll(this, `#${id}`, true)[0] ?? null;
  }
  querySelector(sel) {
    return queryAll(this, sel, true)[0] ?? null;
  }
  querySelectorAll(sel) {
    return queryAll(this, sel);
  }
  getElementsByClassName(name) {
    return queryAll(this, `.${name}`);
  }
  getElementsByTagName(tag) {
    return queryAll(this, tag);
  }
}

/** Create a document whose <body> is pre-filled with `html`. */
export function createDocument(html = '') {
  const doc = new MiniDocument();
  doc.body.innerHTML = html;
  return doc;
}

export const Event = MiniEvent;
export { MiniEvent };
