export default {
  id: 'conditionals',
  name: 'Fork Forest',
  glyph: 'if',
  blurb: 'Make decisions with if, else and logical operators.',
  challenges: [
    {
      id: 'cond-sign',
      title: 'Positive, negative or zero?',
      xp: 20,
      intro: `\`if\` runs code only when a condition is true. Chain more cases with \`else if\`, and catch everything else with \`else\`.

\`\`\`js
if (temp > 30) {
  return "hot";
} else if (temp > 15) {
  return "mild";
} else {
  return "cold";
}
\`\`\``,
      task: 'Write `sign(n)` returning `"positive"`, `"negative"` or `"zero"`.',
      starter: `function sign(n) {\n  \n}\n`,
      solution: `function sign(n) {\n  if (n > 0) return "positive";\n  if (n < 0) return "negative";\n  return "zero";\n}\n`,
      hints: [
        'Test `n > 0` first.',
        'Then check `n < 0`.',
        'Whatever is left must be zero, so a plain `return "zero";` works at the end.',
      ],
      tests: [
        { call: 'sign', args: [5], expect: 'positive' },
        { call: 'sign', args: [-2], expect: 'negative' },
        { call: 'sign', args: [0], expect: 'zero' },
        { call: 'sign', args: [0.1], expect: 'positive' },
      ],
    },
    {
      id: 'cond-grade',
      title: 'Report card',
      xp: 30,
      intro: `Order matters in an \`else if\` chain: the first condition that is true wins, and the rest are skipped. So check the *strictest* condition first.`,
      task: 'Write `grade(score)`: 90 or more is `"A"`, 80 or more `"B"`, 70 or more `"C"`, anything lower `"F"`.',
      starter: `function grade(score) {\n  \n}\n`,
      solution: `function grade(score) {\n  if (score >= 90) return "A";\n  if (score >= 80) return "B";\n  if (score >= 70) return "C";\n  return "F";\n}\n`,
      hints: [
        'Start from the top: `if (score >= 90) return "A";`',
        'Because earlier checks returned, `score >= 80` already means "80 to 89".',
        'Finish with `return "F";`',
      ],
      tests: [
        { call: 'grade', args: [95], expect: 'A' },
        { call: 'grade', args: [90], expect: 'A' },
        { call: 'grade', args: [89], expect: 'B' },
        { call: 'grade', args: [70], expect: 'C' },
        { call: 'grade', args: [12], expect: 'F' },
        { call: 'grade', args: [69.5], expect: 'F', hidden: true },
      ],
    },
    {
      id: 'cond-logic',
      title: 'Can I ride?',
      xp: 50,
      boss: true,
      intro: `Combine conditions with logical operators:

- \`&&\` — **and**: both sides must be true
- \`||\` — **or**: at least one side
- \`!\` — **not**

\`\`\`js
const ok = age >= 18 && hasTicket;
\`\`\`

A **ternary** \`cond ? a : b\` is a compact if/else for values.`,
      task: 'A ride needs `height >= 120`. Younger riders (`age < 12`) must also have an adult with them. Write `canRide(height, age, hasAdult)` returning a boolean.',
      starter: `function canRide(height, age, hasAdult) {\n  \n}\n`,
      solution: `function canRide(height, age, hasAdult) {\n  return height >= 120 && (age >= 12 || hasAdult);\n}\n`,
      hints: [
        'Height is always required: start with `height >= 120 &&`.',
        'The second part is "old enough OR accompanied".',
        '`return height >= 120 && (age >= 12 || hasAdult);`',
      ],
      tests: [
        { call: 'canRide', args: [130, 15, false], expect: true },
        { call: 'canRide', args: [110, 15, false], expect: false },
        { call: 'canRide', args: [130, 8, false], expect: false },
        { call: 'canRide', args: [130, 8, true], expect: true },
        { call: 'canRide', args: [120, 12, false], expect: true },
        { call: 'canRide', args: [119, 8, true], expect: false, hidden: true },
      ],
    },
  ],
};
