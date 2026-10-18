import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearDraft, createInitialState, dayKey, daysBetween, entryFor, hintCost, levelInfo, nextHintCost, nextUp,
  overallProgress, recordAttempt, revealHint, rewardFor, saveDraft, touchStreak, visibleStreak, worldProgress, xpForLevel,
} from '../js/core/progress.js';

// A small fake catalog keeps these tests independent of the real course content.
const mk = (id, xp = 40) => ({ id, xp, hints: ['h1', 'h2', 'h3'], title: id });
const w1 = { id: 'w1', name: 'World One', glyph: 'W1', blurb: '', challenges: [mk('a', 20), mk('b', 30)] };
const w2 = { id: 'w2', name: 'World Two', glyph: 'W2', blurb: '', challenges: [mk('c', 50)] };
const catalog = { worlds: [w1, w2], challenges: [...w1.challenges, ...w2.challenges] };
const [A, B, C] = catalog.challenges;
const pass = { status: 'pass' };
const fail = { status: 'fail' };
const at = (iso) => new Date(`${iso}T12:00:00`);

test('level thresholds follow 0, 100, 300, 600, 1000…', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(xpForLevel), [0, 100, 300, 600, 1000]);
  assert.equal(levelInfo(0).level, 1);
  assert.equal(levelInfo(99).level, 1);
  assert.equal(levelInfo(100).level, 2);
  assert.equal(levelInfo(299).level, 2);
  assert.equal(levelInfo(300).level, 3);
  assert.equal(levelInfo(1000).level, 5);
});

test('levelInfo reports progress inside the level and clamps bad input', () => {
  const info = levelInfo(150);
  assert.equal(info.level, 2);
  assert.equal(info.xpIntoLevel, 50);
  assert.equal(info.xpForNext, 200);
  assert.equal(info.progress, 0.25);
  assert.equal(levelInfo(-50).level, 1);
  assert.equal(levelInfo(NaN).xp, 0);
  assert.equal(levelInfo(10 ** 7).title, 'Astral Legend');
});

test('first clear pays base XP plus the flawless bonus', () => {
  const { state, outcome } = recordAttempt(createInitialState(), A, pass, catalog, at('2026-03-01'));
  assert.equal(outcome.firstClear, true);
  assert.equal(outcome.reward.flawless, true);
  assert.equal(outcome.xpGained, 30); // 20 + 10
  assert.equal(state.xp, 30);
  assert.equal(state.challenges.a.completed, true);
  assert.equal(state.challenges.a.flawless, true);
});

test('failed runs give no XP and are counted', () => {
  let s = createInitialState();
  ({ state: s } = recordAttempt(s, A, fail, catalog));
  ({ state: s } = recordAttempt(s, A, { status: 'error' }, catalog));
  assert.equal(s.xp, 0);
  assert.equal(s.challenges.a.attempts, 2);
  assert.equal(s.challenges.a.fails, 2);
  assert.equal(s.challenges.a.completed, false);
  assert.equal(s.stats.runs, 2);
});

test('clearing after a failed run loses the flawless bonus', () => {
  let s = createInitialState();
  ({ state: s } = recordAttempt(s, A, fail, catalog));
  const { state, outcome } = recordAttempt(s, A, pass, catalog);
  assert.equal(outcome.xpGained, 20);
  assert.equal(state.xp, 20);
});

test('replaying a cleared challenge never pays twice', () => {
  let s = createInitialState();
  ({ state: s } = recordAttempt(s, A, pass, catalog));
  const xp = s.xp;
  const { state, outcome } = recordAttempt(s, A, pass, catalog);
  assert.equal(outcome.firstClear, false);
  assert.equal(outcome.xpGained, 0);
  assert.equal(state.xp, xp);
});

