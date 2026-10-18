// localStorage wrapper. Browsers can throw on *any* storage access (private
// mode, blocked cookies, quota), so every call is guarded and the app falls
// back to in-memory state with a visible notice.

import { createInitialState, STATE_VERSION } from './progress.js';

export const STORAGE_KEY = 'jsquest:v1';
export const THEME_KEY = 'jsquest:theme';

/** Find a usable Storage object, or null. */
export function getBackend(win = globalThis) {
  try {
    const store = win.localStorage;
    if (!store) return null;
    const probe = '__jsquest_probe__';
    store.setItem(probe, '1');
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const nonNegInt = (v) => (Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);

/** Coerce arbitrary parsed JSON into a valid state (never throws). */
export function sanitizeState(raw) {
  const base = createInitialState();
  if (!isObj(raw)) return base;
  const state = base;
  state.xp = nonNegInt(raw.xp);
  if (isObj(raw.challenges)) {
    for (const [id, e] of Object.entries(raw.challenges)) {
      if (!isObj(e)) continue;
      state.challenges[id] = {
        attempts: nonNegInt(e.attempts),
        fails: nonNegInt(e.fails),
        hintsUsed: nonNegInt(e.hintsUsed),
        completed: e.completed === true,
        flawless: e.flawless === true,
        xpEarned: nonNegInt(e.xpEarned),
        ...(typeof e.completedAt === 'string' ? { completedAt: e.completedAt } : {}),
      };
    }
  }
  if (isObj(raw.drafts)) {
    for (const [id, code] of Object.entries(raw.drafts)) if (typeof code === 'string') state.drafts[id] = code.slice(0, 20000);
  }
  if (isObj(raw.streak)) {
    const s = raw.streak;
    state.streak = {
      current: nonNegInt(s.current),
      best: Math.max(nonNegInt(s.best), nonNegInt(s.current)),
      lastDay: typeof s.lastDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.lastDay) ? s.lastDay : null,
    };
  }
  if (isObj(raw.badges)) {
    for (const [id, when] of Object.entries(raw.badges)) if (typeof when === 'string') state.badges[id] = when;
  }
  if (isObj(raw.stats)) state.stats.runs = nonNegInt(raw.stats.runs);
  state.version = STATE_VERSION;
  return state;
}

export function createStore(backend) {
  return {
    persistent: Boolean(backend),
    load() {
      if (!backend) return createInitialState();
      try {
        const text = backend.getItem(STORAGE_KEY);
        return text ? sanitizeState(JSON.parse(text)) : createInitialState();
      } catch {
        return createInitialState(); // corrupted JSON or blocked access
      }
    },
    save(state) {
      if (!backend) return false;
      try {
        backend.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
      } catch {
        return false;
      }
    },
    reset() {
      if (!backend) return;
      try {
        backend.removeItem(STORAGE_KEY);
      } catch {
        /* nothing else to do */
      }
    },
  };
}

export function readTheme(backend) {
  try {
    const v = backend?.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

export function writeTheme(backend, theme) {
  try {
    backend?.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}
