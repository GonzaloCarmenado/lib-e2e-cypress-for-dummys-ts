import type { PickerRow, SelectorQuality } from '../../utils/selector-quality.utils';
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

export function renderPickerRows(
  rows: PickerRow[],
  selectedIndex: number,
  t: (key: string) => string,
): string {
  return rows.map((row, i) => {
    const isSelected = i === selectedIndex;
    const isPoor = row.quality === 'poor';

    return `
      <div class="row${isSelected ? ' selected' : ''}" data-idx="${i}" role="option" aria-selected="${isSelected}">
        <span class="quality-badge ${QUALITY_CLASS[row.quality]}" title="${escHtml(t(`SELECTOR_PICKER.QUALITY_${row.quality.toUpperCase()}`))}">
          ${QUALITY_EMOJI[row.quality]}
        </span>
        <span class="tag-name">&lt;${escHtml(row.tag)}&gt;</span>
        ${row.attr ? `<span class="attr-value">${escHtml(row.attr)}</span>` : '<span class="attr-value"></span>'}
        <span class="selector-preview">${escHtml(row.selector)}</span>
        ${isPoor ? `<span class="poor-warning" title="${escHtml(t('SELECTOR_PICKER.QUALITY_POOR'))}">⚠</span>` : ''}
      </div>`;
  }).join('');
}

export function renderPicker(
  rows: PickerRow[],
  selectedIndex: number,
  t: (key: string) => string,
): string {
  return `
    <div class="overlay" role="listbox">
      <div class="header">${escHtml(t('SELECTOR_PICKER.TITLE'))}</div>
      <div class="list">
        ${renderPickerRows(rows, selectedIndex, t)}
      </div>
      <div class="footer">
        <span class="hint"><kbd>↑↓</kbd> ${escHtml(t('SELECTOR_PICKER.PREVIEW_LABEL'))}</span>
        <span class="hint"><kbd>Enter</kbd> ${escHtml(t('SELECTOR_PICKER.CONFIRM_HINT'))}</span>
        <span class="hint"><kbd>Esc</kbd> ${escHtml(t('SELECTOR_PICKER.CANCEL_HINT'))}</span>
      </div>
    </div>`;
}
