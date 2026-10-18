import test from 'node:test';
import assert from 'node:assert/strict';
import { deepEqual, formatLog, inspect } from '../js/core/inspect.js';

test('inspect formats primitives and structures', () => {
  assert.equal(inspect('hi'), '"hi"');
  assert.equal(inspect(undefined), 'undefined');
  assert.equal(inspect(null), 'null');
  assert.equal(inspect(-0), '-0');
  assert.equal(inspect(NaN), 'NaN');
  assert.equal(inspect([1, 'a', [2]]), '[1, "a", [2]]');
  assert.equal(inspect({ a: 1, 'b-c': 2 }), '{ a: 1, "b-c": 2 }');
  assert.equal(inspect(function foo() {}), '[Function: foo]');
  assert.equal(inspect(new Set([1])), 'Set {1}');
  assert.equal(inspect(new Map([['k', 1]])), 'Map {"k" => 1}');
});

test('inspect survives circular structures and long values', () => {
  const a = {};
  a.self = a;
  assert.equal(inspect(a), '{ self: [Circular] }');
  assert.ok(inspect('x'.repeat(1000)).length <= 160);
});

test('formatLog leaves strings raw and inspects the rest', () => {
  assert.equal(formatLog(['a', 1, [2]]), 'a 1 [2]');
});

test('deepEqual compares structurally', () => {
  assert.ok(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] }));
  assert.ok(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 }));
  assert.ok(deepEqual(NaN, NaN));
  assert.ok(deepEqual(0, -0));
  assert.ok(!deepEqual([1, 2], [2, 1]));
  assert.ok(!deepEqual({ a: 1 }, { a: 1, b: undefined }));
  assert.ok(!deepEqual([], {}));
  assert.ok(!deepEqual('1', 1));
  assert.ok(deepEqual(new Set([1, 2]), new Set([2, 1])));
  assert.ok(!deepEqual(new Date(0), new Date(1)));
});
