import test from 'node:test';
import assert from 'node:assert/strict';
import { createDocument } from '../js/core/minidom.js';

const page = '<div id="app" class="box big"><h1>Title</h1><ul><li class="x">one</li><li>two &amp; three</li></ul><input type="text" disabled></div>';

test('parses HTML and serialises it back', () => {
  const doc = createDocument(page);
  assert.equal(doc.body.innerHTML, '<div id="app" class="box big"><h1>Title</h1><ul><li class="x">one</li><li>two &amp; three</li></ul><input type="text" disabled=""></div>');
  assert.equal(doc.querySelectorAll('li')[1].textContent, 'two & three');
});

test('selectors: id, class, tag, attribute, descendant and child', () => {
  const doc = createDocument(page);
  assert.equal(doc.getElementById('app').tagName, 'DIV');
  assert.equal(doc.querySelectorAll('.box.big').length, 1);
  assert.equal(doc.querySelectorAll('#app li').length, 2);
  assert.equal(doc.querySelectorAll('ul > li.x').length, 1);
  assert.equal(doc.querySelectorAll('div > li').length, 0);
  assert.equal(doc.querySelector('input[type="text"]').hasAttribute('disabled'), true);
  assert.equal(doc.querySelectorAll('h1, li').length, 3);
  assert.equal(doc.querySelector('.missing'), null);
  assert.throws(() => doc.querySelector('!!'), SyntaxError);
});

test('createElement / appendChild / textContent', () => {
  const doc = createDocument('<ul id="l"></ul>');
  const li = doc.createElement('li');
  li.textContent = 'hi <b>';
  doc.getElementById('l').appendChild(li);
  assert.equal(doc.getElementById('l').innerHTML, '<li>hi &lt;b&gt;</li>');
  assert.equal(doc.getElementById('l').children.length, 1);
  li.remove();
  assert.equal(doc.getElementById('l').children.length, 0);
});

test('appending a node moves it', () => {
  const doc = createDocument('<p id="a"><b id="b"></b></p><p id="c"></p>');
  doc.getElementById('c').appendChild(doc.getElementById('b'));
  assert.equal(doc.getElementById('a').children.length, 0);
  assert.equal(doc.getElementById('c').children.length, 1);
});

test('classList, attributes, dataset and style', () => {
  const doc = createDocument('<div id="d" class="a"></div>');
  const d = doc.getElementById('d');
  d.classList.add('b', 'c');
  assert.equal(d.className, 'a b c');
  assert.equal(d.classList.toggle('a'), false);
  assert.equal(d.classList.toggle('a'), true);
  assert.equal(d.classList.contains('b'), true);
  d.classList.remove('b');
  assert.equal(d.className, 'c a');
  d.setAttribute('data-user-id', '7');
  assert.equal(d.dataset.userId, '7');
  d.dataset.fooBar = 'x';
  assert.equal(d.getAttribute('data-foo-bar'), 'x');
  d.style.backgroundColor = 'red';
  assert.match(d.outerHTML, /style="background-color: red;"/);
});

test('events bubble, can be stopped, and click() dispatches', () => {
  const doc = createDocument('<div id="outer"><button id="btn"></button></div>');
  const seen = [];
  doc.getElementById('outer').addEventListener('click', (e) => seen.push(['outer', e.target.id, e.currentTarget.id]));
  doc.getElementById('btn').addEventListener('click', () => seen.push(['btn']));
  doc.getElementById('btn').click();
  assert.deepEqual(seen, [['btn'], ['outer', 'btn', 'outer']]);
  seen.length = 0;
  doc.getElementById('btn').addEventListener('click', (e) => e.stopPropagation());
  doc.getElementById('btn').click();
  assert.deepEqual(seen, [['btn']]);
});

test('innerHTML replaces children; fragments and prepend work', () => {
  const doc = createDocument('<div id="d"><i>old</i></div>');
  const d = doc.getElementById('d');
  d.innerHTML = '<b>new</b><br>text';
  assert.equal(d.innerHTML, '<b>new</b><br>text');
  const frag = doc.createDocumentFragment();
  frag.append('a', doc.createElement('hr'));
  d.prepend(frag);
  assert.equal(d.firstChild.data, 'a');
  assert.equal(d.children[0].tagName, 'HR');
});

test('rejects invalid operations like the real DOM', () => {
  const doc = createDocument('<div id="d"><span id="s"></span></div>');
  assert.throws(() => doc.getElementById('s').appendChild(doc.getElementById('d')), /HierarchyRequestError/);
  assert.throws(() => doc.createElement('1bad'), /InvalidCharacterError/);
  assert.throws(() => doc.getElementById('d').removeChild(doc.createElement('p')), /NotFoundError/);
});
