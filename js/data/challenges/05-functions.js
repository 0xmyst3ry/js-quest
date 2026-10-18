export default {
  id: 'functions',
  name: 'Function Foundry',
  glyph: 'ƒ',
  blurb: 'Build reusable machines: parameters, defaults, callbacks.',
  challenges: [
    {
      id: 'fn-greet',
      title: 'Say hello',
      xp: 20,
      intro: `A function takes **parameters** (inputs) and hands back a result with \`return\`. Template literals (backticks) let you drop values into text with \`\${...}\`:

\`\`\`js
function shout(word) {
  return \`\${word}!\`;
}
shout("hey"); // "hey!"
\`\`\``,
      task: 'Write `greet(name)` returning `Hello, <name>!` — for example `Hello, Ada!`.',
      starter: `function greet(name) {\n  \n}\n`,
      solution: 'function greet(name) {\n  return `Hello, ${name}!`;\n}\n',
      hints: [
        'Use a template literal with backticks.',
        'Embed the parameter as `${name}`.',
        'Mind the comma, the space and the exclamation mark.',
      ],
      tests: [
        { call: 'greet', args: ['Ada'], expect: 'Hello, Ada!' },
        { call: 'greet', args: ['World'], expect: 'Hello, World!' },
        { call: 'greet', args: [''], expect: 'Hello, !' },
      ],
    },
    {
      id: 'fn-default',
      title: 'Sensible defaults',
      xp: 30,
      intro: `Give a parameter a **default value** and callers can leave it out:

\`\`\`js
function hello(name = "friend") {
  return "hi " + name;
}
hello();      // "hi friend"
hello("Bo");  // "hi Bo"
\`\`\`

The default is used only when the argument is \`undefined\`.`,
      task: 'Write `power(base, exp)` returning `base` raised to `exp`. If `exp` is missing it should default to `2` (a square). Use a loop or `**`.',
      starter: `function power(base, exp) {\n  \n}\n`,
      solution: `function power(base, exp = 2) {\n  return base ** exp;\n}\n`,
      hints: [
        'Declare the parameter as `exp = 2`.',
        'The exponent operator is `**`: `2 ** 3` is 8.',
        '`return base ** exp;`',
      ],
      tests: [
        { call: 'power', args: [3], expect: 9, name: 'power(3) uses the default exponent' },
        { call: 'power', args: [2, 3], expect: 8 },
        { call: 'power', args: [5, 0], expect: 1 },
        { call: 'power', args: [10, 3], expect: 1000 },
      ],
    },
    {
      id: 'fn-apply',
      title: 'Functions as values',
      xp: 50,
      boss: true,
      intro: `In JavaScript functions are values — you can pass them around. A function that takes another function is a **higher-order function**, and the function you pass is a **callback**.

Arrow functions are a compact way to write them:

\`\`\`js
const add1 = (n) => n + 1;
[1, 2, 3].map(add1); // [2, 3, 4]
\`\`\``,
      task: 'Write `applyTwice(fn, x)` that calls `fn` on `x`, then calls `fn` again on the result, and returns it.',
      starter: `function applyTwice(fn, x) {\n  \n}\n`,
      solution: `function applyTwice(fn, x) {\n  return fn(fn(x));\n}\n`,
      hints: [
        'Calling a parameter that holds a function looks like `fn(x)`.',
        'Feed the output of the first call into a second call.',
        '`return fn(fn(x));`',
      ],
      tests: [
        { call: 'applyTwice', argsSrc: '[(n) => n + 3, 1]', expect: 7 },
        { call: 'applyTwice', argsSrc: '[(s) => s + "!", "hi"]', expect: 'hi!!' },
        { call: 'applyTwice', argsSrc: '[(a) => a.concat(a.length), []]', expect: [0, 1] },
      ],
    },
  ],
};
