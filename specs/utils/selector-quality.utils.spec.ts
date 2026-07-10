import { describe, it, expect } from 'vitest';
import { getSelectorQuality, buildPickerSelector, keyAttrDisplay, describePickerRow } from '../../src/utils/selector-quality.utils';

function el(tag: string, attrs: Record<string, string> = {}, cls = ''): HTMLElement {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (cls) e.className = cls;
  return e;
}

describe('selector-quality.utils', () => {
  // ── getSelectorQuality ─────────────────────────────────────────────────────

  describe('getSelectorQuality', () => {
    it('returns excellent for data-cy', () => {
      expect(getSelectorQuality(el('div', { 'data-cy': 'btn' }))).toBe('excellent');
    });

    it('returns excellent for data-testid', () => {
      expect(getSelectorQuality(el('div', { 'data-testid': 'btn' }))).toBe('excellent');
    });

    it('returns excellent for aria-label', () => {
      expect(getSelectorQuality(el('button', { 'aria-label': 'Close' }))).toBe('excellent');
    });

    it('excellent takes priority over id', () => {
      const e = el('div', { 'data-cy': 'btn' });
      e.id = 'myId';
      expect(getSelectorQuality(e)).toBe('excellent');
    });

    it('returns good for a clean id', () => {
      const e = el('div');
      e.id = 'submit-btn';
      expect(getSelectorQuality(e)).toBe('good');
    });

    it('returns good when id is exactly 24 chars', () => {
      const e = el('div');
      e.id = 'a'.repeat(24);
      expect(getSelectorQuality(e)).toBe('good');
    });

    it('not good when id is 25+ chars', () => {
      const e = el('div');
      e.id = 'a'.repeat(25);
      // falls through to class check → poor (no class)
      expect(getSelectorQuality(e)).not.toBe('good');
    });

    it('not good for forbidden prefix mat-', () => {
      const e = el('div');
      e.id = 'mat-select-0';
      expect(getSelectorQuality(e)).not.toBe('good');
    });

    it('not good for forbidden prefix cdk-', () => {
      const e = el('div');
      e.id = 'cdk-overlay-0';
      expect(getSelectorQuality(e)).not.toBe('good');
    });

    it('not good for all-digit id', () => {
      const e = el('div');
      e.id = '12345';
      expect(getSelectorQuality(e)).not.toBe('good');
    });

    it('not good for id starting with digit', () => {
      const e = el('div');
      e.id = '1abc';
      expect(getSelectorQuality(e)).not.toBe('good');
    });

    it('returns acceptable for element with class', () => {
      expect(getSelectorQuality(el('div', {}, 'my-class'))).toBe('acceptable');
    });

    it('returns acceptable for multiple classes', () => {
      expect(getSelectorQuality(el('div', {}, 'btn btn-primary'))).toBe('acceptable');
    });

    it('good takes priority over class', () => {
      const e = el('div', {}, 'my-class');
      e.id = 'cleanId';
      expect(getSelectorQuality(e)).toBe('good');
    });

    it('returns poor for plain element (only tag)', () => {
      expect(getSelectorQuality(el('span'))).toBe('poor');
    });

    it('returns poor when class is only whitespace', () => {
      expect(getSelectorQuality(el('div', {}, '   '))).toBe('poor');
    });
  });

  // ── buildPickerSelector ────────────────────────────────────────────────────

  describe('buildPickerSelector', () => {
    it('returns data-cy selector for excellent (data-cy)', () => {
      expect(buildPickerSelector(el('div', { 'data-cy': 'my-btn' }))).toBe('[data-cy="my-btn"]');
    });

    it('returns data-testid selector for excellent (data-testid)', () => {
      expect(buildPickerSelector(el('div', { 'data-testid': 'x' }))).toBe('[data-testid="x"]');
    });

    it('returns aria-label selector for excellent (aria-label)', () => {
      expect(buildPickerSelector(el('button', { 'aria-label': 'Close' }))).toBe('[aria-label="Close"]');
    });

    it('prefers data-cy over data-testid when both present', () => {
      expect(buildPickerSelector(el('div', { 'data-cy': 'a', 'data-testid': 'b' }))).toBe('[data-cy="a"]');
    });

    it('returns #id selector for good id', () => {
      const e = el('div');
      e.id = 'myId';
      expect(buildPickerSelector(e)).toBe('#myId');
    });

    it('returns first class selector for acceptable', () => {
      const result = buildPickerSelector(el('div', {}, 'btn primary'));
      expect(result).toMatch(/\.btn/);
    });

    it('returns tag selector for poor element', () => {
      expect(buildPickerSelector(el('span'))).toBe('span');
    });

    describe('AC-01 — CSS attribute value escaping', () => {
      it('escapes double quotes in data-cy value', () => {
        expect(buildPickerSelector(el('div', { 'data-cy': 'say "hello"' }))).toBe('[data-cy="say \\"hello\\""]');
      });

      it('escapes double quotes in data-testid value', () => {
        expect(buildPickerSelector(el('div', { 'data-testid': '10" monitor' }))).toBe('[data-testid="10\\" monitor"]');
      });

      it('escapes double quotes in aria-label value', () => {
        expect(buildPickerSelector(el('button', { 'aria-label': '10" screen' }))).toBe('[aria-label="10\\" screen"]');
      });
    });
  });

  // ── keyAttrDisplay ─────────────────────────────────────────────────────────

  describe('keyAttrDisplay', () => {
    it('prefers data-cy and shows it as attr="value"', () => {
      expect(keyAttrDisplay(el('div', { 'data-cy': 'btn' }))).toBe('data-cy="btn"');
    });

    it('falls back to data-testid then aria-label', () => {
      expect(keyAttrDisplay(el('div', { 'data-testid': 'x' }))).toBe('data-testid="x"');
      expect(keyAttrDisplay(el('div', { 'aria-label': 'Close' }))).toBe('aria-label="Close"');
    });

    it('shows the id when there is no test attribute', () => {
      const e = el('div');
      e.id = 'myId';
      expect(keyAttrDisplay(e)).toBe('id="myId"');
    });

    it('shows a dotted class list when only classes are present', () => {
      expect(keyAttrDisplay(el('div', {}, 'btn primary'))).toBe('.btn.primary');
    });

    it('returns empty string for a plain element', () => {
      expect(keyAttrDisplay(el('span'))).toBe('');
    });
  });

  // ── describePickerRow ──────────────────────────────────────────────────────

  describe('describePickerRow', () => {
    it('builds a plain row view-model holding no DOM reference', () => {
      const row = describePickerRow(el('button', { 'data-cy': 'submit' }));
      expect(row).toEqual({
        quality: 'excellent',
        selector: '[data-cy="submit"]',
        tag: 'button',
        attr: 'data-cy="submit"',
      });
    });

    it('lowercases the tag name', () => {
      expect(describePickerRow(el('SECTION')).tag).toBe('section');
    });
  });
});
