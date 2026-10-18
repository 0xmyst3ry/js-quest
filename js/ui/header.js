import { h } from './dom.js';
import { flameIcon } from './icons.js';
import { levelInfo, visibleStreak, dayKey } from '../core/progress.js';

export function renderHeader(host, app) {
  const info = levelInfo(app.state.xp);
  const streak = visibleStreak(app.state.streak, dayKey());
  const route = app.route.name;
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

  const nav = h(
    'nav',
    { class: 'nav', 'aria-label': 'Main' },
    h('a', { href: '#/', class: 'nav-link', 'aria-current': route === 'map' ? 'page' : undefined, text: 'Atlas' }),
    h('a', { href: '#/badges', class: 'nav-link', 'aria-current': route === 'badges' ? 'page' : undefined, text: 'Badges' }),
  );

  const stats = h(
    'div',
    { class: 'stats', role: 'group', 'aria-label': 'Your progress' },
    h(
      'div',
      { class: 'stat stat--level', title: `${info.xpIntoLevel} / ${info.xpForNext} XP to level ${info.level + 1}` },
      h('span', { class: 'stat-badge', 'aria-hidden': 'true', text: info.level }),
      h(
        'span',
        { class: 'stat-main' },
        h('span', { class: 'stat-title', text: `Lv ${info.level} · ${info.title}` }),
        h(
          'span',
          {
            class: 'xpbar',
            role: 'progressbar',
            'aria-label': `Progress to level ${info.level + 1}`,
            'aria-valuemin': '0',
            'aria-valuemax': String(info.xpForNext),
            'aria-valuenow': String(info.xpIntoLevel),
          },
          h('span', { class: 'xpbar-fill', style: { width: `${Math.round(info.progress * 100)}%` } }),
        ),
      ),
      h('span', { class: 'stat-xp', text: `${info.xp} XP` }),
    ),
    h(
      'div',
      { class: 'stat stat--streak', title: `Best streak: ${app.state.streak.best} days` },
      h('span', { class: 'flame' }, flameIcon()),
      h('span', { text: `${streak}` }),
      h('span', { class: 'sr-only', text: ` day streak` }),
    ),
  );

  const themeBtn = h('button', {
    type: 'button',
    id: 'theme-toggle',
    class: 'icon-btn',
    'aria-label': isDark ? 'Switch to light theme' : 'Switch to dark theme',
    'aria-pressed': String(!isDark),
    title: 'Toggle theme',
    onClick: () => app.toggleTheme(),
    text: isDark ? '☀' : '☾',
  });

  host.replaceChildren(
    h(
      'div',
      { class: 'header-inner' },
      h('a', { class: 'brand', href: '#/', 'aria-label': 'JS Quest — home' }, h('span', { class: 'brand-mark', 'aria-hidden': 'true', text: '✦' }), h('span', { class: 'brand-name', text: 'JS Quest' })),
      nav,
      stats,
      themeBtn,
    ),
  );
}
