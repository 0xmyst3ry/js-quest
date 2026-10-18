export default {
  id: 'loops',
  name: 'Loop Labyrinth',
  glyph: '↻',
  blurb: 'Repeat work with for and while loops.',
  challenges: [
    {
      id: 'loops-sum',
      title: 'Add them all up',
      xp: 20,
      intro: `A \`for\` loop has three parts: where to start, when to keep going, and how to step.

\`\`\`js
for (let i = 0; i < 3; i++) {
  console.log(i); // 0, 1, 2
}
\`\`\`

Combine a loop with a variable that *accumulates* a result.`,
      task: 'Write `sumTo(n)` that returns 1 + 2 + … + n. `sumTo(0)` is `0`.',
      starter: `function sumTo(n) {\n  let total = 0;\n  // loop here\n  return total;\n}\n`,
      solution: `function sumTo(n) {\n  let total = 0;\n  for (let i = 1; i <= n; i++) {\n    total += i;\n  }\n  return total;\n}\n`,
      hints: [
        'Loop `i` from 1 up to and including `n`.',
        'Inside the loop add `i` to `total`: `total += i;`',
        '`for (let i = 1; i <= n; i++) { total += i; }`',
      ],
      tests: [
        { call: 'sumTo', args: [1], expect: 1 },
        { call: 'sumTo', args: [4], expect: 10 },
        { call: 'sumTo', args: [100], expect: 5050 },
        { call: 'sumTo', args: [0], expect: 0 },
      ],
    },
    {
      id: 'loops-fizzbuzz',
      title: 'FizzBuzz',
      xp: 30,
      intro: `The classic warm-up. Loop from 1 to \`n\` and build an array with \`push\`:

\`\`\`js
const out = [];
out.push("a");
\`\`\`

Check the *combined* case (divisible by both) before the single ones.`,
      task: 'Write `fizzBuzz(n)` returning an array for 1..n: `"FizzBuzz"` for multiples of 15, `"Fizz"` for multiples of 3, `"Buzz"` for multiples of 5, otherwise the number itself.',
      starter: `function fizzBuzz(n) {\n  const out = [];\n  \n  return out;\n}\n`,
      solution: `function fizzBuzz(n) {\n  const out = [];\n  for (let i = 1; i <= n; i++) {\n    if (i % 15 === 0) out.push("FizzBuzz");\n    else if (i % 3 === 0) out.push("Fizz");\n    else if (i % 5 === 0) out.push("Buzz");\n    else out.push(i);\n  }\n  return out;\n}\n`,
      hints: [
        'Use `i % 3 === 0` to test for multiples of 3.',
        'Test `i % 15 === 0` first, or "FizzBuzz" will never appear.',
        'Push the number itself in the final `else`.',
      ],
      tests: [
        { call: 'fizzBuzz', args: [5], expect: [1, 2, 'Fizz', 4, 'Buzz'] },
        { call: 'fizzBuzz', args: [0], expect: [] },
        {
          call: 'fizzBuzz',
          args: [15],
          expect: [1, 2, 'Fizz', 4, 'Buzz', 'Fizz', 7, 8, 'Fizz', 'Buzz', 11, 'Fizz', 13, 14, 'FizzBuzz'],
        },
      ],
    },
    {
      id: 'loops-collatz',
      title: 'The Collatz journey',
      xp: 50,
      boss: true,
      intro: `Use \`while\` when you do not know in advance how many repetitions you need — it runs as long as its condition is true.

\`\`\`js
let n = 10;
while (n > 0) {
  n = n - 3;
}
\`\`\`

**Collatz**: from any positive integer, if it is even halve it, otherwise do \`3n + 1\`. You always seem to reach 1.`,
      task: 'Write `collatz(n)` returning how many steps it takes to reach 1. `collatz(1)` is `0`; `collatz(6)` is `8` (6→3→10→5→16→8→4→2→1).',
      starter: `function collatz(n) {\n  let steps = 0;\n  \n  return steps;\n}\n`,
      solution: `function collatz(n) {\n  let steps = 0;\n  while (n !== 1) {\n    n = n % 2 === 0 ? n / 2 : 3 * n + 1;\n    steps++;\n  }\n  return steps;\n}\n`,
      hints: [
        'Loop `while (n !== 1)`.',
        'Inside: update `n` (halve if even, else `3 * n + 1`) and count one step.',
        'A ternary keeps it short: `n = n % 2 === 0 ? n / 2 : 3 * n + 1;`',
      ],
      tests: [
        { call: 'collatz', args: [1], expect: 0 },
        { call: 'collatz', args: [6], expect: 8 },
        { call: 'collatz', args: [7], expect: 16 },
        { call: 'collatz', args: [27], expect: 111, hidden: true },
      ],
    },
  ],
};
