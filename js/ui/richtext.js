// A deliberately tiny Markdown subset for lesson text: paragraphs, bullet
// lists, fenced code blocks, `inline code` and **bold**. `parse` is pure (and
// unit-tested); `render` turns the result into DOM without using innerHTML.

import { h } from './dom.js';

export function parseInline(text) {
  const out = [];
  const re = /`([^`]+)`|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: 'text', v: text.slice(last, m.index) });
    out.push(m[1] !== undefined ? { t: 'code', v: m[1] } : { t: 'bold', v: m[2] });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ t: 'text', v: text.slice(last) });
  return out;
}

export function parse(source) {
  const blocks = [];
  const lines = String(source).replace(/\r\n/g, '\n').split('\n');
  let para = [];
  let list = null;
  const flush = () => {
    if (para.length) blocks.push({ type: 'p', inline: parseInline(para.join(' ')) });
    if (list) blocks.push({ type: 'ul', items: list.map(parseInline) });
    para = [];
    list = null;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      flush();
      const body = [];
      while (++i < lines.length && !/^```\s*$/.test(lines[i])) body.push(lines[i]);
      blocks.push({ type: 'code', lang: fence[1] || 'js', text: body.join('\n') });
    } else if (/^\s*[-•]\s+/.test(line)) {
      if (para.length) {
        blocks.push({ type: 'p', inline: parseInline(para.join(' ')) });
        para = [];
      }
      (list ??= []).push(line.replace(/^\s*[-•]\s+/, ''));
    } else if (line.trim() === '') {
      flush();
    } else {
      if (list) flush();
      para.push(line.trim());
    }
  }
  flush();
  return blocks;
}

function renderInline(tokens) {
  return tokens.map((tok) => (tok.t === 'code' ? h('code', { text: tok.v }) : tok.t === 'bold' ? h('strong', { text: tok.v }) : tok.v));
}

export function render(source, highlight) {
  const root = h('div', { class: 'richtext' });
  for (const block of parse(source)) {
    if (block.type === 'p') root.append(h('p', {}, renderInline(block.inline)));
    else if (block.type === 'ul') root.append(h('ul', {}, block.items.map((it) => h('li', {}, renderInline(it)))));
    else {
      const code = h('code');
      if (highlight) code.append(...highlight(block.text));
      else code.textContent = block.text;
      root.append(h('pre', { class: 'code-block', tabindex: '0', 'aria-label': 'Code example' }, code));
    }
  }
  return root;
}
