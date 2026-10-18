// A small, forgiving JavaScript tokenizer used only for colouring code.
// It never has to be exact, so it favours speed and never throwing.

const KEYWORDS = new Set(
  ('async await break case catch class const continue default delete do else export extends finally for from function if import in instanceof let new of return static super switch this throw try typeof var void while yield').split(' '),
);
const LITERALS = new Set(['true', 'false', 'null', 'undefined', 'NaN', 'Infinity']);

const TOKEN_RE = /(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|("(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|`(?:\\[\s\S]|[^`\\])*`?)|(\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?\b)|([A-Za-z_$][\w$]*)(\s*\()?/g;

/** @returns {{ type: string, text: string }[]} */
export function tokenize(code) {
  const out = [];
  let last = 0;
  let m;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(code))) {
    if (m.index > last) out.push({ type: 'plain', text: code.slice(last, m.index) });
    const [full, comment, string, number, word, call] = m;
    if (comment) out.push({ type: 'com', text: comment });
    else if (string) out.push({ type: 'str', text: string });
    else if (number) out.push({ type: 'num', text: number });
    else if (word) {
      if (KEYWORDS.has(word)) out.push({ type: 'kw', text: word });
      else if (LITERALS.has(word)) out.push({ type: 'lit', text: word });
      else if (call) out.push({ type: 'fn', text: word });
      else out.push({ type: 'plain', text: word });
      if (call) out.push({ type: 'plain', text: call });
    } else out.push({ type: 'plain', text: full });
    last = TOKEN_RE.lastIndex;
    if (full.length === 0) TOKEN_RE.lastIndex++;
  }
  if (last < code.length) out.push({ type: 'plain', text: code.slice(last) });
  return out;
}

/** DOM nodes (text + <span class="tok-…">) for a code string. */
export function highlight(code) {
  return tokenize(code).map(({ type, text }) => {
    if (type === 'plain') return document.createTextNode(text);
    const span = document.createElement('span');
    span.className = `tok-${type}`;
    span.textContent = text;
    return span;
  });
}
