import { describe, it, expect } from 'vitest';
import { inferAssertionCommand } from '../../src/utils/assertion.utils';

function make(tag: string, opts: { text?: string; value?: string; type?: string; checked?: boolean } = {}): HTMLElement {
  const el = document.createElement(tag);
  if (opts.type) el.setAttribute('type', opts.type);
  if (opts.text !== undefined) el.textContent = opts.text;
  if (opts.value !== undefined) (el as HTMLInputElement).value = opts.value;
  if (opts.checked !== undefined) (el as HTMLInputElement).checked = opts.checked;
  return el;
}

describe('inferAssertionCommand (spec 009)', () => {
  const SEL = '[data-cy="x"]';

  it('checkbox checked → be.checked', () => {
    const el = make('input', { type: 'checkbox', checked: true });
    expect(inferAssertionCommand(el, SEL)).toBe(`cy.get('${SEL}').should('be.checked')`);
  });

  it('checkbox unchecked → not.be.checked', () => {
    const el = make('input', { type: 'checkbox', checked: false });
    expect(inferAssertionCommand(el, SEL)).toBe(`cy.get('${SEL}').should('not.be.checked')`);
  });

  it('radio checked → be.checked', () => {
    const el = make('input', { type: 'radio', checked: true });
    expect(inferAssertionCommand(el, SEL)).toContain("should('be.checked')");
  });

  it('text input with value → have.value', () => {
    const el = make('input', { type: 'text', value: 'admin' });
    expect(inferAssertionCommand(el, SEL)).toBe(`cy.get('${SEL}').should('have.value', 'admin')`);
  });

  it('text input without value → be.visible', () => {
    const el = make('input', { type: 'text', value: '' });
    expect(inferAssertionCommand(el, SEL)).toBe(`cy.get('${SEL}').should('be.visible')`);
  });

  it('input without explicit type defaults to text (have.value)', () => {
    const el = make('input', { value: 'hi' });
    expect(inferAssertionCommand(el, SEL)).toBe(`cy.get('${SEL}').should('have.value', 'hi')`);
  });

  it('textarea with value → have.value', () => {
    const el = make('textarea', { value: 'notes' });
    expect(inferAssertionCommand(el, SEL)).toBe(`cy.get('${SEL}').should('have.value', 'notes')`);
  });

  it('select with value → have.value', () => {
    const el = make('select') as HTMLSelectElement;
    const opt = document.createElement('option');
    opt.value = 'ES';
    el.appendChild(opt);
    el.value = 'ES';
    expect(inferAssertionCommand(el, SEL)).toBe(`cy.get('${SEL}').should('have.value', 'ES')`);
  });

  it('element with short visible text → contain.text (whitespace normalised)', () => {
    const el = make('button', { text: '  Guardar   cambios \n' });
    expect(inferAssertionCommand(el, SEL)).toBe(`cy.get('${SEL}').should('contain.text', 'Guardar cambios')`);
  });

  it('element with no text → be.visible', () => {
    const el = make('div');
    expect(inferAssertionCommand(el, SEL)).toBe(`cy.get('${SEL}').should('be.visible')`);
  });

  it('very long text falls back to be.visible', () => {
    const el = make('div', { text: 'x'.repeat(200) });
    expect(inferAssertionCommand(el, SEL)).toBe(`cy.get('${SEL}').should('be.visible')`);
  });

  it('escapes single quotes in a value', () => {
    const el = make('input', { type: 'text', value: "O'Brien" });
    expect(inferAssertionCommand(el, SEL)).toContain("O\\'Brien");
  });

  it('escapes single quotes in text', () => {
    const el = make('button', { text: "User's panel" });
    expect(inferAssertionCommand(el, SEL)).toContain("User\\'s panel");
  });
});
