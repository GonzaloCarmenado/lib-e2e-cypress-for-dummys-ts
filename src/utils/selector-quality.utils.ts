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
  if (dataCy) return `[data-cy="${dataCy}"]`;

  const dataTestid = el.getAttribute('data-testid');
  if (dataTestid) return `[data-testid="${dataTestid}"]`;

  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) return `[aria-label="${ariaLabel}"]`;

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
