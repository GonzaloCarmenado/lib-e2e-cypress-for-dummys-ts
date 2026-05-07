import { getSelectorQuality, buildPickerSelector, type SelectorQuality } from '../../utils/selector-quality.utils';
import { escHtml } from '../../utils/html.utils';

const QUALITY_EMOJI: Record<SelectorQuality, string> = {
  excellent:  '🟢',
  good:       '🔵',
  acceptable: '🟡',
  poor:       '🔴',
};

const QUALITY_CLASS: Record<SelectorQuality, string> = {
  excellent:  'badge-excellent',
  good:       'badge-good',
  acceptable: 'badge-acceptable',
  poor:       'badge-poor',
};

function keyAttrDisplay(el: HTMLElement): string {
  for (const attr of ['data-cy', 'data-testid', 'aria-label']) {
    const v = el.getAttribute(attr);
    if (v) return `${attr}="${escHtml(v)}"`;
  }
  if (el.id) return `id="${escHtml(el.id)}"`;
  if (el.className && el.className.trim()) return escHtml(el.className.trim().split(/\s+/).map((c) => `.${c}`).join(''));
  return '';
}

export function renderPickerRows(
  ancestors: HTMLElement[],
  selectedIndex: number,
  t: (key: string) => string,
): string {
  return ancestors.map((el, i) => {
    const quality = getSelectorQuality(el);
    const selector = buildPickerSelector(el);
    const tag = el.tagName.toLowerCase();
    const attr = keyAttrDisplay(el);
    const isSelected = i === selectedIndex;
    const isPoor = quality === 'poor';

    return `
      <div class="row${isSelected ? ' selected' : ''}" data-idx="${i}" role="option" aria-selected="${isSelected}">
        <span class="quality-badge ${QUALITY_CLASS[quality]}" title="${escHtml(t(`SELECTOR_PICKER.QUALITY_${quality.toUpperCase()}`))}">
          ${QUALITY_EMOJI[quality]}
        </span>
        <span class="tag-name">&lt;${escHtml(tag)}&gt;</span>
        ${attr ? `<span class="attr-value">${attr}</span>` : '<span class="attr-value"></span>'}
        <span class="selector-preview">${escHtml(selector)}</span>
        ${isPoor ? `<span class="poor-warning" title="${escHtml(t('SELECTOR_PICKER.QUALITY_POOR'))}">⚠</span>` : ''}
      </div>`;
  }).join('');
}

export function renderPicker(
  ancestors: HTMLElement[],
  selectedIndex: number,
  t: (key: string) => string,
): string {
  return `
    <div class="overlay" role="listbox">
      <div class="header">${escHtml(t('SELECTOR_PICKER.TITLE'))}</div>
      <div class="list">
        ${renderPickerRows(ancestors, selectedIndex, t)}
      </div>
      <div class="footer">
        <span class="hint"><kbd>↑↓</kbd> ${escHtml(t('SELECTOR_PICKER.PREVIEW_LABEL'))}</span>
        <span class="hint"><kbd>Enter</kbd> ${escHtml(t('SELECTOR_PICKER.CONFIRM_HINT'))}</span>
        <span class="hint"><kbd>Esc</kbd> ${escHtml(t('SELECTOR_PICKER.CANCEL_HINT'))}</span>
      </div>
    </div>`;
}
