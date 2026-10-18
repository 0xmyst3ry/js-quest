import { h, svg, pluralize } from './dom.js';
import { starIcon, arrowIcon } from './icons.js';
import { levelInfo, nextUp, overallProgress, worldProgress } from '../core/progress.js';

// Vertical rhythm for each constellation, picked per world so no two look alike.
const SHAPES = [
  [60, 28, 66, 34],
  [34, 62, 30, 58],
  [50, 22, 62, 40],
  [64, 36, 24, 58],
];

/** Percent positions for the stars of one world. */
export function layout(count, worldIndex) {
  const shape = SHAPES[worldIndex % SHAPES.length];
  return Array.from({ length: count }, (_, i) => ({
    x: count === 1 ? 50 : 11 + (78 * i) / (count - 1),
    y: shape[i % shape.length],
  }));
}

function starLink(app, challenge, pos, upNext) {
  const entry = app.state.challenges[challenge.id];
  const done = Boolean(entry?.completed);
  const isNext = upNext?.id === challenge.id;
  const status = done ? 'cleared' : isNext ? 'next up' : 'open';
  const label = `${challenge.title}${challenge.boss ? ' (boss)' : ''}, ${challenge.xp} XP, ${status}`;
  return h(
    'a',
    {
      class: `star ${done ? 'star--done' : ''} ${isNext ? 'star--next' : ''} ${challenge.boss ? 'star--boss' : ''}`,
      href: `#/c/${challenge.id}`,
      style: { left: `${pos.x}%`, top: `${pos.y}%` },
      'aria-label': label,
      'data-challenge': challenge.id,
    },
    h('span', { class: 'star-art' }, starIcon()),
    h('span', { class: 'star-label' }, h('span', { class: 'star-num', text: `${challenge.indexInWorld + 1}` }), ` ${challenge.title}`),
  );
}

function constellation(app, world, wi, upNext) {
  const pts = layout(world.challenges.length, wi);
  const lines = svg(
    'svg',
    { class: 'sky-lines', viewBox: '0 0 100 100', preserveAspectRatio: 'none', 'aria-hidden': 'true' },
    ...pts.slice(1).map((p, i) => {
      const prev = pts[i];
      const lit = app.state.challenges[world.challenges[i].id]?.completed && app.state.challenges[world.challenges[i + 1].id]?.completed;
      return svg('line', { x1: prev.x, y1: prev.y, x2: p.x, y2: p.y, class: lit ? 'line line--lit' : 'line', 'vector-effect': 'non-scaling-stroke' });
    }),
  );
  return h('div', { class: 'sky' }, lines, world.challenges.map((c, i) => starLink(app, { ...c, indexInWorld: i }, pts[i], upNext)));
}

export function renderMap(host, app) {
  const { state, catalog } = app;
  const overall = overallProgress(state, catalog);
  const info = levelInfo(state.xp);
  const upNext = nextUp(state, catalog);
  const started = Object.keys(state.challenges).length > 0;

  const hero = h(
    'section',
    { class: 'hero', 'aria-labelledby': 'page-title' },
    h(
      'div',
      { class: 'hero-copy' },
      h('p', { class: 'eyebrow', text: overall.complete ? 'Atlas complete' : started ? 'Welcome back, navigator' : 'A JavaScript adventure' }),
      h('h1', { id: 'page-title', tabindex: '-1', text: overall.complete ? 'Every constellation is charted.' : 'Chart the constellations of JavaScript.' }),
      h(
        'p',
        { class: 'lede' },
        overall.complete
          ? `You cleared all ${overall.total} challenges and reached level ${info.level}. Replay any star to keep the streak going, or fork the project and add your own.`
          : `${overall.total} short challenges in ${catalog.worlds.length} worlds. Write real code, run it in a safe sandbox, earn XP, keep a streak and light up the sky.`,
      ),
      h(
        'div',
        { class: 'hero-actions' },
        upNext
          ? h('a', { class: 'btn btn--primary btn--lg', href: `#/c/${upNext.id}` }, started ? 'Continue quest' : 'Start your journey', arrowIcon())
          : h('a', { class: 'btn btn--primary btn--lg', href: '#/badges' }, 'See your badges', arrowIcon()),
        h('span', { class: 'hero-meta', text: `${overall.done} / ${overall.total} cleared · ${state.xp} XP` }),
      ),
    ),
    h(
      'div',
      { class: 'hero-card', role: 'img', 'aria-label': `${overall.done} of ${overall.total} challenges cleared` },
      h('div', { class: 'ring', style: { '--p': String(overall.total ? overall.done / overall.total : 0) } }, h('span', { class: 'ring-num', text: `${Math.round((overall.done / overall.total) * 100)}%` })),
    ),
  );

  const worldSections = catalog.worlds.map((world, wi) => {
    const wp = worldProgress(state, world);
    return h(
      'section',
      { class: `world ${wp.complete ? 'world--done' : ''}`, 'aria-labelledby': `world-${world.id}` },
      h(
        'header',
        { class: 'world-head' },
        h('span', { class: 'world-glyph', 'aria-hidden': 'true', text: world.glyph }),
        h('div', { class: 'world-title' }, h('h2', { id: `world-${world.id}`, text: world.name }), h('p', { text: world.blurb })),
        h('span', { class: 'world-count', text: wp.complete ? 'Charted ✓' : `${wp.done}/${wp.total}` }),
      ),
      constellation(app, world, wi, upNext),
    );
  });

  host.replaceChildren(hero, h('div', { class: 'worlds' }, worldSections));
  document.title = 'JS Quest — learn JavaScript by charting the stars';
}
