// App shell: state, routing and wiring. Rendering lives in ./ui/*.

import { catalog, getChallenge } from './data/catalog.js';
import { createRunner } from './core/runner.js';
import {
  createInitialState, recordAttempt, revealHint, saveDraft,
} from './core/progress.js';
import { createStore, getBackend, writeTheme } from './core/storage.js';
import { renderHeader } from './ui/header.js';
import { renderMap } from './ui/map.js';
import { renderChallenge } from './ui/challenge.js';
import { renderBadges } from './ui/badges.js';
import { toast } from './ui/celebrate.js';

const backend = getBackend();
const store = createStore(backend);

const app = {
  catalog,
  store,
  state: store.load(),
  route: { name: 'map' },
  runner: createRunner(),

  update(fn) {
    this.state = fn(this.state);
    this.store.save(this.state);
    renderHeader(document.getElementById('site-header'), this);
  },
  submit(challenge, result) {
    this.flushDraft();
    const { state, outcome } = recordAttempt(this.state, challenge, result, catalog);
    this.update(() => state);
    return outcome;
  },
  hint(challenge) {
    const result = revealHint(this.state, challenge);
    this.update(() => result.state);
    return result;
  },
  saveDraft(id, code) {
    // Drafts are written on a short debounce so typing never janks.
    clearTimeout(this._draftTimer);
    this._pending = { id, code };
    this._draftTimer = setTimeout(() => this.flushDraft(), 350);
  },
  flushDraft() {
    clearTimeout(this._draftTimer);
    const pending = this._pending;
    this._pending = null;
    if (pending) this.update((s) => saveDraft(s, pending.id, pending.code));
  },
  navigate(hash) {
    if (location.hash === hash) route();
    else location.hash = hash;
  },
  toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    writeTheme(backend, next);
    renderHeader(document.getElementById('site-header'), this);
    document.getElementById('theme-toggle')?.focus();
  },
  resetProgress() {
    clearTimeout(this._draftTimer);
    this._pending = null;
    this.store.reset();
    this.state = createInitialState();
    renderHeader(document.getElementById('site-header'), this);
    toast('Progress erased. A fresh sky awaits.');
    this.navigate('#/');
  },
};

function parseRoute(hash) {
  const m = hash.match(/^#\/c\/([a-z0-9-]+)$/);
  if (m && getChallenge(m[1])) return { name: 'challenge', id: m[1] };
  if (hash === '#/badges') return { name: 'badges' };
  return { name: 'map' };
}

function route() {
  app.flushDraft();
  app.route = parseRoute(location.hash);
  const main = document.getElementById('main');
  renderHeader(document.getElementById('site-header'), app);
  if (app.route.name === 'challenge') renderChallenge(main, app, getChallenge(app.route.id));
  else if (app.route.name === 'badges') renderBadges(main, app);
  else renderMap(main, app);
  window.scrollTo(0, 0);
  // Move focus to the page heading so screen-reader and keyboard users land at the top.
  document.getElementById('page-title')?.focus({ preventScroll: true });
}

function showStorageNotice() {
  if (store.persistent) return;
  const notice = document.getElementById('notice');
  notice.hidden = false;
  notice.textContent = 'Heads up: this browser is blocking local storage, so your progress will not be saved after you close the tab.';
}

window.addEventListener('hashchange', route);
window.addEventListener('pagehide', () => app.flushDraft());
showStorageNotice();
route();

// Handy for debugging and for the smoke tests; harmless in production.
window.__jsquest = app;
