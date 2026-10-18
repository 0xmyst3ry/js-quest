export default {
  id: 'strings',
  name: 'String Spire',
  glyph: '" "',
  blurb: 'Slice, search and reshape text.',
  challenges: [
    {
      id: 'str-template',
      title: 'Introduce yourself',
      xp: 20,
      intro: `Template literals use backticks and can span values and expressions:

\`\`\`js
const n = 3;
\`You have \${n} new \${n === 1 ? "message" : "messages"}\`;
\`\`\``,
      task: 'Write `introduce(name, age)` returning `Hi, I\'m <name> and I\'m <age>.` — for example `Hi, I\'m Ana and I\'m 30.`',
      starter: `function introduce(name, age) {\n  \n}\n`,
      solution: 'function introduce(name, age) {\n  return `Hi, I\'m ${name} and I\'m ${age}.`;\n}\n',
      hints: [
        'Use backticks so you can embed values.',
        'The apostrophes are fine inside backticks.',
        '`` `Hi, I\'m ${name} and I\'m ${age}.` ``',
      ],
      tests: [
        { call: 'introduce', args: ['Ana', 30], expect: "Hi, I'm Ana and I'm 30." },
        { call: 'introduce', args: ['Bo', 7], expect: "Hi, I'm Bo and I'm 7." },
      ],
    },
    {
      id: 'str-title-case',
      title: 'Title Case Machine',
      xp: 30,
      intro: `Strings come with handy methods (they never change the original — they return a new string):

- \`s.split(" ")\` → array of words
- \`arr.join(" ")\` → back to a string
- \`s.toUpperCase()\`, \`s.toLowerCase()\`
- \`s[0]\`, \`s.slice(1)\` → first letter / the rest`,
      task: 'Write `titleCase(sentence)` that capitalises the first letter of every word and lowercases the rest: `"hELLO wORLD"` → `"Hello World"`.',
      starter: `function titleCase(sentence) {\n  \n}\n`,
      solution: `function titleCase(sentence) {\n  return sentence\n    .split(" ")\n    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())\n    .join(" ");\n}\n`,
      hints: [
        'Split into words, transform each, then join again.',
        'For one word: `w[0].toUpperCase() + w.slice(1).toLowerCase()`.',
        'Use `charAt(0)` instead of `w[0]` so empty words do not crash.',
      ],
      tests: [
        { call: 'titleCase', args: ['hello world'], expect: 'Hello World' },
        { call: 'titleCase', args: ['hELLO wORLD'], expect: 'Hello World' },
        { call: 'titleCase', args: ['a'], expect: 'A' },
        { call: 'titleCase', args: [''], expect: '' },
        { call: 'titleCase', args: ['the quick brown fox'], expect: 'The Quick Brown Fox' },
      ],
    },
    {
      id: 'str-palindrome',
      title: 'Reads the same both ways',
      xp: 50,
      boss: true,
      intro: `Strings have no \`reverse\` method, but arrays do — so convert: \`s.split("").reverse().join("")\`.

A **regular expression** can strip unwanted characters:

\`\`\`js
"a-b c!".replace(/[^a-z]/g, ""); // "abc"
\`\`\`

\`[^a-z]\` means "anything that is not a lowercase letter"; the \`g\` flag means "everywhere".`,
      task: 'Write `isPalindrome(text)`: true if the letters and digits read the same forwards and backwards, ignoring case, spaces and punctuation.',
      starter: `function isPalindrome(text) {\n  \n}\n`,
      solution: `function isPalindrome(text) {\n  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, "");\n  return clean === clean.split("").reverse().join("");\n}\n`,
      hints: [
        'Normalise first: lowercase, then remove everything that is not a letter or digit.',
        '`text.toLowerCase().replace(/[^a-z0-9]/g, "")`',
        'Compare the cleaned string with its reversed copy.',
      ],
      tests: [
        { call: 'isPalindrome', args: ['racecar'], expect: true },
        { call: 'isPalindrome', args: ['hello'], expect: false },
        { call: 'isPalindrome', args: ['A man, a plan, a canal: Panama'], expect: true },
        { call: 'isPalindrome', args: [''], expect: true },
        { call: 'isPalindrome', args: ['No lemon, no melon'], expect: true, hidden: true },
        { call: 'isPalindrome', args: ['Not quite'], expect: false, hidden: true },
      ],
    },
  ],
};
