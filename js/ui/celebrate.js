// Toasts, the native <dialog> used for celebrations, and a light confetti burst.

import { h, clear } from './dom.js';

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function toast(message, { kind = 'info', ms = 4200 } = {}) {
  const host = document.getElementById('toasts');
  if (!host) return;
  const node = h('div', { class: `toast toast--${kind}`, text: message });
  host.append(node);
  setTimeout(() => node.remove(), ms);
}

/** A burst of falling glyphs. Skipped entirely for reduced-motion users. */
export function confetti(count = 36) {
  if (reducedMotion()) return;
  const layer = h('div', { class: 'confetti', 'aria-hidden': 'true' });
  const glyphs = ['✦', '✧', '★', '☆', '·'];
  const colors = ['var(--gold)', 'var(--mint)', 'var(--coral)', 'var(--violet)'];
  for (let i = 0; i < count; i++) {
    layer.append(
      h('span', {
        text: glyphs[i % glyphs.length],
        style: {
          left: `${Math.round(Math.random() * 100)}%`,
          color: colors[i % colors.length],
          animationDelay: `${Math.round(Math.random() * 400)}ms`,
          animationDuration: `${1600 + Math.round(Math.random() * 1400)}ms`,
          fontSize: `${12 + Math.round(Math.random() * 18)}px`,
        },
      }),
    );
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 3500);
}

/**
 * Show a modal. `content` is an array of nodes; `actions` are { label, onClick, primary }.
 * Focus returns to whatever had it before the dialog opened.
 */
export function showDialog({ title, content, actions, kind = 'default' }) {
  const dialog = document.getElementById('dialog');
  const opener = document.activeElement;
  clear(dialog);
  dialog.className = `dialog dialog--${kind}`;
  const close = () => {
    if (dialog.open) dialog.close();
  };
  dialog.append(
    h('h2', { id: 'dialog-title', text: title }),
    h('div', { class: 'dialog-body' }, content),
    h(
      'div',
      { class: 'dialog-actions' },
      actions.map((a) =>
        h('button', {
          type: 'button',
          class: a.primary ? 'btn btn--primary' : 'btn',
          text: a.label,
          autofocus: a.primary,
          onClick: () => {
            close();
            a.onClick?.();
          },
        }),
      ),
    ),
  );
  dialog.onclose = () => {
    opener?.isConnected && opener.focus?.();
  };
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
  dialog.querySelector('.btn--primary')?.focus();
  return close;
}
