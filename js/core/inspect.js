// Value formatting and comparison helpers shared by the engine and the UI.

const MAX_LEN = 160;

function truncate(text) {
  return text.length > MAX_LEN ? `${text.slice(0, MAX_LEN - 1)}…` : text;
}

/** Format any value as a short, readable string (never throws). */
export function inspect(value, depth = 3, seen = new Set()) {
  try {
    return truncate(format(value, depth, seen));
  } catch {
    return '[unprintable]';
  }
}

function format(value, depth, seen) {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'undefined':
      return 'undefined';
    case 'string':
      return JSON.stringify(value);
    case 'number':
      return Object.is(value, -0) ? '-0' : String(value);
    case 'bigint':
      return `${value}n`;
    case 'symbol':
      return value.toString();
    case 'boolean':
      return String(value);
    case 'function':
      return `[Function${value.name ? `: ${value.name}` : ''}]`;
  }
  if (seen.has(value)) return '[Circular]';
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (value instanceof Date) return `Date(${Number.isNaN(+value) ? 'invalid' : value.toISOString()})`;
  if (value instanceof Promise) return 'Promise {…}';
  if (typeof value.nodeType === 'number' && value.tagName) return `<${value.tagName.toLowerCase()}>`;
  if (depth < 0) return Array.isArray(value) ? '[…]' : '{…}';
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      return `[${value.map((v) => format(v, depth - 1, seen)).join(', ')}]`;
    }
    if (value instanceof Set) {
      return `Set {${[...value].map((v) => format(v, depth - 1, seen)).join(', ')}}`;
    }
    if (value instanceof Map) {
      return `Map {${[...value].map(([k, v]) => `${format(k, depth - 1, seen)} => ${format(v, depth - 1, seen)}`).join(', ')}}`;
    }
    const keys = Object.keys(value);
    if (keys.length === 0) return '{}';
    const body = keys.map((k) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${format(value[k], depth - 1, seen)}`);
    return `{ ${body.join(', ')} }`;
  } finally {
    seen.delete(value);
  }
}

/** Format the arguments passed to console.log the way a dev console would. */
export function formatLog(args) {
  return args.map((a) => (typeof a === 'string' ? a : inspect(a))).join(' ');
}

/** Structural equality. NaN equals NaN, 0 equals -0, key order is ignored. */
export function deepEqual(a, b, seen = new Map()) {
  if (a === b || (a !== a && b !== b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (seen.get(a) === b) return true;
  seen.set(a, b);
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && +a === +b;
  }
  if (a instanceof Set || b instanceof Set) {
    if (!(a instanceof Set && b instanceof Set) || a.size !== b.size) return false;
    return [...a].every((v) => b.has(v));
  }
  if (a instanceof Map || b instanceof Map) {
    if (!(a instanceof Map && b instanceof Map) || a.size !== b.size) return false;
    return [...a].every(([k, v]) => b.has(k) && deepEqual(v, b.get(k), seen));
  }
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k], seen));
}
