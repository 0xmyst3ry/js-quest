import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../js/data/catalog.js';
import { runChallenge } from '../js/core/engine.js';
import { checkShape, validateCatalog } from '../js/core/validate.js';
import { wrongSolutions } from './fixtures/wrong-solutions.js';

test('the catalog has roughly 30+ challenges across 11 worlds', () => {
  assert.equal(catalog.worlds.length, 11);
  assert.ok(catalog.challenges.length >= 30, `only ${catalog.challenges.length} challenges`);
});

test('every challenge is well formed, its reference solution passes, its starter does not', async () => {
  const problems = await validateCatalog(catalog);
  assert.deepEqual(problems, []);
});

for (const c of catalog.challenges) {
  test(`reference solution passes every test: ${c.id}`, async () => {
    const r = await runChallenge({ code: c.solution, challenge: c });
    assert.equal(r.status, 'pass', JSON.stringify(r.tests.filter((t) => !t.pass)));
    assert.equal(r.passed, c.tests.length);
  });
}

test('every challenge has at least one known-wrong solution that is rejected', async () => {
  const missing = catalog.challenges.filter((c) => !wrongSolutions[c.id]).map((c) => c.id);
  assert.deepEqual(missing, [], 'add entries to test./fixtures/wrong-solutions.js');
  for (const c of catalog.challenges) {
    for (const code of wrongSolutions[c.id]) {
      const r = await runChallenge({ code, challenge: c });
      assert.notEqual(r.status, 'pass', `${c.id} accepted a wrong solution: ${code}`);
    }
  }
});

test('checkShape catches malformed challenges', () => {
  const good = catalog.challenges[0];
  assert.deepEqual(checkShape(good), []);
  assert.ok(checkShape({ ...good, id: 'Bad Id' }).length > 0);
  assert.ok(checkShape({ ...good, hints: [] }).length > 0);
  assert.ok(checkShape({ ...good, xp: 0 }).length > 0);
  assert.ok(checkShape({ ...good, tests: [{ expr: 'a', call: 'b', expect: 1 }] }).length > 0);
  assert.ok(checkShape({ ...good, tests: [{ expr: 'a' }] }).length > 0);
});

test('validateCatalog flags a broken reference solution and a trivially passing starter', async () => {
  const base = catalog.challenges[0];
  const broken = { ...base, solution: 'let hero = "nope";' };
  const trivial = { ...base, id: 'trivial', starter: base.solution };
  const problems = await validateCatalog({
    worlds: catalog.worlds.slice(0, 1),
    challenges: [broken, trivial, { ...base }],
  });
  assert.ok(problems.some((p) => /reference solution fails/.test(p)));
  assert.ok(problems.some((p) => /starter code already passes/.test(p)));
  assert.ok(problems.some((p) => /duplicate challenge id/.test(p)));
});

test('challenge ids are unique and links between worlds are consistent', () => {
  const ids = catalog.challenges.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const w of catalog.worlds) {
    assert.ok(w.challenges.length >= 3, `${w.id} has fewer than 3 challenges`);
    assert.equal(w.challenges.filter((c) => c.boss).length, 1, `${w.id} should end with exactly one boss`);
    assert.equal(w.challenges.at(-1).boss, true);
  }
});
