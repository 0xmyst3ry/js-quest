import { svg } from './dom.js';

const icon = (viewBox, children, props = {}) =>
  svg('svg', { viewBox, 'aria-hidden': 'true', focusable: 'false', class: 'icon', ...props }, ...children);

/** Five-point star centred on 0,0 in a -12..12 box. */
export function starPoints(outer = 10, inner = 4.3) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`);
  }
  return pts.join(' ');
}

export const starIcon = (className = 'star-shape') =>
  icon('-12 -12 24 24', [svg('polygon', { points: starPoints(), class: className })]);

export const flameIcon = () =>
  icon('0 0 24 24', [
    svg('path', {
      d: 'M13 2c.5 3.5-3.5 5.2-3.5 9.2 0 1.1.4 2 1.1 2.7-.1-1.8.6-3 1.7-3.9.2 1.2.9 1.8 1.5 2.5.6.700 1.2 1.400 1.2 2.5A3.6 3.6 0 0 1 9 17.4c-1.400-.4-2.5-1.6-2.5-3.5 0-2 .8-3.300 1.7-4.6C9.400 7.600 12.7 6 13 2z',
      fill: 'currentColor',
    }),
  ]);

export const checkIcon = () => icon('0 0 16 16', [svg('path', { d: 'M3 8.5l3.2 3.2L13 4.8', fill: 'none', stroke: 'currentColor', 'stroke-width': '2.2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })]);

export const crossIcon = () => icon('0 0 16 16', [svg('path', { d: 'M4 4l8 8M12 4l-8 8', fill: 'none', stroke: 'currentColor', 'stroke-width': '2.2', 'stroke-linecap': 'round' })]);

export const arrowIcon = (dir = 'right') =>
  icon('0 0 16 16', [svg('path', { d: dir === 'right' ? 'M3 8h10M9 4l4 4-4 4' : 'M13 8H3M7 4L3 8l4 4', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })]);
