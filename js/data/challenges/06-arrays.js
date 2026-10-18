export default {
  id: 'arrays',
  name: 'Array Archipelago',
  glyph: '[ ]',
  blurb: 'Ordered lists and the map / filter / reduce trio.',
  challenges: [
    {
      id: 'arr-last',
      title: 'The last item',
      xp: 20,
      intro: `An **array** is an ordered list. Positions (indexes) start at 0:

\`\`\`js
const fruits = ["fig", "plum", "kiwi"];
fruits[0];            // "fig"
fruits.length;        // 3
fruits[fruits.length - 1]; // "kiwi"
\`\`\`

Reading past the end gives \`undefined\`, not an error.`,
      task: 'Write `lastItem(arr)` returning the last element, or `undefined` for an empty array.',
      starter: `function lastItem(arr) {\n  \n}\n`,
      solution: `function lastItem(arr) {\n  return arr[arr.length - 1];\n}\n`,
      hints: [
        'The last index is `arr.length - 1`.',
        'An empty array gives index `-1`, which is `undefined` — no special case needed.',
        '`return arr[arr.length - 1];`  (or `arr.at(-1)`)',
      ],
      tests: [
        { call: 'lastItem', args: [[1, 2, 3]], expect: 3 },
        { call: 'lastItem', args: [['solo']], expect: 'solo' },
        { call: 'lastItem', args: [[]], expect: undefined },
      ],
    },
    {
      id: 'arr-map-filter',
      title: 'Filter, then transform',
      xp: 30,
      intro: `Two workhorse methods return **new** arrays and leave the original alone:

- \`arr.filter(fn)\` keeps the items where \`fn\` returns true
- \`arr.map(fn)\` transforms every item

\`\`\`js
[1, 2, 3, 4].filter((n) => n > 2); // [3, 4]
[1, 2, 3].map((n) => n * 10);      // [10, 20, 30]
\`\`\`

They chain: \`arr.filter(...).map(...)\`.`,
      task: 'Write `evenSquares(nums)` returning the squares of only the even numbers, in order.',
      starter: `function evenSquares(nums) {\n  \n}\n`,
      solution: `function evenSquares(nums) {\n  return nums.filter((n) => n % 2 === 0).map((n) => n * n);\n}\n`,
      hints: [
        'First keep the evens with `filter`.',
        'Then square each remaining number with `map`.',
        '`nums.filter((n) => n % 2 === 0).map((n) => n * n)`',
      ],
      tests: [
        { call: 'evenSquares', args: [[1, 2, 3, 4, 5, 6]], expect: [4, 16, 36] },
        { call: 'evenSquares', args: [[1, 3, 5]], expect: [] },
        { call: 'evenSquares', args: [[]], expect: [] },
        { call: 'evenSquares', args: [[-2, 0, 7]], expect: [4, 0] },
      ],
    },
    {
      id: 'arr-reduce',
      title: 'Boil it down',
      xp: 50,
      boss: true,
      intro: `\`reduce\` folds an array into a single value. It takes a callback \`(accumulator, item)\` and a starting value:

\`\`\`js
[1, 2, 3].reduce((sum, n) => sum + n, 0); // 6
\`\`\`

The accumulator can be a number, string, array or object — whatever you need.`,
      task: 'Each cart item looks like `{ name, price, qty }`. Write `cartTotal(items)` returning the sum of `price * qty`. An empty cart totals `0`.',
      starter: `function cartTotal(items) {\n  \n}\n`,
      solution: `function cartTotal(items) {\n  return items.reduce((sum, item) => sum + item.price * item.qty, 0);\n}\n`,
      hints: [
        'Start the accumulator at `0` (second argument of `reduce`).',
        'For each item add `item.price * item.qty`.',
        '`items.reduce((sum, item) => sum + item.price * item.qty, 0)`',
      ],
      tests: [
        {
          call: 'cartTotal',
          args: [[{ name: 'pen', price: 2, qty: 3 }, { name: 'book', price: 10, qty: 1 }]],
          expect: 16,
        },
        { call: 'cartTotal', args: [[]], expect: 0 },
        { call: 'cartTotal', args: [[{ name: 'gem', price: 0.5, qty: 4 }]], expect: 2 },
      ],
    },
  ],
};
