// The challenge engine: runs learner code against a challenge's test cases.
// It is environment-agnostic (Web Worker in the browser, plain Node in tests)
// and returns a result that is safe to structured-clone across postMessage.
//
// Every test gets a *fresh* execution of the learner's code (fresh scope,
// console, timers and DOM), so tests can never leak state into each other.

import { deepEqual, formatLog, inspect } from './inspect.js';
import { createDocument, Event as MiniEvent } from './minidom.js';

const DEFAULT_TEST_TIMEOUT = 1500;
const MAX_LOG_LINES = 200;

// Network and messaging APIs are shadowed so lesson code can't reach them.
const BLOCKED = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'postMessage'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms waiting for ${label}`)), ms);
  });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer));
}

function describeError(err) {
  if (err && typeof err === 'object') return { name: String(err.name ?? 'Error'), message: String(err.message ?? err) };
  return { name: 'Error', message: String(err) };
}

/** Run the learner's source once. Returns an `evaluate(src)` bound to its scope. */
function instantiate(code, challenge) {
  const logs = [];
  const timers = new Set();
  const push = (level) => (...args) => {
    if (logs.length < MAX_LOG_LINES) logs.push({ level, text: formatLog(args) });
  };
  const sandboxConsole = {
    log: push('log'),
    info: push('log'),
    debug: push('log'),
    warn: push('warn'),
    error: push('error'),
  };
  const track = (setter, clearer) => ({
    set: (fn, ms, ...rest) => {
      const id = setter(typeof fn === 'function' ? fn : () => {}, ms, ...rest);
      timers.add({ id, clearer });
      return id;
    },
  });
  const timeoutApi = track(setTimeout, clearTimeout);
  const intervalApi = track(setInterval, clearInterval);

  const document = challenge.dom === undefined ? undefined : createDocument(challenge.dom);
  const scope = {
    console: sandboxConsole,
    setTimeout: timeoutApi.set,
    setInterval: intervalApi.set,
    clearTimeout,
    clearInterval,
    document,
    Event: MiniEvent,
  };
  const names = [...Object.keys(scope), ...BLOCKED];
  const values = [...Object.values(scope), ...BLOCKED.map(() => undefined)];

  const dispose = () => {
    for (const t of timers) t.clearer(t.id);
    timers.clear();
  };

  let evaluate = null;
  let loadError = null;
  try {
    // The trailing eval closure gives tests direct access to the learner's
    // top-level `let` / `const` / `function` bindings.
    const fn = new Function(...names, `${code}\n;return (__src) => eval(__src);`);
    evaluate = fn(...values);
  } catch (err) {
    loadError = err;
  }
  return { evaluate, loadError, logs, document, dispose };
}

function friendlyError(err) {
  const { name, message } = describeError(err);
  return `${name}: ${message}`;
}

function defaultName(t) {
  const shown = 'expect' in t ? ` should be ${inspect(t.expect)}` : '';
  if (t.logs) return 'console output';
  if (t.call) {
    const args = t.argsSrc ?? (t.args ?? []).map((a) => inspect(a)).join(', ');
    return `${t.call}(${t.argsSrc ? '…' : args})${shown}`;
  }
  return `${t.expr}${shown}`;
}

async function runOne(code, challenge, t, index) {
  const label = t.hidden ? `Hidden test ${index + 1}` : t.name ?? defaultName(t);
  const base = { name: label, hidden: Boolean(t.hidden) };
  const run = instantiate(code, challenge);
  try {
    if (run.loadError) {
      return { ...base, pass: false, loadError: true, message: friendlyError(run.loadError) };
    }
    const limit = t.timeout ?? challenge.timeout ?? DEFAULT_TEST_TIMEOUT;
    if (t.setup) await withTimeout(run.evaluate(t.setup), limit, 'the setup step');
    if (t.wait) await sleep(t.wait);

    let actual;
    if (t.logs) {
      actual = run.logs.filter((l) => l.level === 'log').map((l) => l.text);
    } else if (t.call) {
      const fn = run.evaluate(t.call);
      if (typeof fn !== 'function') {
        return { ...base, pass: false, message: `\`${t.call}\` is ${inspect(fn)}, but it should be a function.` };
      }
      const args = t.argsSrc ? run.evaluate(t.argsSrc) : structuredClone(t.args ?? []);
      actual = await withTimeout(fn(...args), limit, `${t.call}() to finish`);
    } else {
      actual = await withTimeout(run.evaluate(t.expr), limit, `\`${t.expr}\``);
    }

    if (t.check) {
      const verdict = t.check(actual, { deepEqual, inspect, logs: run.logs, document: run.document });
      if (verdict === true) return { ...base, pass: true };
      return { ...base, pass: false, message: t.hidden ? 'This hidden case failed.' : typeof verdict === 'string' ? verdict : `Got ${inspect(actual)}` };
    }
    if (deepEqual(actual, t.expect)) return { ...base, pass: true };
    return {
      ...base,
      pass: false,
      expected: t.hidden ? undefined : inspect(t.expect),
      actual: t.hidden ? undefined : inspect(actual),
      message: t.hidden ? 'This hidden case failed.' : `Expected ${inspect(t.expect)} but got ${inspect(actual)}`,
    };
  } catch (err) {
    const { name, message } = describeError(err);
    let hint = '';
    if (name === 'ReferenceError') hint = ' (is it declared with the exact name from the task?)';
    return { ...base, pass: false, message: t.hidden ? 'This hidden case threw an error.' : `${name}: ${message}${hint}` };
  } finally {
    run.dispose();
  }
}

/**
 * Execute `code` against `challenge`.
 * @returns {Promise<{status:'pass'|'fail'|'error', passed:number, total:number,
 *   tests:object[], logs:object[], error:object|null, dom:string|null}>}
 */
export async function runChallenge({ code, challenge }) {
  const source = String(code ?? '');

  // A preview run for the console panel (also surfaces load-time errors once).
  const preview = instantiate(source, challenge);
  const settle = Math.min(1000, Math.max(0, ...challenge.tests.map((t) => t.wait ?? 0)));
  if (!preview.loadError && settle > 0) await sleep(settle);
  const logs = preview.logs.slice();
  const dom = preview.document ? preview.document.body.innerHTML : null;
  const error = preview.loadError ? describeError(preview.loadError) : null;
  preview.dispose();

  const tests = await Promise.all(challenge.tests.map((t, i) => runOne(source, challenge, t, i)));
  const passed = tests.filter((t) => t.pass).length;
  const status = error ? 'error' : passed === tests.length ? 'pass' : 'fail';
  return { status, passed, total: tests.length, tests, logs, error, dom };
}
