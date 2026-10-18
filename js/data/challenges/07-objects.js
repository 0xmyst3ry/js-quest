export default {
  id: 'objects',
  name: 'Object Observatory',
  glyph: '{ }',
  blurb: 'Group related data with keys and values.',
  challenges: [
    {
      id: 'obj-create',
      title: 'Build a player',
      xp: 20,
      intro: `An **object** groups related values under named keys:

\`\`\`js
const cat = { name: "Miso", lives: 9 };
cat.name;        // "Miso"
cat.lives = 8;   // update a key
cat.color = "grey"; // add a key
\`\`\``,
      task: 'Create a `const player` object with `name` `"Zed"`, `level` `1` and an empty array `inventory`.',
      starter: `// const player = ...\n`,
      solution: `const player = {\n  name: "Zed",\n  level: 1,\n  inventory: [],\n};\n`,
      hints: [
        'Objects use curly braces with `key: value` pairs separated by commas.',
        'An empty array is `[]`.',
        '`const player = { name: "Zed", level: 1, inventory: [] };`',
      ],
      tests: [
        { expr: 'player', expect: { name: 'Zed', level: 1, inventory: [] }, name: 'player has the right shape' },
        { expr: 'Array.isArray(player.inventory)', expect: true, name: 'inventory is an array' },
      ],
    },
    {
      id: 'obj-destructure',
      title: 'Unpack with destructuring',
      xp: 30,
      intro: `**Destructuring** pulls values out of an object into variables in one line:

\`\`\`js
const { name, level } = player;
\`\`\`

It also works directly in function parameters:

\`\`\`js
function show({ name }) {
  return name;
}
\`\`\``,
      task: 'Write `summary({ name, level })` returning a string like `Zed (lvl 3)`. Destructure in the parameter list.',
      starter: `function summary(player) {\n  \n}\n`,
      solution: 'function summary({ name, level }) {\n  return `${name} (lvl ${level})`;\n}\n',
      hints: [
        'Change the parameter to `{ name, level }`.',
        'Use a template literal: `` `${name} (lvl ${level})` ``.',
        'Format is exactly `Name (lvl N)`.',
      ],
      tests: [
        { call: 'summary', args: [{ name: 'Zed', level: 3 }], expect: 'Zed (lvl 3)' },
        { call: 'summary', args: [{ name: 'Ada', level: 10, extra: true }], expect: 'Ada (lvl 10)' },
        {
          name: 'uses destructuring in the parameter list',
          expr: '/\\(\\s*\\{/.test(summary.toString())',
          expect: true,
        },
      ],
    },
    {
      id: 'obj-invert',
      title: 'Flip the dictionary',
      xp: 50,
      boss: true,
      intro: `Walk an object with:

- \`Object.keys(obj)\` → array of keys
- \`Object.values(obj)\` → array of values
- \`Object.entries(obj)\` → array of \`[key, value]\` pairs

\`\`\`js
for (const [key, value] of Object.entries({ a: 1 })) {
  console.log(key, value); // a 1
}
\`\`\`

Use \`obj[key] = value\` to set a key whose name is stored in a variable.`,
      task: 'Write `invert(obj)` that swaps keys and values: `{ a: "x", b: "y" }` becomes `{ x: "a", y: "b" }`. Return a new object.',
      starter: `function invert(obj) {\n  const result = {};\n  \n  return result;\n}\n`,
      solution: `function invert(obj) {\n  const result = {};\n  for (const [key, value] of Object.entries(obj)) {\n    result[value] = key;\n  }\n  return result;\n}\n`,
      hints: [
        'Loop over `Object.entries(obj)` with `for...of`.',
        'Destructure each pair as `[key, value]`.',
        '`result[value] = key;`',
      ],
      tests: [
        { call: 'invert', args: [{ a: 'x', b: 'y' }], expect: { x: 'a', y: 'b' } },
        { call: 'invert', args: [{}], expect: {} },
        { call: 'invert', args: [{ one: '1', two: '2', three: '3' }], expect: { 1: 'one', 2: 'two', 3: 'three' } },
      ],
    },
  ],
};