test('hints reduce the reward and the cost is announced before it is paid', () => {
  let s = createInitialState();
  const cost1 = nextHintCost(s, B); // 20% of 30 = 6, plus the 10 XP flawless bonus
  assert.equal(hintCost(B), 6);
  assert.equal(cost1, 16);
  const r1 = revealHint(s, B);
  assert.equal(r1.cost, 16);
  assert.equal(r1.text, 'h1');
  assert.equal(r1.index, 0);
  assert.equal(nextHintCost(r1.state, B), 6); // later hints only cost the penalty
  const r2 = revealHint(r1.state, B);
  assert.equal(r2.text, 'h2');
  const { outcome } = recordAttempt(r2.state, B, pass, catalog);
  assert.equal(outcome.reward.penalty, 12);
  assert.equal(outcome.reward.bonus, 0);
  assert.equal(outcome.xpGained, 18);
});

test('hints cannot push a reward below 25% of base', () => {
  const stingy = { id: 's', xp: 100, hints: ['1', '2', '3'] };
  const hints = { ...createInitialState(), challenges: { s: { attempts: 0, fails: 0, hintsUsed: 3, completed: false } } };
  assert.equal(rewardFor(stingy, entryFor(hints, 's')).total, 100 - 60);
  const many = rewardFor({ ...stingy, xp: 20 }, { attempts: 5, hintsUsed: 99 });
  assert.equal(many.total, 5);
  assert.ok(many.total > 0);
});

test('revealing past the last hint is a free no-op', () => {
  let s = createInitialState();
  for (let i = 0; i < 3; i++) ({ state: s } = revealHint(s, A));
  const again = revealHint(s, A);
  assert.equal(again.exhausted, true);
  assert.equal(again.cost, 0);
  assert.equal(again.state, s);
});

test('hints on an already-cleared challenge are free', () => {
  let s = createInitialState();
  ({ state: s } = recordAttempt(s, A, pass, catalog));
  assert.equal(nextHintCost(s, A), 0);
  assert.equal(revealHint(s, A).cost, 0);
});

test('state is never mutated in place', () => {
  const s = createInitialState();
  const frozen = JSON.stringify(s);
  recordAttempt(s, A, pass, catalog);
  revealHint(s, A);
  saveDraft(s, 'a', 'code');
  assert.equal(JSON.stringify(s), frozen);
});

test('level-ups are reported', () => {
  const s = { ...createInitialState(), xp: 95 };
  const { outcome, state } = recordAttempt(s, C, pass, catalog);
  assert.equal(outcome.levelBefore, 1);
  assert.equal(outcome.levelAfter, 2);
  assert.equal(outcome.leveledUp, true);
  assert.equal(state.xp, 155);
});

test('streak: same day, consecutive days, and gaps', () => {
  assert.deepEqual(touchStreak({ current: 0, best: 0, lastDay: null }, '2026-03-01'), { current: 1, best: 1, lastDay: '2026-03-01' });
  assert.deepEqual(touchStreak({ current: 1, best: 1, lastDay: '2026-03-01' }, '2026-03-01'), { current: 1, best: 1, lastDay: '2026-03-01' });
  assert.deepEqual(touchStreak({ current: 1, best: 1, lastDay: '2026-03-01' }, '2026-03-02'), { current: 2, best: 2, lastDay: '2026-03-02' });
  assert.deepEqual(touchStreak({ current: 5, best: 5, lastDay: '2026-03-01' }, '2026-03-04'), { current: 1, best: 5, lastDay: '2026-03-04' });
});

