import { escHtml } from './html.utils';

const KEYWORDS = new Set([
  'describe', 'it', 'xit', 'fit', 'xdescribe', 'fdescribe',
  'beforeEach', 'afterEach', 'before', 'after', 'context',
  'const', 'let', 'var', 'function', 'return', 'if', 'else',
  'import', 'export', 'from', 'new', 'this', 'null', 'undefined',
  'true', 'false', 'async', 'await', 'of', 'in', 'typeof', 'void',
]);

const BUILTINS = new Set(['cy', 'expect', 'assert', 'Cypress', 'chai']);

/**
 * Applies lightweight syntax highlighting to a JavaScript/Cypress code string by
 * wrapping tokens in `<span>` elements with CSS classes:
 * - `sh-kw` — language keywords (`describe`, `it`, `const`, `await`, etc.)
 * - `sh-bi` — Cypress/Chai builtins (`cy`, `expect`, `Cypress`, `chai`)
 * - `sh-str` — string literals (single-quoted, double-quoted, template)
 * - `sh-num` — numeric literals
 * - `sh-cmt` — single-line `//` comments
 *
 * All token text is HTML-escaped before wrapping, so the output is safe to set as
 * `innerHTML`.
 *
 * @param code - The raw JavaScript/Cypress source code to highlight.
 * @returns An HTML string with syntax-highlighting spans applied, line by line.
 */
export function syntaxHighlight(code: string): string {
  return code.split('\n').map(highlightLine).join('\n');
}

function highlightLine(line: string): string {
  let result = '';
  let i = 0;
  const len = line.length;

  while (i < len) {
    // Single-line comment
    if (line[i] === '/' && i + 1 < len && line[i + 1] === '/') {
      result += `<span class="sh-cmt">${escHtml(line.slice(i))}</span>`;
      return result;
    }
    // String literal (single, double, or template)
    const q = line[i];
    if (q === "'" || q === '"' || q === '`') {
      let j = i + 1;
      while (j < len) {
        if (line[j] === '\\') { j += 2; continue; }
        if (line[j] === q) { j++; break; }
        j++;
      }
      result += `<span class="sh-str">${escHtml(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    // Number (not preceded by identifier character)
    if (/[0-9]/.test(line[i]) && (i === 0 || !/[a-zA-Z_$]/.test(line[i - 1]))) {
      let j = i;
      while (j < len && /[0-9.]/.test(line[j])) j++;
      result += `<span class="sh-num">${escHtml(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    // Identifier, keyword, or builtin
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i;
      while (j < len && /[a-zA-Z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      if (KEYWORDS.has(word)) {
        result += `<span class="sh-kw">${escHtml(word)}</span>`;
      } else if (BUILTINS.has(word)) {
        result += `<span class="sh-bi">${escHtml(word)}</span>`;
      } else {
        result += escHtml(word);
      }
      i = j;
      continue;
    }
    result += escHtml(line[i]);
    i++;
  }
  return result;
}
