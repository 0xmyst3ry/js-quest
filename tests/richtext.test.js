import test from 'node:test';
import assert from 'node:assert/strict';
import { parse, parseInline } from '../js/ui/richtext.js';
import { tokenize } from '../js/ui/highlight.js';

test('parseInline understands code and bold', () => {
  assert.deepEqual(parseInline('a `b` **c** d'), [
    { t: 'text', v: 'a ' }, { t: 'code', v: 'b' }, { t: 'text', v: ' ' }, { t: 'bold', v: 'c' }, { t: 'text', v: ' d' },
  ]);
  assert.deepEqual(parseInline('plain'), [{ t: 'text', v: 'plain' }]);
});

test('parse builds paragraphs, lists and fenced code', () => {
  const blocks = parse('Hello\nworld\n\n- one\n- two `x`\n\n```js\nlet a = 1;\n\nlet b;\n```\n\nEnd');
  assert.deepEqual(blocks.map((b) => b.type), ['p', 'ul', 'code', 'p']);
  assert.equal(blocks[0].inline[0].v, 'Hello world');
  assert.equal(blocks[1].items.length, 2);
  assert.equal(blocks[2].text, 'let a = 1;\n\nlet b;');
});

test('an unterminated code fence does not hang or throw', () => {
  const blocks = parse('```js\nlet a');
  assert.equal(blocks[0].type, 'code');
});

test('HTML in lesson text stays literal text', () => {
  const [p] = parse('<img src=x onerror=alert(1)>');
  assert.equal(p.inline[0].v, '<img src=x onerror=alert(1)>');
});

test('tokenizer classifies code and always round-trips the input', () => {
  const src = 'const n = 42; // hi\nfunction f(a) { return "s" + `t${a}` + /* c */ true; }\n';
  const toks = tokenize(src);
  assert.equal(toks.map((t) => t.text).join(''), src);
  const types = Object.fromEntries(toks.map((t) => [t.text, t.type]));
  assert.equal(types.const, 'kw');
  assert.equal(types['42'], 'num');
  assert.equal(types['// hi'], 'com');
  assert.equal(types.f, 'fn');
  assert.equal(types['"s"'], 'str');
  assert.equal(types.true, 'lit');
});

test('tokenizer survives unterminated strings and comments', () => {
  for (const src of ['"open', "'open", '`open', '/* open', 'a = ', '', '\n\n']) {
    assert.equal(tokenize(src).map((t) => t.text).join(''), src);
  }
});
