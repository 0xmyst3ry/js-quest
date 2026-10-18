import { h, pluralize } from './dom.js';
import { render as renderRichText, parseInline } from './richtext.js';
import { highlight } from './highlight.js';
import { createEditor } from './editor.js';
import { checkIcon, crossIcon, arrowIcon } from './icons.js';
import { confetti, showDialog, toast } from './celebrate.js';
import { entryFor, hintCost, nextHintCost, rewardFor } from '../core/progress.js';
import { getWorld, nextChallenge, prevChallenge } from '../data/catalog.js';

const MOD = /Mac|iPhone|iPad/.test(globalThis.navigator?.platform ?? '') ? '⌘' : 'Ctrl';

export function renderChallenge(host, app, challenge) {
  const world = getWorld(challenge.worldId);
  const position = `Level ${challenge.indexInWorld + 1} of ${world.challenges.length}`;
  let running = false;

  const entry = () => entryFor(app.state, challenge.id);
  const draft = app.state.drafts[challenge.id];

  const editor = createEditor({
    value: draft ?? challenge.starter,
    label: `Code editor for ${challenge.title}`,
    onChange: (code) => app.saveDraft(challenge.id, code),
    onRun: () => run(),
  });

  // ---- results ---------------------------------------------------------
  const results = h('div', { class: 'results', id: 'results' });
  const liveStatus = h('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite', id: 'run-status' });

  function showIdle() {
    results.replaceChildren(
      h('div', { class: 'results-empty' }, h('p', { text: 'Press Run to test your code.' }), h('p', { class: 'muted', text: `${challenge.tests.length} test${challenge.tests.length === 1 ? '' : 's'} are waiting for you.` })),
    );
  }

  function renderResult(result) {
    const nodes = [];
    const title =
      result.status === 'pass'
        ? 'All tests passed!'
        : result.status === 'timeout'
          ? 'Stopped: took too long'
          : result.status === 'error' && !result.tests.length
            ? 'Could not run your code'
            : result.status === 'error'
              ? 'Your code hit an error'
              : `${result.passed} of ${result.total} tests passed`;
    nodes.push(h('div', { class: `banner banner--${result.status}` }, h('strong', { text: title }), result.status === 'fail' ? h('span', { text: ' Keep going — read the failing tests below.' }) : null));

    if (result.error) {
      nodes.push(h('div', { class: 'errorbox', role: 'alert' }, h('strong', { text: `${result.error.name}: ` }), result.error.message));
    }
    if (result.tests.length) {
      nodes.push(
        h(
          'ul',
          { class: 'tests', 'aria-label': 'Test results' },
          result.tests.map((t) =>
            h(
              'li',
              { class: `test ${t.pass ? 'test--pass' : 'test--fail'}` },
              h('span', { class: 'test-icon' }, t.pass ? checkIcon() : crossIcon(), h('span', { class: 'sr-only', text: t.pass ? 'Passed: ' : 'Failed: ' })),
              h('div', {}, h('code', { class: 'test-name', text: t.name }), !t.pass && t.message ? h('p', { class: 'test-msg', text: t.message }) : null),
            ),
          ),
        ),
      );
    }
    if (result.logs.length) {
      nodes.push(
        h(
          'details',
          { class: 'panel', open: true },
          h('summary', { text: `Console (${result.logs.length})` }),
          h('pre', { class: 'console', tabindex: '0', 'aria-label': 'Console output' }, result.logs.map((l) => h('span', { class: `log log--${l.level}`, text: `${l.text}\n` }))),
        ),
      );
    }
    if (result.dom !== null && result.dom !== undefined) {
      nodes.push(
        h(
          'details',
          { class: 'panel', open: result.status !== 'pass' },
          h('summary', { text: 'Page preview (HTML after your code ran)' }),
          h('pre', { class: 'console', tabindex: '0', 'aria-label': 'Resulting page HTML' }, result.dom || '(empty page)'),
        ),
      );
    }
    results.replaceChildren(...nodes);
  }

  // ---- running ---------------------------------------------------------
  const runBtn = h('button', { type: 'button', class: 'btn btn--primary', onClick: () => run() }, 'Run ', h('kbd', { text: `${MOD} ↵` }));
  async function run() {
    if (running) return;
    running = true;
    runBtn.disabled = true;
    runBtn.setAttribute('aria-busy', 'true');
    results.setAttribute('aria-busy', 'true');
    liveStatus.textContent = 'Running your code…';
    results.replaceChildren(h('div', { class: 'results-empty' }, h('p', { class: 'spinner-line', text: 'Running in the sandbox…' })));
    const result = await app.runner({ challengeId: challenge.id, code: editor.getValue() });
    running = false;
    runBtn.disabled = false;
    runBtn.removeAttribute('aria-busy');
    results.removeAttribute('aria-busy');
    renderResult(result);
    const outcome = app.submit(challenge, result);
    liveStatus.textContent =
      result.status === 'pass' ? `All ${result.total} tests passed.` : result.tests.length ? `${result.passed} of ${result.total} tests passed.` : result.error?.message ?? 'Your code could not run.';
    refreshChrome();
    if (outcome.passed) celebrate(outcome);
  }

  // ---- celebration -----------------------------------------------------
  function celebrate(outcome) {
    const next = nextChallenge(challenge.id);
    if (!outcome.firstClear) {
      toast('Passed again — no extra XP for repeats, but your streak is safe.', { kind: 'success' });
      return;
    }
    confetti(outcome.completedAll ? 90 : outcome.leveledUp ? 60 : 36);
    const lines = [
      h('li', {}, h('span', { text: 'Base reward' }), h('b', { text: `+${outcome.reward.base} XP` })),
      outcome.reward.penalty ? h('li', { class: 'neg' }, h('span', { text: 'Hints used' }), h('b', { text: `−${outcome.reward.penalty} XP` })) : null,
      outcome.reward.bonus ? h('li', { class: 'pos' }, h('span', { text: 'Flawless bonus (first run, no hints)' }), h('b', { text: `+${outcome.reward.bonus} XP` })) : null,
      h('li', { class: 'total' }, h('span', { text: 'Total' }), h('b', { text: `+${outcome.xpGained} XP` })),
    ];
    const content = [h('ul', { class: 'xp-lines' }, lines)];
    if (outcome.leveledUp) {
      content.push(h('p', { class: 'levelup', text: `⬆ Level up! You are now level ${outcome.levelAfter}.` }));
    }
    if (outcome.streak > 1) content.push(h('p', { class: 'streak-line', text: `${outcome.streak}-day streak. Keep it burning!` }));
    if (outcome.newBadges.length) {
      content.push(
        h('p', { class: 'badge-head', text: pluralize(outcome.newBadges.length, 'new badge') }),
        h('ul', { class: 'new-badges' }, outcome.newBadges.map((b) => h('li', {}, h('span', { class: 'badge-glyph', 'aria-hidden': 'true', text: b.glyph }), h('span', {}, h('b', { text: b.name }), ` — ${b.desc}`)))),
      );
    }
    const actions = [];
    if (outcome.completedAll) {
      actions.push({ label: 'See the full atlas', primary: true, onClick: () => app.navigate('#/') });
    } else if (next) {
      actions.push({ label: `Next: ${next.title}`, primary: true, onClick: () => app.navigate(`#/c/${next.id}`) });
    }
    actions.push({ label: 'Stay here' });
    showDialog({
      title: outcome.completedAll ? 'Atlas complete! Every star is lit.' : 'Quest cleared!',
      kind: 'success',
      content,
      actions,
    });
  }

  // ---- lesson column: hints, solution, reward -------------------------------
  const rewardLine = h('p', { class: 'reward' });
  const hintsHost = h('div', { class: 'hints' });
  const solutionHost = h('div', { class: 'solution' });
  const statusChip = h('span', { class: 'chip' });

  function refreshChrome() {
    const e = entry();
    // reward + status chip
    if (e.completed) {
      statusChip.textContent = `Cleared · +${e.xpEarned} XP earned`;
      statusChip.className = 'chip chip--done';
      rewardLine.textContent = 'Already cleared — replays do not pay XP, but they keep your streak alive.';
    } else {
      const r = rewardFor(challenge, e);
      statusChip.textContent = `${r.total} XP`;
      statusChip.className = 'chip';
      rewardLine.textContent = r.flawless
        ? `Reward: ${r.base} XP + ${r.bonus} XP flawless bonus (pass on your first run without hints).`
        : `Reward: ${r.total} XP${r.penalty ? ` (${r.base} − ${r.penalty} for hints)` : ''}.`;
    }
    // hints
    const shown = challenge.hints.slice(0, e.hintsUsed);
    const cost = nextHintCost(app.state, challenge);
    const left = challenge.hints.length - e.hintsUsed;
    hintsHost.replaceChildren(
      ...[
      h('h3', { text: 'Hints' }),
      shown.length
        ? h('ol', { class: 'hint-list' }, shown.map((t, i) => h('li', { class: i === shown.length - 1 ? 'hint hint--new' : 'hint' }, renderInline(t))))
        : h('p', { class: 'muted', text: 'Stuck? Hints are optional, but they cost XP.' }),
      left > 0
        ? h(
            'button',
            { type: 'button', class: 'btn btn--ghost', onClick: () => takeHint() },
            e.completed
              ? `Show hint ${e.hintsUsed + 1} (free)`
              : `Show hint ${e.hintsUsed + 1} of ${challenge.hints.length} · −${cost} XP`,
          )
        : null,
      left > 0 && !e.completed && e.hintsUsed === 0 && cost > hintCost(challenge)
        ? h('p', { class: 'muted small', text: `Includes the ${cost - hintCost(challenge)} XP flawless bonus you give up by using any hint.` })
        : null,
      ].filter(Boolean),
    );
    // solution
    if (e.completed) {
      const open = solutionHost.querySelector('details')?.open ?? false;
      solutionHost.replaceChildren(
        h(
          'details',
          { class: 'panel', open },
          h('summary', { text: 'Reference solution' }),
          h('pre', { class: 'code-block', tabindex: '0', 'aria-label': 'Reference solution' }, h('code', {}, highlight(challenge.solution))),
          h('button', { type: 'button', class: 'btn btn--ghost', onClick: () => { editor.setValue(challenge.solution, { undoable: true }); app.saveDraft(challenge.id, challenge.solution); toast('Solution copied into the editor.'); } }, 'Copy into editor'),
        ),
      );
    } else {
      solutionHost.replaceChildren(h('p', { class: 'muted small', text: 'The reference solution unlocks once you clear this level.' }));
    }
  }

  function takeHint() {
    const r = app.hint(challenge);
    refreshChrome();
    if (r.cost > 0) toast(`Hint revealed: −${r.cost} XP from this level's reward.`);
    hintsHost.querySelector('.hint--new')?.scrollIntoView?.({ block: 'nearest' });
    liveStatus.textContent = `Hint ${r.index + 1}: ${r.text}`;
  }

  // ---- assemble --------------------------------------------------------
  const prev = prevChallenge(challenge.id);
  const next = nextChallenge(challenge.id);
  const crumbs = h(
    'nav',
    { class: 'crumbs', 'aria-label': 'Breadcrumb' },
    h('a', { href: '#/' }, arrowIcon('left'), 'Atlas'),
    h('span', { 'aria-hidden': 'true', text: '/' }),
    h('span', { text: world.name }),
    h('span', { 'aria-hidden': 'true', text: '/' }),
    h('span', { 'aria-current': 'page', text: position }),
  );

  const lesson = h(
    'article',
    { class: 'lesson card', 'aria-labelledby': 'page-title' },
    h('div', { class: 'lesson-head' }, challenge.boss ? h('span', { class: 'chip chip--boss', text: 'Boss level' }) : null, statusChip),
    h('h1', { id: 'page-title', tabindex: '-1', text: challenge.title }),
    renderRichText(challenge.intro, highlight),
    h('div', { class: 'task' }, h('h2', { text: 'Your task' }), renderRichText(challenge.task)),
    rewardLine,
    hintsHost,
    solutionHost,
    h(
      'nav',
      { class: 'pager', 'aria-label': 'Previous and next level' },
      prev ? h('a', { href: `#/c/${prev.id}`, class: 'btn btn--ghost' }, arrowIcon('left'), prev.title) : h('span'),
      next ? h('a', { href: `#/c/${next.id}`, class: 'btn btn--ghost' }, next.title, arrowIcon()) : h('span'),
    ),
  );

  const workspace = h(
    'section',
    { class: 'workspace', 'aria-label': 'Code workspace' },
    h('div', { class: 'card card--editor' }, h('div', { class: 'editor-bar' }, h('span', { class: 'editor-file', text: 'quest.js' }), h('span', { class: 'editor-help', id: 'editor-help', text: `${MOD}+Enter runs · Esc then Tab leaves the editor` })), editor.el),
    h(
      'div',
      { class: 'actions' },
      runBtn,
      h('button', { type: 'button', class: 'btn', onClick: () => { editor.setValue(challenge.starter, { undoable: true }); app.saveDraft(challenge.id, challenge.starter); showIdle(); editor.focus(); } }, 'Reset code'),
    ),
    liveStatus,
    h('div', { class: 'card results-card' }, h('h2', { class: 'results-title', text: 'Results' }), results),
  );

  host.replaceChildren(crumbs, h('div', { class: 'challenge-grid' }, lesson, workspace));
  document.title = `${challenge.title} — ${world.name} — JS Quest`;
  showIdle();
  refreshChrome();
}

// Hints contain `code` spans: reuse the inline parser without block markup.
function renderInline(text) {
  return parseInline(text).map((tok) => (tok.t === 'code' ? h('code', { text: tok.v }) : tok.t === 'bold' ? h('strong', { text: tok.v }) : tok.v));
}