test('streak handles month, year and DST boundaries', () => {
  assert.equal(daysBetween('2026-02-28', '2026-03-01'), 1);
  assert.equal(daysBetween('2025-12-31', '2026-01-01'), 1);
  assert.equal(daysBetween('2026-03-07', '2026-03-09'), 2);
  assert.equal(daysBetween('2026-03-28', '2026-03-30'), 2);
  assert.equal(daysBetween('2026-11-01', '2026-11-02'), 1);
  assert.equal(dayKey(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
});

test('visibleStreak drops to 0 after a missed day but survives "yesterday"', () => {
  const streak = { current: 4, best: 4, lastDay: '2026-03-10' };
  assert.equal(visibleStreak(streak, '2026-03-10'), 4);
  assert.equal(visibleStreak(streak, '2026-03-11'), 4);
  assert.equal(visibleStreak(streak, '2026-03-12'), 0);
  assert.equal(visibleStreak({ current: 0, best: 0, lastDay: null }, '2026-03-12'), 0);
  assert.equal(visibleStreak(streak, '2026-03-01'), 0); // clock moved backwards
});

test('only passing runs extend the streak', () => {
  let s = createInitialState();
  ({ state: s } = recordAttempt(s, A, fail, catalog, at('2026-03-01')));
  assert.equal(s.streak.current, 0);
  ({ state: s } = recordAttempt(s, A, pass, catalog, at('2026-03-01')));
  ({ state: s } = recordAttempt(s, B, pass, catalog, at('2026-03-02')));
  assert.equal(s.streak.current, 2);
  assert.equal(recordAttempt(s, C, pass, catalog, at('2026-03-02')).outcome.streak, 2);
});

test('badges: first clear, world clear and completionist are awarded once', () => {
  let s = createInitialState();
  let out;
  ({ state: s, outcome: out } = recordAttempt(s, A, pass, catalog));
  assert.deepEqual(out.newBadges.map((b) => b.id), ['first-light']);
  ({ state: s, outcome: out } = recordAttempt(s, B, pass, catalog));
  assert.deepEqual(out.newBadges.map((b) => b.id), ['world-w1']);
  assert.equal(out.completedAll, false);
  ({ state: s, outcome: out } = recordAttempt(s, C, pass, catalog));
  assert.ok(out.newBadges.map((b) => b.id).includes('world-w2'));
  assert.ok(out.newBadges.map((b) => b.id).includes('cartographer'));
  assert.equal(out.completedAll, true);
  ({ outcome: out } = recordAttempt(s, C, pass, catalog));
  assert.deepEqual(out.newBadges, []);
});

test('badge: never-give-up needs five failed runs before the clear', () => {
  let s = createInitialState();
  for (let i = 0; i < 4; i++) ({ state: s } = recordAttempt(s, A, fail, catalog));
  let out;
  ({ state: s, outcome: out } = recordAttempt(s, A, pass, catalog));
  assert.ok(!out.newBadges.some((b) => b.id === 'never-give-up'));
  for (let i = 0; i < 5; i++) ({ state: s } = recordAttempt(s, B, fail, catalog));
  ({ outcome: out } = recordAttempt(s, B, pass, catalog));
  assert.ok(out.newBadges.some((b) => b.id === 'never-give-up'));
});

test('badge: streak and level badges', () => {
  let s = createInitialState();
  const days = ['2026-03-01', '2026-03-02', '2026-03-03'];
  let out;
  for (const d of days) ({ state: s, outcome: out } = recordAttempt(s, A, pass, catalog, at(d)));
  assert.ok(s.badges['on-a-roll']);
  const rich = { ...createInitialState(), xp: 290 };
  ({ outcome: out } = recordAttempt(rich, C, pass, catalog));
  assert.ok(out.newBadges.some((b) => b.id === 'rising-star'));
});

test('progress queries', () => {
  let s = createInitialState();
  assert.equal(nextUp(s, catalog).id, 'a');
  ({ state: s } = recordAttempt(s, A, pass, catalog));
  assert.deepEqual(worldProgress(s, w1), { done: 1, total: 2, complete: false });
  assert.equal(nextUp(s, catalog).id, 'b');
  ({ state: s } = recordAttempt(s, B, pass, catalog));
  ({ state: s } = recordAttempt(s, C, pass, catalog));
  assert.deepEqual(overallProgress(s, catalog), { done: 3, total: 3, complete: true });
  assert.equal(nextUp(s, catalog), null);
});

test('drafts can be saved and cleared', () => {
  let s = saveDraft(createInitialState(), 'a', 'let x = 1;');
  assert.equal(s.drafts.a, 'let x = 1;');
  s = clearDraft(s, 'a');
  assert.equal('a' in s.drafts, false);
});
