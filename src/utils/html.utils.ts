/**
 * Escapes `&`, `<`, and `>` so a string is safe to embed as text content inside
 * an HTML document.
 *
 * @param s - The raw string to escape.
 * @returns The HTML-escaped string.
 */
export function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Escapes `"` and `<` so a string is safe to embed inside a double-quoted HTML
 * attribute value (e.g. `data-cy="…"`).
 *
 * @param s - The raw string to escape.
 * @returns The attribute-safe escaped string.
 */
export function escAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
