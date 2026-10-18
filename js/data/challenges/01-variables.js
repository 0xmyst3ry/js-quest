export default {
  id: 'variables',
  name: 'Variable Valley',
  glyph: 'let',
  blurb: 'Name things, store values, meet the basic types.',
  challenges: [
    {
      id: 'vars-let',
      title: 'Name your hero',
      xp: 20,
      intro: `A **variable** is a labelled box that holds a value. Create one with \`let\`:

\`\`\`js
let score = 10;
score = 11; // let variables can change
\`\`\`

Text values are called **strings** and live inside quotes.`,
      task: 'Declare a variable called `hero` and store the string `"Ada"` in it.',
      starter: `// Declare \`hero\` below\n`,
      solution: `let hero = "Ada";\n`,
      hints: [
        'Start with the keyword `let`, then the name, then `=` and the value.',
        'Strings need quotes: `"Ada"`.',
        'The full line is `let hero = "Ada";`',
      ],
      tests: [
        { expr: 'hero', expect: 'Ada', name: 'hero is "Ada"' },
        { expr: 'typeof hero', expect: 'string', name: 'hero is a string' },
      ],
    },
    {
      id: 'vars-const',
      title: 'Things that never change',
      xp: 30,
      intro: `Use \`const\` for values that must never be reassigned. Trying to change one throws a \`TypeError\`.

\`\`\`js
const PI = 3.14159;
let lives = 3;
lives = lives - 1; // fine: 2
\`\`\`

Rule of thumb: reach for \`const\` first and switch to \`let\` only when the value needs to change.`,
      task: 'Create a constant `MAX_LIVES` equal to `3`. Then create a `let` variable `lives` that starts at `MAX_LIVES` and loses one life (so it ends at `2`).',
      starter: `// 1. const MAX_LIVES = ...\n// 2. let lives = ...\n// 3. take one life away\n`,
      solution: `const MAX_LIVES = 3;\nlet lives = MAX_LIVES;\nlives = lives - 1;\n`,
      hints: [
        '`const MAX_LIVES = 3;` on its own line is step one.',
        'Start `lives` from the constant: `let lives = MAX_LIVES;`',
        'Reassign with `lives = lives - 1;` (or `lives--`).',
      ],
      tests: [
        { expr: 'MAX_LIVES', expect: 3, name: 'MAX_LIVES is 3' },
        { expr: 'lives', expect: 2, name: 'lives ends at 2' },
        {
          name: 'MAX_LIVES is a real const',
          expr: '(() => { try { MAX_LIVES = 99; } catch (e) { return e instanceof TypeError; } return false; })()',
          expect: true,
        },
      ],
    },
    {
      id: 'vars-types',
      title: 'Four kinds of values',
      xp: 50,
      boss: true,
      intro: `JavaScript values come in types. The four you will use constantly:

- **number** → \`42\`, \`3.5\`
- **string** → \`"hello"\`
- **boolean** → \`true\` or \`false\`
- **null** → "deliberately empty"

\`typeof 42\` gives \`"number"\`. (A famous quirk: \`typeof null\` is \`"object"\`.)`,
      task: 'Declare `answer` (the number 42), `greeting` (the string "hello"), `isReady` (the boolean true) and `nothing` (null).',
      starter: `// declare four variables:\n// answer, greeting, isReady, nothing\n`,
      solution: `const answer = 42;\nconst greeting = "hello";\nconst isReady = true;\nconst nothing = null;\n`,
      hints: [
        'Each variable is one line: `const name = value;`',
        'Booleans and null are written without quotes.',
        'Do not wrap `42` in quotes, or it becomes a string.',
      ],
      tests: [
        { expr: 'typeof answer', expect: 'number', name: 'answer is a number' },
        { expr: 'answer', expect: 42, name: 'answer is 42' },
        { expr: 'greeting', expect: 'hello', name: 'greeting is "hello"' },
        { expr: 'isReady', expect: true, name: 'isReady is true' },
        { expr: 'nothing', expect: null, name: 'nothing is null' },
      ],
    },
  ],
};
