import { escHtml, escAttr } from '../../utils/html.utils';
import { syntaxHighlight } from '../../utils/syntax-highlight.utils';
import { normalizeBlock, escapeSingleQuotes } from '../../utils/code-format.utils';
import { buildTicketUrl } from '../../utils/ticket.utils';
import type { TestWithDetails } from '../../services/persistence.service';
import type { IssueTrackerConfig } from '../../models/issue-tracker.model';

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
  locale: string;
  groupByTicket: boolean;
  issueTrackerConfig: IssueTrackerConfig;
}

function renderTestRow(test: TestWithDetails, i: number, state: TestEditorState, t: (key: string) => string): string {
  const { selectMode, selectedIds, expandedIndex, interceptorsByTest, locale, issueTrackerConfig } = state;
  const expanded = expandedIndex === i;
  const date = new Date(test.createdAt).toLocaleString(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const icps = interceptorsByTest[test.id] ?? test.interceptors ?? [];
  const tagsHtml = (test.tags ?? []).length
    ? `<span class="test-tags">${(test.tags ?? []).map((tag) => `<span class="test-tag">${escHtml(tag)}</span>`).join('')}</span>`
    : '';
  const checkbox = selectMode
    ? `<input type="checkbox" ${selectedIds.has(test.id) ? 'checked' : ''} data-select="${test.id}" />`
    : '';
  const hasIcps = (test.interceptors ?? []).length > 0;
  const itBlockCode = `it('${escapeSingleQuotes(test.name)}', () => {\n${(test.commands ?? []).map(c => normalizeBlock(c, '  ')).join('\n')}\n});`;
  const icpBlockCode = icps.length ? `beforeEach(() => {\n  // Auto-generated Cypress interceptors\n${icps.map(c => normalizeBlock(c, '  ')).join('\n')}\n});` : '';
  const notesHtml = (expanded && test.notes)
    ? `<p class="test-notes">${escHtml(test.notes)}</p>`
    : '';

  const ticketId = (test as TestWithDetails & { ticketId?: string }).ticketId;
  const ticketUrl = ticketId ? buildTicketUrl(ticketId, issueTrackerConfig) : null;
  const ticketHtml = ticketId
    ? ticketUrl
      ? `<a class="ticket-link" href="${escAttr(ticketUrl)}" target="_blank" rel="noopener noreferrer" title="${t('TEST_EDITOR.TICKET_LINK_TITLE')}">${escHtml(ticketId)}</a>`
      : `<span class="ticket-badge">${escHtml(ticketId)}</span>`
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
        ${ticketHtml}
        <span class="test-date">${date}</span>
        <button class="btn-icon" data-action="copy-cmds" data-idx="${i}" title="${t('TEST_EDITOR.COPY_CMDS_BTN')}">${t('TEST_EDITOR.COPY_CMDS_BTN')}</button>
        ${hasIcps ? `<button class="btn-icon" data-action="copy-icps" data-idx="${i}" title="${t('TEST_EDITOR.COPY_ICPS_BTN')}">${t('TEST_EDITOR.COPY_ICPS_BTN')}</button>` : ''}
        <button class="btn-icon btn-del" data-action="delete" data-id="${test.id}" title="${t('TEST_EDITOR.DELETE_TITLE')}">🗑</button>
      </div>
      ${body}
    </div>`;
}

export function renderTestEditor(state: TestEditorState, t: (key: string) => string): string {
  const { tags, visible, selectedVisible, activeTag, selectMode, describeName, groupByTicket } = state;

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

  let rows: string;
  if (groupByTicket) {
    const groups = new Map<string, TestWithDetails[]>();
    for (const test of visible) {
      const key = (test as TestWithDetails & { ticketId?: string }).ticketId?.trim() || '';
      const group = groups.get(key) ?? [];
      group.push(test);
      groups.set(key, group);
    }
    const sortedKeys = [...groups.keys()].sort((a, b) =>
      a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)
    );
    rows = sortedKeys.map((key) => {
      const group = groups.get(key) as TestWithDetails[];
      const header = `<div class="ticket-group-header">${key ? escHtml(key) : t('TEST_EDITOR.NO_TICKET')}</div>`;
      const groupRows = group.map((test) => {
        const i = visible.indexOf(test);
        return renderTestRow(test, i, state, t);
      }).join('');
      return `<div class="ticket-group">${header}${groupRows}</div>`;
    }).join('');
  } else {
    rows = visible.map((test, i) => renderTestRow(test, i, state, t)).join('');
  }

  return `
    <div class="toolbar">
      ${tagFilterHtml}
      <button class="btn-select${groupByTicket ? ' active' : ''}" id="btn-group-ticket">
        ${groupByTicket ? t('TEST_EDITOR.UNGROUP_TICKET') : t('TEST_EDITOR.GROUP_BY_TICKET')}
      </button>
      <button class="btn-select${selectMode ? ' active' : ''}" id="btn-select-mode">
        ${selectMode ? t('TEST_EDITOR.CANCEL_SELECT') : t('TEST_EDITOR.MULTI_SELECT')}
      </button>
    </div>
    ${describeBarHtml}
    <div class="list">
      ${visible.length ? rows : `<div class="empty">${t('TEST_EDITOR.NO_TESTS')}</div>`}
    </div>`;
}
