export default {
  id: 'dom',
  name: 'DOM Dojo',
  glyph: '</>',
  blurb: 'Change a web page from JavaScript, with a mini DOM sandbox.',
  challenges: [
    {
      id: 'dom-text',
      title: 'Rewrite the headline',
      xp: 20,
      dom: '<h1 id="title">Loading…</h1>',
      intro: `The **DOM** is the live tree of elements that makes up a web page. JavaScript can find elements and change them.

\`\`\`js
const el = document.getElementById("title");
el.textContent = "New text";
\`\`\`

Here you get a mini page inside the sandbox (shown under **Page preview** after you run). It supports the everyday DOM methods used in these lessons.`,
      task: 'Find the element with id `title` and set its text to `Welcome, hero!`.',
      starter: `// the page contains: <h1 id="title">Loading…</h1>\n`,
      solution: `document.getElementById("title").textContent = "Welcome, hero!";\n`,
      hints: [
        '`document.getElementById("title")` returns the element.',
        'Set its `textContent` property.',
        '`document.getElementById("title").textContent = "Welcome, hero!";`',
      ],
      tests: [
        { expr: 'document.getElementById("title").textContent', expect: 'Welcome, hero!' },
        { expr: 'document.querySelectorAll("h1").length', expect: 1, name: 'still exactly one <h1>' },
      ],
    },
    {
      id: 'dom-create',
      title: 'Grow a list',
      xp: 30,
      dom: '<ul id="inventory"></ul>',
      intro: `Create elements with \`document.createElement\`, set their text, then attach them with \`appendChild\`:

\`\`\`js
const li = document.createElement("li");
li.textContent = "hello";
list.appendChild(li);
\`\`\`

Look elements up with CSS selectors using \`querySelector\` (first match) and \`querySelectorAll\` (all matches).`,
      task: 'Fill `<ul id="inventory">` with one `<li>` per entry of the `items` array, in order.',
      starter: `const items = ["sword", "shield", "potion"];\nconst list = document.getElementById("inventory");\n\n// add one <li> for each item\n`,
      solution: `const items = ["sword", "shield", "potion"];\nconst list = document.getElementById("inventory");\n\nfor (const item of items) {\n  const li = document.createElement("li");\n  li.textContent = item;\n  list.appendChild(li);\n}\n`,
      hints: [
        'Loop over `items` with `for...of`.',
        'Inside: `document.createElement("li")`, then set `textContent`.',
        'Finish each pass with `list.appendChild(li);`',
      ],
      tests: [
        { expr: 'document.querySelectorAll("#inventory li").length', expect: 3, name: 'three list items' },
        {
          expr: '[...document.querySelectorAll("#inventory li")].map((li) => li.textContent)',
          expect: ['sword', 'shield', 'potion'],
          name: 'in the right order',
        },
        { expr: 'document.getElementById("inventory").children.length', expect: 3, name: 'the items are direct children of the list' },
      ],
    },
    {
      id: 'dom-click',
      title: 'Click counter',
      xp: 40,
      dom: '<button id="add">+1</button> <span id="count">0</span>',
      intro: `Make a page react to the user with **event listeners**:

\`\`\`js
button.addEventListener("click", () => {
  console.log("clicked!");
});
\`\`\`

The callback runs every time the event happens. Remember that \`textContent\` is always a *string*.`,
      task: 'Each click on `#add` should increase the number inside `#count` by one (starting from 0).',
      starter: `const button = document.getElementById("add");\nconst count = document.getElementById("count");\n\n// react to clicks\n`,
      solution: `const button = document.getElementById("add");\nconst count = document.getElementById("count");\n\nbutton.addEventListener("click", () => {\n  count.textContent = Number(count.textContent) + 1;\n});\n`,
      hints: [
        'Call `button.addEventListener("click", ...)`.',
        'In the callback read the current number: `Number(count.textContent)`.',
        'Write back `Number(count.textContent) + 1` into `count.textContent`.',
      ],
      tests: [
        { expr: 'document.getElementById("count").textContent', expect: '0', name: 'starts at 0' },
        {
          setup: 'document.getElementById("add").click()',
          expr: 'document.getElementById("count").textContent',
          expect: '1',
          name: 'one click makes it 1',
        },
        {
          setup: 'for (let i = 0; i < 5; i++) document.getElementById("add").click()',
          expr: 'document.getElementById("count").textContent',
          expect: '5',
          name: 'five clicks make it 5',
        },
      ],
    },
    {
      id: 'dom-toggle',
      title: 'Light switch',
      xp: 50,
      boss: true,
      dom: '<button id="switch">Toggle</button><div id="bulb" class="bulb"></div>',
      intro: `CSS classes control how elements look; JavaScript can flip them with \`classList\`:

- \`el.classList.add("on")\`
- \`el.classList.remove("on")\`
- \`el.classList.toggle("on")\` — adds if missing, removes if present
- \`el.classList.contains("on")\`

Also try \`el.setAttribute("aria-pressed", "true")\` — accessibility attributes are just attributes.`,
      task: 'Clicking `#switch` should toggle the class `on` on `#bulb`, and keep the button\'s `aria-pressed` attribute in sync (`"true"` while on, `"false"` while off). Start with `aria-pressed="false"`.',
      starter: `const sw = document.getElementById("switch");\nconst bulb = document.getElementById("bulb");\n\n// set the initial aria-pressed, then handle clicks\n`,
      solution: `const sw = document.getElementById("switch");\nconst bulb = document.getElementById("bulb");\n\nsw.setAttribute("aria-pressed", "false");\nsw.addEventListener("click", () => {\n  const on = bulb.classList.toggle("on");\n  sw.setAttribute("aria-pressed", String(on));\n});\n`,
      hints: [
        'Set `aria-pressed` to "false" immediately, before any click.',
        '`classList.toggle("on")` returns `true` when the class was added.',
        'Use that result: `sw.setAttribute("aria-pressed", String(on));`',
      ],
      tests: [
        { expr: 'document.getElementById("switch").getAttribute("aria-pressed")', expect: 'false', name: 'starts with aria-pressed="false"' },
        {
          setup: 'document.getElementById("switch").click()',
          expr: '[document.getElementById("bulb").classList.contains("on"), document.getElementById("switch").getAttribute("aria-pressed")]',
          expect: [true, 'true'],
          name: 'first click turns it on',
        },
        {
          setup: 'document.getElementById("switch").click(); document.getElementById("switch").click()',
          expr: '[document.getElementById("bulb").classList.contains("on"), document.getElementById("switch").getAttribute("aria-pressed")]',
          expect: [false, 'false'],
          name: 'second click turns it off again',
        },
        {
          setup: 'document.getElementById("switch").click()',
          expr: 'document.getElementById("bulb").className',
          expect: 'bulb on',
          name: 'keeps the existing "bulb" class',
        },
      ],
    },
  ],
};
