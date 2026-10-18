// A dependency-free code editor: a transparent <textarea> layered over a
// syntax-highlighted <pre>, with a line-number gutter. Real textarea means
// native selection, IME, mobile keyboards and screen-reader support all work.

import { h } from './dom.js';
import { highlight } from './highlight.js';

const INDENT = '  ';

/**
 * @param {{ value?: string, label: string, onChange?: (v: string) => void, onRun?: () => void }} options
 */
export function createEditor({ value = '', label, onChange, onRun }) {
  const gutter = h('div', { class: 'editor-gutter', 'aria-hidden': 'true' });
  const code = h('code');
  const pre = h('pre', { class: 'editor-highlight', 'aria-hidden': 'true' }, code);
  const textarea = h('textarea', {
    class: 'editor-input',
    spellcheck: 'false',
    autocapitalize: 'off',
    autocomplete: 'off',
    autocorrect: 'off',
    wrap: 'off',
    'aria-label': label,
    'aria-describedby': 'editor-help',
  });
  const body = h('div', { class: 'editor-body' }, pre, textarea);
  const scroller = h('div', { class: 'editor-scroll' }, gutter, body);
  const el = h('div', { class: 'editor' }, scroller);

  let tabTrap = true; // Escape releases Tab so keyboard users are never stuck

  function paint() {
    const text = textarea.value;
    code.replaceChildren(...highlight(text), document.createTextNode(text.endsWith('\n') ? ' ' : ''));
    const lines = text.split('\n').length;
    gutter.textContent = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
  }

  function edit(start, end, insert, caret = start + insert.length) {
    textarea.focus();
    textarea.setSelectionRange(start, end);
    // execCommand keeps the browser's native undo stack; fall back if unsupported.
    let ok = false;
    try {
      ok = document.execCommand('insertText', false, insert);
    } catch {
      ok = false;
    }
    if (!ok) {
      textarea.setRangeText(insert, start, end, 'end');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    textarea.setSelectionRange(caret, caret);
  }

  const lineStart = (text, pos) => text.lastIndexOf('\n', pos - 1) + 1;

  textarea.addEventListener('input', () => {
    paint();
    onChange?.(textarea.value);
  });

  textarea.addEventListener('keydown', (e) => {
    const { value: text, selectionStart: s, selectionEnd: end } = textarea;
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onRun?.();
      return;
    }
    if (e.key === 'Escape') {
      tabTrap = false;
      return;
    }
    if (e.key === 'Tab' && !e.altKey && !e.ctrlKey && !e.metaKey) {
      if (!tabTrap) {
        tabTrap = true; // let this Tab move focus, then re-arm
        return;
      }
      e.preventDefault();
      if (s === end && !e.shiftKey) {
        edit(s, end, INDENT);
        return;
      }
      // Indent / outdent every selected line.
      const from = lineStart(text, s);
      const block = text.slice(from, end);
      const changed = e.shiftKey
        ? block.replace(/^( {1,2}|\t)/gm, '')
        : block.replace(/^/gm, INDENT);
      edit(from, end, changed, from + changed.length);
      textarea.setSelectionRange(from, from + changed.length);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      const from = lineStart(text, s);
      const lead = text.slice(from, s).match(/^[ \t]*/)[0];
      const before = text[s - 1];
      const after = text[end];
      if (before === '{' && after === '}') {
        // Pressing Enter between braces opens an indented block.
        const insert = `\n${lead}${INDENT}\n${lead}`;
        edit(s, end, insert, s + 1 + lead.length + INDENT.length);
      } else {
        const extra = /[{([]$/.test(text.slice(from, s).trimEnd()) ? INDENT : '';
        edit(s, end, `\n${lead}${extra}`);
      }
    }
  });

  textarea.addEventListener('blur', () => {
    tabTrap = true;
  });

  const api = {
    el,
    textarea,
    getValue: () => textarea.value,
    setValue(next, { undoable = false } = {}) {
      if (undoable) {
        edit(0, textarea.value.length, next);
      } else {
        textarea.value = next;
        paint();
      }
    },
    focus: () => textarea.focus(),
  };
  textarea.value = value;
  paint();
  return api;
}
