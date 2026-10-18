import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunner } from '../js/core/runner.js';

// A fake Worker lets us test the main-thread protocol without a browser.
function fakeWorker(behaviour) {
  const w = {
    terminated: false,
    posted: [],
    onmessage: null,
    onerror: null,
    postMessage(msg) {
      this.posted.push(msg);
      behaviour(this, msg);
    },
    terminate() {
      this.terminated = true;
    },
  };
  queueMicrotask(() => w.onmessage?.({ data: { ready: true } }));
  return w;
}

test('sends the code once the worker is ready and resolves with its result', async () => {
  let worker;
  const run = createRunner({
    workerFactory: () => (worker = fakeWorker((w, msg) => w.onmessage({ data: { id: msg.id, ok: true, result: { status: 'pass', passed: 1, total: 1 } } }))),
  });
  const result = await run({ challengeId: 'c', code: 'let x;' });
  assert.equal(result.status, 'pass');
  assert.deepEqual(worker.posted[0], { id: worker.posted[0].id, challengeId: 'c', code: 'let x;' });
  assert.equal(worker.terminated, true);
});

test('a worker that never answers is killed and reported as a timeout', async () => {
  let worker;
  const run = createRunner({ workerFactory: () => (worker = fakeWorker(() => {})), timeoutMs: 30 });
  const result = await run({ challengeId: 'c', code: 'while (true) {}' });
  assert.equal(result.status, 'timeout');
  assert.match(result.error.message, /infinite loop/);
  assert.equal(worker.terminated, true);
});

test('worker crashes become a readable error', async () => {
  const run = createRunner({ workerFactory: () => fakeWorker((w) => w.onerror({ message: 'kaboom' })) });
  const result = await run({ challengeId: 'c', code: '' });
  assert.equal(result.status, 'error');
  assert.match(result.error.message, /kaboom/);
});

test('failing to create a worker explains how to serve the site', async () => {
  const run = createRunner({ workerFactory: () => { throw new Error('no workers'); } });
  const result = await run({ challengeId: 'c', code: '' });
  assert.equal(result.status, 'error');
  assert.match(result.error.message, /http/);
});

test('error replies from the worker are surfaced', async () => {
  const run = createRunner({ workerFactory: () => fakeWorker((w, m) => w.onmessage({ data: { id: m.id, ok: false, error: 'Unknown challenge "zzz"' } })) });
  const result = await run({ challengeId: 'zzz', code: '' });
  assert.equal(result.status, 'error');
  assert.match(result.error.message, /Unknown challenge/);
});

test('messages with a stale id are ignored and each run gets its own worker', async () => {
  const workers = [];
  const run = createRunner({
    workerFactory: () => {
      const w = fakeWorker((self, msg) => {
        self.onmessage({ data: { id: msg.id + 99, ok: true, result: { status: 'stale' } } });
        self.onmessage({ data: { id: msg.id, ok: true, result: { status: 'fail' } } });
      });
      workers.push(w);
      return w;
    },
  });
  const [a, b] = await Promise.all([run({ challengeId: 'c', code: '1' }), run({ challengeId: 'c', code: '2' })]);
  assert.equal(a.status, 'fail');
  assert.equal(b.status, 'fail');
  assert.equal(workers.length, 2);
  assert.ok(workers.every((w) => w.terminated));
});
