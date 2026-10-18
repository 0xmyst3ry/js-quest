export default {
  id: 'async',
  name: 'Async Atoll',
  glyph: '⏳',
  blurb: 'Timers, promises and async/await — code that waits.',
  challenges: [
    {
      id: 'async-order',
      title: 'Not right now',
      xp: 20,
      intro: `\`setTimeout(fn, ms)\` schedules \`fn\` to run later. JavaScript does **not** pause: the rest of your code keeps going and the callback runs afterwards.

\`\`\`js
console.log("A");
setTimeout(() => console.log("B"), 0);
console.log("C");
// prints: A, C, B
\`\`\``,
      task: 'Make the console print `start`, then `end`, and only afterwards `later` (scheduled with a 20 ms timer).',
      starter: `console.log("start");\n// schedule "later" in 20ms\nconsole.log("end");\n`,
      solution: `console.log("start");\nsetTimeout(() => console.log("later"), 20);\nconsole.log("end");\n`,
      hints: [
        'Use `setTimeout(callback, 20)`.',
        'The callback is an arrow function that logs "later".',
        '`setTimeout(() => console.log("later"), 20);` goes between the two other lines.',
      ],
      tests: [{ logs: true, wait: 120, expect: ['start', 'end', 'later'], name: 'logs start, end, later in that order' }],
    },
    {
      id: 'async-promise',
      title: 'Make a promise',
      xp: 30,
      intro: `A **Promise** is a placeholder for a value that will arrive later. You create one with a function that receives \`resolve\`:

\`\`\`js
const p = new Promise((resolve) => {
  setTimeout(() => resolve("done"), 100);
});
p.then((value) => console.log(value)); // "done" after 100ms
\`\`\`

Whoever receives the promise can wait for it with \`.then(...)\`.`,
      task: 'Write `delay(ms, value)` that returns a promise resolving to `value` after `ms` milliseconds.',
      starter: `function delay(ms, value) {\n  \n}\n`,
      solution: `function delay(ms, value) {\n  return new Promise((resolve) => {\n    setTimeout(() => resolve(value), ms);\n  });\n}\n`,
      hints: [
        'Return `new Promise((resolve) => { ... })`.',
        'Inside, start a `setTimeout` for `ms`.',
        'When the timer fires call `resolve(value)`.',
      ],
      tests: [
        { expr: 'delay(5, 1) instanceof Promise', expect: true, name: 'returns a Promise' },
        { call: 'delay', args: [10, 'hi'], expect: 'hi', name: 'resolves to the value' },
        {
          name: 'actually waits',
          expr: '(async () => { const t = Date.now(); await delay(40, 0); return Date.now() - t >= 35; })()',
          expect: true,
        },
      ],
    },
    {
      id: 'async-await',
      title: 'Wait for it',
      xp: 40,
      intro: `\`async\` / \`await\` is a friendlier way to use promises. Inside an \`async\` function, \`await\` pauses *that function* until the promise settles and gives you the value:

\`\`\`js
async function demo() {
  const n = await fetchNumber();
  return n + 1; // an async function itself returns a promise
}
\`\`\`

Loops work naturally with \`await\`.`,
      task: '`getScore(id)` is provided; it returns a promise of `id * 10`. Write `async function total(ids)` returning the sum of the scores of all `ids`.',
      starter: `function getScore(id) {\n  return new Promise((resolve) => setTimeout(() => resolve(id * 10), 10));\n}\n\nasync function total(ids) {\n  \n}\n`,
      solution: `function getScore(id) {\n  return new Promise((resolve) => setTimeout(() => resolve(id * 10), 10));\n}\n\nasync function total(ids) {\n  let sum = 0;\n  for (const id of ids) {\n    sum += await getScore(id);\n  }\n  return sum;\n}\n`,
      hints: [
        'Keep a running `sum` and loop over `ids` with `for...of`.',
        'Inside the loop: `const score = await getScore(id);`',
        '`sum += await getScore(id);` then `return sum;`',
      ],
      tests: [
        { call: 'total', args: [[1, 2, 3]], expect: 60 },
        { call: 'total', args: [[]], expect: 0 },
        { call: 'total', args: [[5]], expect: 50 },
      ],
    },
    {
      id: 'async-catch',
      title: 'When the promise breaks',
      xp: 50,
      boss: true,
      intro: `Promises can **reject** (fail). With \`await\`, wrap the call in \`try / catch\` like synchronous code:

\`\`\`js
async function safe() {
  try {
    return await mightFail();
  } catch (err) {
    return "oops: " + err.message;
  }
}
\`\`\`

Always \`await\` inside the \`try\`, or the error escapes the \`catch\`.`,
      task: 'Write `async function loadOr(task, fallback)`. It calls `task()` (which returns a promise) and returns its result — or `fallback` if the promise rejects.',
      starter: `async function loadOr(task, fallback) {\n  \n}\n`,
      solution: `async function loadOr(task, fallback) {\n  try {\n    return await task();\n  } catch (err) {\n    return fallback;\n  }\n}\n`,
      hints: [
        'Put the call inside `try { ... }`.',
        'Write `return await task();` so rejections are caught here.',
        'In `catch`, return `fallback`.',
      ],
      tests: [
        { call: 'loadOr', argsSrc: '[() => Promise.resolve(5), 0]', expect: 5, name: 'returns the result on success' },
        { call: 'loadOr', argsSrc: '[() => Promise.reject(new Error("nope")), "fallback"]', expect: 'fallback', name: 'returns the fallback on rejection' },
        {
          call: 'loadOr',
          argsSrc: '[() => new Promise((_, reject) => setTimeout(() => reject(new Error("late")), 10)), -1]',
          expect: -1,
          name: 'also handles late rejections',
        },
      ],
    },
  ],
};
