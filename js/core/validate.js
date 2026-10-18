// Catalog validation shared by `npm run validate` and the test-suite.
import { runChallenge } from './engine.js';

const isNonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;

/** Static checks on one challenge definition. Returns a list of problems. */
export function checkShape(c) {
  const p = [];
  const at = (msg) => p.push(`${c.id ?? '(no id)'}: ${msg}`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.id ?? '')) at('id must be kebab-case');
  for (const key of ['title', 'intro', 'task', 'solution']) if (!isNonEmpty(c[key])) at(`missing ${key}`);
  if (typeof c.starter !== 'string') at('missing starter');
  if (!Number.isInteger(c.xp) || c.xp < 5 || c.xp > 200) at('xp must be an integer between 5 and 200');
  if (!Array.isArray(c.hints) || c.hints.length < 1 || c.hints.length > 3 || !c.hints.every(isNonEmpty)) {
    at('hints must be 1-3 non-empty strings');
  }
  if (!Array.isArray(c.tests) || c.tests.length === 0) at('needs at least one test');
  else {
    c.tests.forEach((t, i) => {
      const kinds = ['expr', 'call', 'logs'].filter((k) => t[k] !== undefined);
      if (kinds.length !== 1) at(`test ${i + 1} needs exactly one of expr / call / logs`);
      if (!('expect' in t) && !t.check) at(`test ${i + 1} needs expect or check`);
    });
  }
  return p;
}

/** Full validation: shapes, id uniqueness, solution passes, starter fails. */
export async function validateCatalog({ worlds, challenges }) {
  const problems = [];
  const seen = new Set();
  const worldIds = new Set();
  for (const w of worlds) {
    if (worldIds.has(w.id)) problems.push(`duplicate world id ${w.id}`);
    worldIds.add(w.id);
    for (const key of ['name', 'glyph', 'blurb']) if (!isNonEmpty(w[key])) problems.push(`world ${w.id}: missing ${key}`);
    if (!w.challenges?.length) problems.push(`world ${w.id}: has no challenges`);
  }
  for (const c of challenges) {
    if (seen.has(c.id)) problems.push(`duplicate challenge id ${c.id}`);
    seen.add(c.id);
    const shape = checkShape(c);
    problems.push(...shape);
    if (shape.length) continue;

    const solved = await runChallenge({ code: c.solution, challenge: c });
    if (solved.status !== 'pass') {
      const failing = solved.tests.filter((t) => !t.pass).map((t) => `${t.name} → ${t.message}`);
      problems.push(`${c.id}: reference solution fails: ${solved.error ? `${solved.error.name}: ${solved.error.message}` : failing.join('; ')}`);
    }
    const starter = await runChallenge({ code: c.starter, challenge: c });
    if (starter.status === 'pass') problems.push(`${c.id}: starter code already passes every test`);
  }
  return problems;
}
