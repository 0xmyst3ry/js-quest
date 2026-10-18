import test from 'node:test';
import assert from 'node:assert/strict';
import { runChallenge } from '../js/core/engine.js';

const run = (code, tests, extra = {}) => runChallenge({ code, challenge: { id: 'x', tests, ...extra } });

test('passes when every test matches', async () => {
  const r = await run('function add(a, b) { return a + b; }', [
    { call: 'add', args: [1, 2], expect: 3 },
    { call: 'add', args: [-1, 1], expect: 0 },
  ]);
  assert.equal(r.status, 'pass');
  assert.equal(r.passed, 2);
  assert.equal(r.total, 2);
});

test('reports which tests fail with expected and actual values', async () => {
  const r = await run('function add(a, b) { return a - b; }', [
    { call: 'add', args: [1, 2], expect: 3 },
    { call: 'add', args: [0, 0], expect: 0 },
  ]);
  assert.equal(r.status, 'fail');
  assert.equal(r.passed, 1);
  const bad = r.tests[0];
  assert.equal(bad.pass, false);
  assert.equal(bad.expected, '3');
  assert.equal(bad.actual, '-1');
  assert.match(bad.message, /Expected 3 but got -1/);
  assert.equal(r.tests[1].pass, true);
});

test('evaluates expressions in the scope of top-level let / const / function', async () => {
  const r = await run('const hero = "Ada"; let n = 2; function f() { return n; }', [
    { expr: 'hero', expect: 'Ada' },
    { expr: 'f()', expect: 2 },
  ]);
  assert.equal(r.status, 'pass');
});

test('a syntax error is reported as an error with a readable message', async () => {
  const r = await run('function (', [{ expr: '1', expect: 1 }]);
  assert.equal(r.status, 'error');
  assert.equal(r.error.name, 'SyntaxError');
  assert.equal(r.tests[0].pass, false);
  assert.match(r.tests[0].message, /SyntaxError/);
});

test('a runtime error at load time fails every test', async () => {
  const r = await run('throw new TypeError("boom");', [{ expr: '1', expect: 1 }]);
  assert.equal(r.status, 'error');
  assert.equal(r.error.message, 'boom');
});

test('a missing function is reported helpfully', async () => {
  const r = await run('const x = 1;', [{ call: 'nope', args: [], expect: 1 }]);
  assert.equal(r.status, 'fail');
  assert.match(r.tests[0].message, /ReferenceError/);
  assert.match(r.tests[0].message, /declared with the exact name/);
});

test('a non-function under the expected name is reported', async () => {
  const r = await run('const add = 5;', [{ call: 'add', args: [], expect: 1 }]);
  assert.match(r.tests[0].message, /should be a function/);
});

test('captures console output and compares it in order', async () => {
  const r = await run('console.log("a"); console.log(1, {x: 2}); console.warn("w");', [
    { logs: true, expect: ['a', '1 { x: 2 }'] },
  ]);
  assert.equal(r.status, 'pass');
  assert.deepEqual(r.logs.map((l) => [l.level, l.text]), [['log', 'a'], ['log', '1 { x: 2 }'], ['warn', 'w']]);
});

test('waits for timers when a test has `wait`', async () => {
  const code = 'console.log("1"); setTimeout(() => console.log("3"), 20); console.log("2");';
  const ok = await run(code, [{ logs: true, wait: 80, expect: ['1', '2', '3'] }]);
  assert.equal(ok.status, 'pass');
  const early = await run(code, [{ logs: true, expect: ['1', '2', '3'] }]);
  assert.equal(early.status, 'fail');
});

test('awaits promises returned by functions', async () => {
  const r = await run('async function f(x) { await null; return x * 2; }', [{ call: 'f', args: [4], expect: 8 }]);
  assert.equal(r.status, 'pass');
});

test('a promise that never settles times out instead of hanging', async () => {
  const r = await run('function f() { return new Promise(() => {}); }', [{ call: 'f', args: [], expect: 1, timeout: 50 }]);
  assert.equal(r.status, 'fail');
  assert.match(r.tests[0].message, /Timed out/);
});

test('every test runs against fresh state', async () => {
  const r = await run('let n = 0; function inc() { return ++n; }', [
    { call: 'inc', args: [], expect: 1 },
    { call: 'inc', args: [], expect: 1 },
  ]);
  assert.equal(r.status, 'pass');
});

test('timers left behind by one test are cancelled', async () => {
  const r = await run('setInterval(() => console.log("tick"), 5);', [{ logs: true, wait: 30, expect: [] }]);
  assert.equal(r.status, 'fail'); // ticked at least once, proving the timer ran
  await new Promise((res) => setTimeout(res, 40)); // nothing should keep ticking forever (process would hang)
});

test('hidden tests do not leak expected values', async () => {
  const r = await run('function f() { return 1; }', [{ call: 'f', args: [], expect: 99, hidden: true }]);
  assert.equal(r.tests[0].name, 'Hidden test 1');
  assert.equal(r.tests[0].expected, undefined);
  assert.doesNotMatch(r.tests[0].message, /99/);
});

test('custom `check` functions can return a message', async () => {
  const r = await run('const v = 3;', [{ expr: 'v', check: (actual) => (actual > 5 ? true : 'too small') }]);
  assert.equal(r.tests[0].message, 'too small');
});

test('network APIs are shadowed inside learner code', async () => {
  const r = await run('const t = typeof fetch;', [{ expr: 't', expect: 'undefined' }]);
  assert.equal(r.status, 'pass');
});

test('DOM challenges get a fresh document each test', async () => {
  const ch = { dom: '<button id="b">x</button><i id="n">0</i>' };
  const code = 'document.getElementById("b").addEventListener("click", () => { const n = document.getElementById("n"); n.textContent = +n.textContent + 1; });';
  const r = await run(
    code,
    [
      { setup: 'document.getElementById("b").click()', expr: 'document.getElementById("n").textContent', expect: '1' },
      { setup: 'document.getElementById("b").click()', expr: 'document.getElementById("n").textContent', expect: '1' },
    ],
    ch,
  );
  assert.equal(r.status, 'pass');
  assert.match(r.dom, /<i id="n">0<\/i>/);
});

test('wrong answers that look plausible still fail', async () => {
  const r = await run('function isEven(n) { return n % 2 == 0 && n > 0; }', [
    { call: 'isEven', args: [4], expect: true },
    { call: 'isEven', args: [-8], expect: true },
  ]);
  assert.equal(r.status, 'fail');
  assert.deepEqual(r.tests.map((t) => t.pass), [true, false]);
});

test('timer functions are never invoked with a foreign `this` (browsers throw "Illegal invocation")', async () => {
  const realSet = globalThis.setTimeout;
  const realClear = globalThis.clearTimeout;
  const strict = (fn) =>
    function (...args) {
      if (this !== undefined && this !== globalThis) throw new TypeError('Illegal invocation');
      return fn(...args);
    };
  globalThis.setTimeout = strict(realSet);
  globalThis.clearTimeout = strict(realClear);
  try {
    const r = await run('setTimeout(() => console.log("x"), 5); const id = setTimeout(() => {}, 1000); clearTimeout(id);', [
      { logs: true, wait: 30, expect: ['x'] },
    ]);
    assert.equal(r.status, 'pass', JSON.stringify(r.tests));
  } finally {
    globalThis.setTimeout = realSet;
    globalThis.clearTimeout = realClear;
  }
});
