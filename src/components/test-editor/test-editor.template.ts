import { escHtml, escAttr } from '../../utils/html.utils';
import { syntaxHighlight } from '../../utils/syntax-highlight.utils';
import { normalizeBlock } from '../../utils/code-format.utils';
import type { TestWithDetails } from '../../services/persistence.service';

export interface TestEditorState {
  tags: string[];
  visible: TestWithDetails[];
  selectedVisible: TestWithDetails[];
  activeTag: string | null;
  selectMode: boolean;
  selectedIds: Set<number>;
  describeName: string;
  expandedIndex: number | null;
  interceptorsByTest: Record<number, string[]>;
}

export function renderTestEditor(state: TestEditorState, t: (key: string) => string): string {
  const { tags, visible, selectedVisible, activeTag, selectMode, selectedIds, describeName, expandedIndex, interceptorsByTest } = state;

  const tagFilterHtml = tags.length
    ? `<div class="tag-filter">
        ${tags.map((tag) => `<button class="tag-chip${activeTag === tag ? ' active' : ''}" data-filter-tag="${escAttr(tag)}">${escHtml(tag)}</button>`).join('')}
       </div>`
    : `<div class="tag-filter" style="color:#484f58;font-size:11px">${t('TEST_EDITOR.NO_TAGS')}</div>`;

  const describeBarHtml = selectMode && selectedVisible.length > 0
    ? `<div class="describe-bar">
        <span class="selected-count">${selectedVisible.length} ${selectedVisible.length !== 1 ? t('TEST_EDITOR.SELECTED_PLURAL') : t('TEST_EDITOR.SELECTED_SINGULAR')}</span>
        <input id="describe-name" type="text" placeholder="${t('TEST_EDITOR.DESCRIBE_PLACEHOLDER')}" value="${escAttr(describeName)}" />
        <button class="btn-gen-describe" id="btn-gen-describe">${t('TEST_EDITOR.COPY_DESCRIBE')}</button>
      </div>`
    : '';

  const rows = visible.map((test, i) => {
    const expanded = expandedIndex === i;
    const date = new Date(test.createdAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    const icps = interceptorsByTest[test.id] ?? test.interceptors ?? [];
    const tagsHtml = (test.tags ?? []).length
      ? `<span class="test-tags">${(test.tags ?? []).map((tag) => `<span class="test-tag">${escHtml(tag)}</span>`).join('')}</span>`
      : '';
    const checkbox = selectMode
      ? `<input type="checkbox" ${selectedIds.has(test.id) ? 'checked' : ''} data-select="${test.id}" />`
      : '';
    const hasIcps = (test.interceptors ?? []).length > 0;
    const itBlockCode = `it('${test.name}', () => {\n${(test.commands ?? []).map(c => normalizeBlock(c, '  ')).join('\n')}\n});`;
    const icpBlockCode = icps.length ? `beforeEach(() => {\n  // Auto-generated Cypress interceptors\n${icps.map(c => normalizeBlock(c, '  ')).join('\n')}\n});` : '';
    const notesHtml = (expanded && test.notes)
      ? `<p class="test-notes">${escHtml(test.notes)}</p>`
      : '';
    const body = expanded ? `
      <div class="row-body">
        ${notesHtml}
        <pre class="code-preview">${syntaxHighlight(itBlockCode)}</pre>
        ${icpBlockCode ? `<pre class="code-preview code-preview-icp">${syntaxHighlight(icpBlockCode)}</pre>` : ''}
      </div>` : '';
    return `
      <div class="row${selectedIds.has(test.id) ? ' selected-row' : ''}">
        <div class="row-header" data-action="expand" data-idx="${i}">
          ${checkbox}
          <span class="test-name">${escHtml(test.name)}</span>
          ${tagsHtml}
          <span class="test-date">${date}</span>
          <button class="btn-icon" data-action="copy-cmds" data-idx="${i}" title="${t('TEST_EDITOR.COPY_CMDS_BTN')}">${t('TEST_EDITOR.COPY_CMDS_BTN')}</button>
          ${hasIcps ? `<button class="btn-icon" data-action="copy-icps" data-idx="${i}" title="${t('TEST_EDITOR.COPY_ICPS_BTN')}">${t('TEST_EDITOR.COPY_ICPS_BTN')}</button>` : ''}
          <button class="btn-icon btn-del" data-action="delete" data-id="${test.id}" title="${t('TEST_EDITOR.DELETE_TITLE')}">🗑</button>
        </div>
        ${body}
      </div>`;
  }).join('');

  return `
    <div class="toolbar">
      ${tagFilterHtml}
      <button class="btn-select${selectMode ? ' active' : ''}" id="btn-select-mode">
        ${selectMode ? t('TEST_EDITOR.CANCEL_SELECT') : t('TEST_EDITOR.MULTI_SELECT')}
      </button>
    </div>
    ${describeBarHtml}
    <div class="list">
      ${visible.length ? rows : `<div class="empty">${t('TEST_EDITOR.NO_TESTS')}</div>`}
    </div>`;
}
