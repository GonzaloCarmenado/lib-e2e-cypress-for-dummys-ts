import { escapeCssAttrValue } from './code-format.utils';

export type SelectorQuality = 'excellent' | 'good' | 'acceptable' | 'poor';

export const FORBIDDEN_ID_PREFIXES = [
  'cdk-', 'mat-', 'p-', 'ng-', 'mdc-',
  'primeng-', 'auto-', 'field-', 'input-', 'select-',
];

export function getSelectorQuality(el: HTMLElement): SelectorQuality {
  if (
    el.hasAttribute('data-cy') ||
    el.hasAttribute('data-testid') ||
    el.hasAttribute('aria-label')
  ) {
    return 'excellent';
  }

  const rawId = el.id;
  if (
    rawId &&
    rawId.length < 25 &&
    /^[a-zA-Z][\w-]*$/.test(rawId) &&
    !FORBIDDEN_ID_PREFIXES.some((p) => rawId.startsWith(p)) &&
    !/^\d+$/.test(rawId)
  ) {
    return 'good';
  }

  if (typeof el.className === 'string' && el.className.trim().length > 0) {
    return 'acceptable';
  }

  return 'poor';
}

/** Returns the best cy.get() selector string for a given element. */
export function buildPickerSelector(el: HTMLElement): string {
  const dataCy = el.getAttribute('data-cy');
  if (dataCy) return `[data-cy="${escapeCssAttrValue(dataCy)}"]`;

  const dataTestid = el.getAttribute('data-testid');
  if (dataTestid) return `[data-testid="${escapeCssAttrValue(dataTestid)}"]`;

  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) return `[aria-label="${escapeCssAttrValue(ariaLabel)}"]`;

  const rawId = el.id;
  if (
    rawId &&
    rawId.length < 25 &&
    /^[a-zA-Z][\w-]*$/.test(rawId) &&
    !FORBIDDEN_ID_PREFIXES.some((p) => rawId.startsWith(p)) &&
    !/^\d+$/.test(rawId)
  ) {
    return `#${rawId}`;
  }

  if (typeof el.className === 'string' && el.className.trim().length > 0) {
    const classes = el.className.trim().split(/\s+/);
    return classes.map((c) => `.${c}`).join('');
  }

  return el.tagName.toLowerCase();
}

/** Human-readable key attribute/selector preview for a picker row (raw, unescaped). */
export function keyAttrDisplay(el: HTMLElement): string {
  for (const attr of ['data-cy', 'data-testid', 'aria-label']) {
    const v = el.getAttribute(attr);
    if (v) return `${attr}="${v}"`;
  }
  if (el.id) return `id="${el.id}"`;
  if (el.className && el.className.trim()) {
    return el.className.trim().split(/\s+/).map((c) => `.${c}`).join('');
  }
  return '';
}

/** Plain, serializable view-model for one picker row — no DOM held. */
export interface PickerRow {
  quality: SelectorQuality;
  selector: string;
  tag: string;
  attr: string;
}

/** Reads an element once and returns the plain data a picker row needs to render. */
export function describePickerRow(el: HTMLElement): PickerRow {
  return {
    quality: getSelectorQuality(el),
    selector: buildPickerSelector(el),
    tag: el.tagName.toLowerCase(),
    attr: keyAttrDisplay(el),
  };
}
