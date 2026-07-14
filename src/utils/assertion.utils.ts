import { escapeSingleQuotes } from './code-format.utils';

/** Longest visible-text snippet turned into a `contain.text` assertion. */
const MAX_TEXT_LENGTH = 60;

/**
 * Infers a sensible Cypress assertion for an element, given the selector already
 * resolved for it (spec 009 — Alt+click assertion capture):
 *
 *  - checkbox / radio      → should('be.checked' | 'not.be.checked')
 *  - input/textarea/select → should('have.value', '<value>')  (or be.visible if empty)
 *  - short visible text    → should('contain.text', '<text>')
 *  - otherwise             → should('be.visible')
 *
 * All embedded values/text are single-quote escaped so the generated command is
 * always valid JS.
 */
export function inferAssertionCommand(el: HTMLElement, selector: string): string {
  const safeSelector = escapeSingleQuotes(selector);
  const should = (body: string): string => `cy.get('${safeSelector}').should(${body})`;
  const tag = el.tagName.toLowerCase();

  if (tag === 'input') {
    const input = el as HTMLInputElement;
    const type = (input.getAttribute('type') ?? 'text').toLowerCase();
    if (type === 'checkbox' || type === 'radio') {
      return should(`'${input.checked ? 'be.checked' : 'not.be.checked'}'`);
    }
    return input.value
      ? should(`'have.value', '${escapeSingleQuotes(input.value)}'`)
      : should(`'be.visible'`);
  }

  if (tag === 'textarea' || tag === 'select') {
    const value = (el as HTMLTextAreaElement | HTMLSelectElement).value;
    return value
      ? should(`'have.value', '${escapeSingleQuotes(value)}'`)
      : should(`'be.visible'`);
  }

  const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  if (text && text.length <= MAX_TEXT_LENGTH) {
    return should(`'contain.text', '${escapeSingleQuotes(text)}'`);
  }
  return should(`'be.visible'`);
}
