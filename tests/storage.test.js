import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore, getBackend, readTheme, sanitizeState, STORAGE_KEY, writeTheme } from '../js/core/storage.js';
import { createInitialState } from '../js/core/progress.js';

const memory = () => {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => void data.set(k, String(v)),
    removeItem: (k) => void data.delete(k),
    data,
  };
};
const exploding = () => ({
  getItem() { throw new Error('SecurityError'); },
  setItem() { throw new Error('QuotaExceededError'); },
  removeItem() { throw new Error('SecurityError'); },
});

test('round-trips state through storage', () => {
  const backend = memory();
  const store = createStore(backend);
  const state = { ...createInitialState(), xp: 120 };
  state.challenges.a = { attempts: 2, fails: 1, hintsUsed: 1, completed: true, flawless: false, xpEarned: 20, completedAt: 'x' };
  assert.equal(store.save(state), true);
  assert.deepEqual(store.load(), sanitizeState(state));
  assert.equal(store.load().xp, 120);
  store.reset();
  assert.equal(store.load().xp, 0);
});

test('corrupted JSON falls back to a fresh state', () => {
  const backend = memory();
  backend.setItem(STORAGE_KEY, '{not json');
  assert.deepEqual(createStore(backend).load(), createInitialState());
});

test('a storage backend that throws never crashes the app', () => {
  const store = createStore(exploding());
  assert.deepEqual(store.load(), createInitialState());
  assert.equal(store.save(createInitialState()), false);
  assert.doesNotThrow(() => store.reset());
  assert.equal(readTheme(exploding()), null);
  assert.doesNotThrow(() => writeTheme(exploding(), 'dark'));
});

test('a missing backend gives a non-persistent in-memory store', () => {
  const store = createStore(null);
  assert.equal(store.persistent, false);
  assert.equal(store.save(createInitialState()), false);
  assert.deepEqual(store.load(), createInitialState());
});

test('getBackend returns null when localStorage access throws or is absent', () => {
  assert.equal(getBackend({}), null);
  assert.equal(getBackend({ get localStorage() { throw new Error('blocked'); } }), null);
  assert.equal(getBackend({ localStorage: exploding() }), null);
  const ok = memory();
  assert.equal(getBackend({ localStorage: ok }), ok);
});

test('sanitizeState rejects hostile or malformed data', () => {
  const dirty = sanitizeState({
    xp: -5,
    challenges: { a: { attempts: 'lots', fails: -1, hintsUsed: 2.9, completed: 'yes', xpEarned: 7 }, b: 'nope', c: null },
    drafts: { a: 'ok', b: 42 },
    streak: { current: 3, best: 1, lastDay: 'yesterday' },
    badges: { good: '2026-01-01', bad: 5 },
    stats: { runs: 'x' },
    extra: { evil: true },
  });
  assert.equal(dirty.xp, 0);
  assert.deepEqual(dirty.challenges.a, { attempts: 0, fails: 0, hintsUsed: 2, completed: false, flawless: false, xpEarned: 7 });
  assert.equal('b' in dirty.challenges, false);
  assert.deepEqual(dirty.drafts, { a: 'ok' });
  assert.deepEqual(dirty.streak, { current: 3, best: 3, lastDay: null });
  assert.deepEqual(dirty.badges, { good: '2026-01-01' });
  assert.equal(dirty.stats.runs, 0);
  assert.equal('extra' in dirty, false);
  for (const junk of [null, undefined, 5, 'str', [], true]) assert.deepEqual(sanitizeState(junk), createInitialState());
});

test('theme preference is validated', () => {
  const backend = memory();
  assert.equal(readTheme(backend), null);
  writeTheme(backend, 'light');
  assert.equal(readTheme(backend), 'light');
  backend.setItem('jsquest:theme', 'neon');
  assert.equal(readTheme(backend), null);
});
