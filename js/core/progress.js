// Pure game logic: XP, levels, hints, streaks and badges.
// Nothing here touches the DOM or storage, so it is trivial to test.
// Every function returns a *new* state object instead of mutating its input.

import { allBadges } from '../data/badges.js';

export const STATE_VERSION = 1;
export const LEVEL_TITLES = ['Stargazer', 'Apprentice', 'Scripter', 'Coder', 'Navigator', 'Wizard', 'Archmage', 'Astral Legend'];
const FLAWLESS_BONUS = 10;
const HINT_COST_RATE = 0.2; // each hint costs 20% of the challenge's base XP
const MIN_REWARD_RATE = 0.25; // hints can never reduce a reward below 25%

export function createInitialState() {
  return {
    version: STATE_VERSION,
    xp: 0,
    challenges: {}, // id -> { attempts, fails, hintsUsed, completed, flawless, xpEarned, completedAt }
    drafts: {}, // id -> code
    streak: { current: 0, best: 0, lastDay: null },
    badges: {}, // id -> ISO date earned
    stats: { runs: 0 },
  };
}

// ---- levels -----------------------------------------------------------

/** XP needed to *reach* a level: 0, 100, 300, 600, 1000, 1500, … */
export const xpForLevel = (level) => (100 * (level - 1) * level) / 2;

export function levelInfo(xp) {
  const safe = Math.max(0, Math.floor(xp) || 0);
  const level = Math.floor((1 + Math.sqrt(1 + (8 * safe) / 100)) / 2);
  const floor = xpForLevel(level);
  const ceiling = xpForLevel(level + 1);
  return {
    level,
    title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)],
    xp: safe,
    xpIntoLevel: safe - floor,
    xpForNext: ceiling - floor,
    progress: (safe - floor) / (ceiling - floor),
  };
}

// ---- hints & rewards --------------------------------------------------

export const hintCost = (challenge) => Math.max(1, Math.round(challenge.xp * HINT_COST_RATE));

export function entryFor(state, id) {
  return state.challenges[id] ?? { attempts: 0, fails: 0, hintsUsed: 0, completed: false, flawless: false, xpEarned: 0 };
}

/** What a first clear would pay right now, given hints used and attempts so far. */
export function rewardFor(challenge, entry) {
  const base = challenge.xp;
  const penalty = Math.min(entry.hintsUsed * hintCost(challenge), base - Math.ceil(base * MIN_REWARD_RATE));
  const flawless = entry.hintsUsed === 0 && entry.attempts === 0; // attempts are counted *before* this run
  const bonus = flawless ? FLAWLESS_BONUS : 0;
  return { base, penalty, bonus, flawless, total: base - penalty + bonus };
}

/** XP the learner would lose by opening the next hint (0 once cleared or out of hints). */
export function nextHintCost(state, challenge) {
  const entry = entryFor(state, challenge.id);
  if (entry.completed || entry.hintsUsed >= challenge.hints.length) return 0;
  return rewardFor(challenge, entry).total - rewardFor(challenge, { ...entry, hintsUsed: entry.hintsUsed + 1 }).total;
}

/** Reveal the next hint. Returns { state, index, text, cost, exhausted }. */
export function revealHint(state, challenge) {
  const entry = entryFor(state, challenge.id);
  if (entry.hintsUsed >= challenge.hints.length) {
    return { state, index: entry.hintsUsed - 1, text: challenge.hints[challenge.hints.length - 1], cost: 0, exhausted: true };
  }
  const cost = nextHintCost(state, challenge);
  const next = clone(state);
  next.challenges[challenge.id] = { ...entry, hintsUsed: entry.hintsUsed + 1 };
  return { state: next, index: entry.hintsUsed, text: challenge.hints[entry.hintsUsed], cost, exhausted: false };
}

// ---- streaks ----------------------------------------------------------

const DAY_MS = 86_400_000;

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Whole days between two YYYY-MM-DD keys (DST-safe: compares UTC midnights). */
export function daysBetween(a, b) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / DAY_MS);
}

/** Streak after practising on `today`. */
export function touchStreak(streak, today) {
  if (streak.lastDay === today) return { ...streak };
  const gap = streak.lastDay ? daysBetween(streak.lastDay, today) : null;
  const current = gap === 1 ? streak.current + 1 : 1;
  return { current, best: Math.max(streak.best, current), lastDay: today };
}

/** The streak to *display* today: a missed day makes it read 0 (until you practise). */
export function visibleStreak(streak, today) {
  if (!streak.lastDay) return 0;
  const gap = daysBetween(streak.lastDay, today);
  return gap <= 1 && gap >= 0 ? streak.current : 0;
}

// ---- attempts ---------------------------------------------------------

/**
 * Record one run of a challenge.
 * @param state   current state
 * @param challenge  catalog entry
 * @param result  runner result ({ status })
 * @param catalog { worlds, challenges } (for world / completionist badges)
 * @param now     Date (injectable for tests)
 * @returns {{ state, outcome }} outcome describes what to celebrate
 */
export function recordAttempt(state, challenge, result, catalog, now = new Date()) {
  const next = clone(state);
  const before = entryFor(state, challenge.id);
  const passed = result.status === 'pass';
  const levelBefore = levelInfo(state.xp).level;
  const entry = { ...before, attempts: before.attempts + 1, fails: before.fails + (passed ? 0 : 1) };
  next.stats.runs += 1;

  let reward = null;
  let firstClear = false;
  if (passed) {
    next.streak = touchStreak(next.streak, dayKey(now));
    if (!before.completed) {
      firstClear = true;
      reward = rewardFor(challenge, before);
      entry.completed = true;
      entry.flawless = reward.flawless;
      entry.xpEarned = reward.total;
      entry.completedAt = now.toISOString();
      next.xp += reward.total;
    }
  }
  next.challenges[challenge.id] = entry;

  const after = levelInfo(next.xp);
  const newBadges = [];
  if (passed) {
    const ctx = { level: after.level, clearedId: firstClear ? challenge.id : null };
    for (const badge of allBadges(catalog)) {
      if (!next.badges[badge.id] && badge.earned(next, catalog, ctx)) {
        next.badges[badge.id] = now.toISOString();
        newBadges.push(badge);
      }
    }
  }

  return {
    state: next,
    outcome: {
      passed,
      firstClear,
      reward,
      xpGained: reward ? reward.total : 0,
      levelBefore,
      levelAfter: after.level,
      leveledUp: after.level > levelBefore,
      newBadges,
      streak: next.streak.current,
      completedAll: firstClear && catalog.challenges.every((c) => next.challenges[c.id]?.completed),
    },
  };
}

// ---- queries ----------------------------------------------------------

export function worldProgress(state, world) {
  const done = world.challenges.filter((c) => state.challenges[c.id]?.completed).length;
  return { done, total: world.challenges.length, complete: done === world.challenges.length };
}

export function overallProgress(state, catalog) {
  const done = catalog.challenges.filter((c) => state.challenges[c.id]?.completed).length;
  return { done, total: catalog.challenges.length, complete: done === catalog.challenges.length };
}

/** First uncleared challenge in course order (the "you are here" marker). */
export function nextUp(state, catalog) {
  return catalog.challenges.find((c) => !state.challenges[c.id]?.completed) ?? null;
}

export function saveDraft(state, id, code) {
  const next = clone(state);
  next.drafts[id] = code;
  return next;
}

export function clearDraft(state, id) {
  const next = clone(state);
  delete next.drafts[id];
  return next;
}

const clone = (s) => JSON.parse(JSON.stringify(s));
