export default {
  id: 'scope',
  name: 'Closure Caverns',
  glyph: '( )',
  blurb: 'Where variables live, and how functions remember them.',
  challenges: [
    {
      id: 'scope-loop',
      title: 'The classic loop bug',
      xp: 30,
      intro: `**Scope** decides where a variable can be seen. \`let\` and \`const\` are *block scoped* — each pass of a loop body gets its own copy. \`var\` is *function scoped* — one shared copy for the whole function.

\`\`\`js
for (var i = 0; i < 3; i++) {}
console.log(i); // 3 — leaked out of the loop!
\`\`\`

Functions that capture a \`var\` loop counter all see its **final** value.`,
      task: '`makeCallbacks()` should return three functions that return `0`, `1` and `2`. Right now they all return `3`. Fix it.',
      starter: `function makeCallbacks() {\n  const fns = [];\n  for (var i = 0; i < 3; i++) {\n    fns.push(() => i);\n  }\n  return fns;\n}\n`,
      solution: `function makeCallbacks() {\n  const fns = [];\n  for (let i = 0; i < 3; i++) {\n    fns.push(() => i);\n  }\n  return fns;\n}\n`,
      hints: [
        'The culprit is the keyword in the `for (...)` header.',
        'Switch `var` to `let` so every iteration gets its own `i`.',
        'Change `for (var i = 0; ...` into `for (let i = 0; ...`',
      ],
      tests: [
        { expr: 'makeCallbacks().map((f) => f())', expect: [0, 1, 2] },
        { expr: 'makeCallbacks().length', expect: 3, name: 'returns three functions' },
      ],
    },
    {
      id: 'closure-counter',
      title: 'A counter with a memory',
      xp: 40,
      intro: `A **closure** is a function that remembers the variables around it, even after the outer function has finished.

\`\`\`js
function makeGreeter(greeting) {
  return (name) => greeting + ", " + name;
}
const hi = makeGreeter("Hi");
hi("Ann"); // "Hi, Ann"
\`\`\`

\`hi\` still remembers \`greeting\`. Each call to \`makeGreeter\` creates a fresh, private copy.`,
      task: 'Write `makeCounter()` that returns a function. Each call to that function returns the next number, starting at `1`. Separate counters must not share state.',
      starter: `function makeCounter() {\n  \n}\n`,
      solution: `function makeCounter() {\n  let count = 0;\n  return () => {\n    count++;\n    return count;\n  };\n}\n`,
      hints: [
        'Declare `let count = 0;` inside `makeCounter`, outside the returned function.',
        'The returned function should increase `count` and return it.',
        'Return an arrow function: `return () => { count++; return count; };`',
      ],
      tests: [
        { expr: '(() => { const c = makeCounter(); return [c(), c(), c()]; })()', expect: [1, 2, 3], name: 'counts 1, 2, 3' },
        {
          expr: '(() => { const a = makeCounter(); const b = makeCounter(); return [a(), a(), b()]; })()',
          expect: [1, 2, 1],
          name: 'counters are independent',
        },
      ],
    },
    {
      id: 'closure-once',
      title: 'Only once, please',
      xp: 50,
      boss: true,
      intro: `Closures power many everyday patterns: private state, factories, memoisation, and wrappers that change how another function behaves.

A **wrapper** takes a function and returns a new one, often calling the original with \`fn(...args)\` (the *rest* and *spread* syntax packs and unpacks arguments).`,
      task: 'Write `once(fn)` returning a new function that calls `fn` only the first time. Later calls skip `fn` and return the first result.',
      starter: `function once(fn) {\n  \n}\n`,
      solution: `function once(fn) {\n  let called = false;\n  let result;\n  return (...args) => {\n    if (!called) {\n      called = true;\n      result = fn(...args);\n    }\n    return result;\n  };\n}\n`,
      hints: [
        'Remember two things in the closure: whether it ran, and its result.',
        'Accept any arguments with `(...args)` and forward them: `fn(...args)`.',
        'Set `called = true` the first time, store `result`, and always `return result`.',
      ],
      tests: [
        {
          name: 'runs fn only once',
          expr: '(() => { let n = 0; const f = once(() => ++n); f(); f(); f(); return n; })()',
          expect: 1,
        },
        {
          name: 'returns the first result every time',
          expr: '(() => { const f = once((x) => x * 2); return [f(5), f(100), f(7)]; })()',
          expect: [10, 10, 10],
        },
        {
          name: 'each wrapper is independent',
          expr: '(() => { const a = once(() => "A"); const b = once(() => "B"); return [a(), b(), a()]; })()',
          expect: ['A', 'B', 'A'],
        },
      ],
    },
  ],
};
