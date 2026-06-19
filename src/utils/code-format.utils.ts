function gcd(a: number, b: number): number {
  while (b) { const t = b; b = a % b; a = t; }
  return a;
}

/**
 * Escapes backslashes and single quotes so a value can be safely embedded inside
 * a single-quoted JavaScript string literal — e.g. an `it('…')` / `describe('…')`
 * name. Without this, a test named `User's login` produces broken generated JS.
 */
export function escapeSingleQuotes(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Normalizes indentation in a code block and prefixes every line with baseIndent.
 *
 * Algorithm:
 *  1. Strip trailing whitespace from each line.
 *  2. Find the minimum leading-whitespace count of non-empty lines (dedent).
 *  3. Compute the indent step as the GCD of all non-zero relative indent values,
 *     so the original indent unit (4-space, 8-space, etc.) maps to 2-space levels.
 *  4. Re-emit each line as: baseIndent + '  '.repeat(level) + trimmedContent.
 *
 * This handles multi-line interceptor/command blocks that were stored with
 * inconsistent or file-origin indentation.
 */
export function normalizeBlock(code: string, baseIndent: string): string {
  const lines = code.split('\n').map(l => l.trimEnd());
  const nonEmpty = lines.filter(l => l.trim().length > 0);
  if (!nonEmpty.length) return '';

  const indents = nonEmpty.map(l => l.length - l.trimStart().length);
  const minIndent = Math.min(...indents);
  const relIndents = [...new Set(indents.map(n => n - minIndent).filter(n => n > 0))];
  const step = relIndents.length > 0 ? relIndents.reduce(gcd) : 2;

  return lines
    .map(l => {
      if (!l.trim()) return '';
      const level = Math.round((l.length - l.trimStart().length - minIndent) / step);
      return baseIndent + '  '.repeat(level) + l.trimStart();
    })
    .join('\n');
}
