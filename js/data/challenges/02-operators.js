export default {
  id: 'operators',
  name: 'Operator Outpost',
  glyph: '+−',
  blurb: 'Math, remainders and the surprises of type coercion.',
  challenges: [
    {
      id: 'ops-average',
      title: 'Crunch the numbers',
      xp: 20,
      intro: `Arithmetic works as you would hope: \`+  -  *  /\`. Parentheses control the order.

\`\`\`js
const total = (2 + 3) * 4; // 20
\`\`\`

A **function** packages code you can reuse. This one returns a value with \`return\`:

\`\`\`js
function double(n) {
  return n * 2;
}
\`\`\``,
      task: 'Write a function `average(a, b)` that returns the average of two numbers.',
      starter: `function average(a, b) {\n  // return the average\n}\n`,
      solution: `function average(a, b) {\n  return (a + b) / 2;\n}\n`,
      hints: [
        'Add the numbers, then divide by 2.',
        'Mind the order: `a + b / 2` is not what you want. Use parentheses.',
        '`return (a + b) / 2;`',
      ],
      tests: [
        { call: 'average', args: [2, 4], expect: 3 },
        { call: 'average', args: [10, 0], expect: 5 },
        { call: 'average', args: [-3, 3], expect: 0 },
        { call: 'average', args: [1, 2], expect: 1.5 },
      ],
    },
    {
      id: 'ops-remainder',
      title: 'What is left over?',
      xp: 30,
      intro: `The **remainder** operator \`%\` gives what is left after dividing.

\`\`\`js
7 % 3;  // 1  (7 = 2×3 + 1)
8 % 2;  // 0  (nothing left)
\`\`\`

A number is even exactly when dividing it by 2 leaves no remainder. Comparison operators such as \`===\` produce booleans.`,
      task: 'Write `isEven(n)` that returns `true` for even numbers and `false` for odd ones.',
      starter: `function isEven(n) {\n  \n}\n`,
      solution: `function isEven(n) {\n  return n % 2 === 0;\n}\n`,
      hints: [
        'Use `n % 2`.',
        'Compare the result with `0` using `===`.',
        '`return n % 2 === 0;` (works for negatives too).',
      ],
      tests: [
        { call: 'isEven', args: [4], expect: true },
        { call: 'isEven', args: [7], expect: false },
        { call: 'isEven', args: [0], expect: true },
        { call: 'isEven', args: [-3], expect: false },
        { call: 'isEven', args: [-8], expect: true },
      ],
    },
    {
      id: 'ops-coercion',
      title: 'The "52" bug',
      xp: 50,
      boss: true,
      intro: `When you use \`+\` with a string, JavaScript **coerces** the other side to a string and glues them together:

\`\`\`js
"5" + 2;        // "52"  (string!)
Number("5") + 2; // 7
\`\`\`

Reading numbers from a form or a file usually gives you strings, so convert them with \`Number(...)\` first.`,
      task: 'The shop total is wrong: it shows "52" instead of 7. Fix the code so `total` is the *number* 7, keeping `price` as a string.',
      starter: `const price = "5";\nconst tax = 2;\n\n// bug: this glues strings together\nconst total = price + tax;\n`,
      solution: `const price = "5";\nconst tax = 2;\n\nconst total = Number(price) + tax;\n`,
      hints: [
        'The problem is that `price` is a string.',
        'Wrap it: `Number(price)`.',
        '`const total = Number(price) + tax;`',
      ],
      tests: [
        { expr: 'total', expect: 7, name: 'total is 7' },
        { expr: 'typeof total', expect: 'number', name: 'total is a number' },
        { expr: 'price', expect: '5', name: 'price is still the string "5"' },
      ],
    },
  ],
};
