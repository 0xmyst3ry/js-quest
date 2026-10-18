import { h } from './dom.js';
import { allBadges } from '../data/badges.js';
import { showDialog } from './celebrate.js';

export function renderBadges(host, app) {
  const badges = allBadges(app.catalog);
  const earned = badges.filter((b) => app.state.badges[b.id]);
  const list = h(
    'ul',
    { class: 'badge-grid' },
    badges.map((b) => {
      const when = app.state.badges[b.id];
      return h(
        'li',
        { class: `badge ${when ? 'badge--earned' : 'badge--locked'}` },
        h('span', { class: 'badge-glyph', 'aria-hidden': 'true', text: b.glyph }),
        h('div', {}, h('h3', { text: b.name }), h('p', { text: b.desc }), h('p', { class: 'badge-when', text: when ? `Earned ${new Date(when).toLocaleDateString()}` : 'Locked' })),
      );
    }),
  );

  const resetBtn = h('button', {
    type: 'button',
    class: 'btn btn--danger',
    text: 'Reset all progress',
    onClick: () =>
      showDialog({
        title: 'Reset all progress?',
        kind: 'danger',
        content: [h('p', { text: 'This erases your XP, streak, badges and saved code from this browser. It cannot be undone.' })],
        actions: [
          { label: 'Keep my progress', primary: true },
          { label: 'Erase everything', onClick: () => app.resetProgress() },
        ],
      }),
  });

  host.replaceChildren(
    h(
      'section',
      { class: 'page', 'aria-labelledby': 'page-title' },
      h('p', { class: 'eyebrow', text: 'Achievements' }),
      h('h1', { id: 'page-title', tabindex: '-1', text: 'Badges' }),
      h('p', { class: 'lede', text: `${earned.length} of ${badges.length} earned.` }),
      list,
      h('div', { class: 'danger-zone' }, h('h2', { text: 'Danger zone' }), h('p', { text: 'Your progress lives only in this browser (localStorage).' }), resetBtn),
    ),
  );
  document.title = 'Badges — JS Quest';
}
