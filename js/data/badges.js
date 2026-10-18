// Achievement definitions. `earned(state, catalog, ctx)` is evaluated after
// every attempt; a badge is awarded once and then stored in `state.badges`.

const cleared = (state) => Object.values(state.challenges).filter((c) => c.completed);
const clearedCount = (state) => cleared(state).length;

const staticBadges = [
  { id: 'first-light', name: 'First Light', glyph: '✦', desc: 'Clear your very first challenge.', earned: (s) => clearedCount(s) >= 1 },
  { id: 'constellation', name: 'Constellation', glyph: '✧', desc: 'Clear 10 challenges.', earned: (s) => clearedCount(s) >= 10 },
  { id: 'star-collector', name: 'Star Collector', glyph: '☆', desc: 'Clear 25 challenges.', earned: (s) => clearedCount(s) >= 25 },
  {
    id: 'cartographer',
    name: 'Cartographer',
    glyph: '◎',
    desc: 'Clear every challenge in the atlas.',
    earned: (s, cat) => cat.challenges.length > 0 && cat.challenges.every((c) => s.challenges[c.id]?.completed),
  },
  { id: 'rising-star', name: 'Rising Star', glyph: '▲', desc: 'Reach level 3.', earned: (s, _c, ctx) => ctx.level >= 3 },
  { id: 'nova', name: 'Nova', glyph: '✺', desc: 'Reach level 5.', earned: (s, _c, ctx) => ctx.level >= 5 },
  { id: 'on-a-roll', name: 'On a Roll', glyph: '≡', desc: 'Keep a 3-day streak.', earned: (s) => s.streak.best >= 3 },
  { id: 'weekly-orbit', name: 'Weekly Orbit', glyph: '⟳', desc: 'Keep a 7-day streak.', earned: (s) => s.streak.best >= 7 },
  {
    id: 'lone-wolf',
    name: 'Lone Wolf',
    glyph: '☾',
    desc: 'Clear 5 challenges without using a single hint.',
    earned: (s) => cleared(s).filter((c) => c.hintsUsed === 0).length >= 5,
  },
  {
    id: 'clean-cast',
    name: 'Clean Cast',
    glyph: '✔',
    desc: 'Clear 3 challenges on your first run with no hints.',
    earned: (s) => cleared(s).filter((c) => c.flawless).length >= 3,
  },
  {
    id: 'never-give-up',
    name: 'Never Give Up',
    glyph: '♥',
    desc: 'Clear a challenge after 5 or more failed runs.',
    earned: (s, _c, ctx) => Boolean(ctx.clearedId) && s.challenges[ctx.clearedId].fails >= 5,
  },
];

/** One "<world> charted" badge per world, generated from the catalog. */
export function worldBadges(catalog) {
  return catalog.worlds.map((w) => ({
    id: `world-${w.id}`,
    name: `${w.name} Charted`,
    glyph: w.glyph,
    desc: `Clear every challenge in ${w.name}.`,
    earned: (s) => w.challenges.every((c) => s.challenges[c.id]?.completed),
  }));
}

export function allBadges(catalog) {
  return [...staticBadges, ...worldBadges(catalog)];
}
