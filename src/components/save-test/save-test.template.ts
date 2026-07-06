import { escHtml, escAttr } from '../../utils/html.utils';

export function renderSaveTestAsk(t: (key: string) => string): string {
  return `
    <div class="container">
      <p>${t('SAVE_TEST.ASK')}</p>
      <div class="btn-row">
        <button class="btn-primary" id="btn-yes">${t('SAVE_TEST.YES_CONTINUE')}</button>
        <button class="btn-danger"  id="btn-no">${t('SAVE_TEST.NO_DISCARD')}</button>
      </div>
    </div>`;
}

export function renderSaveTestDesc(description: string, notes: string, tags: string[], ticketId: string, issueTrackerEnabled: boolean, ticketWarn: boolean, t: (key: string) => string): string {
  const chipsHtml = tags.map((tag) =>
    `<span class="chip">${escHtml(tag)}<button class="chip-del" data-tag="${escAttr(tag)}" title="${t('SAVE_TEST.REMOVE_TAG_TITLE')}">✕</button></span>`
  ).join('');

  const ticketHtml = issueTrackerEnabled ? `
      <span class="tag-label">${t('SAVE_TEST.TICKET_LABEL')}</span>
      <input id="ticket-input" type="text" placeholder="${escAttr(t('SAVE_TEST.TICKET_PLACEHOLDER'))}"
             value="${escAttr(ticketId)}" autocomplete="off" />
      ${ticketWarn ? `<span class="ticket-warn">⚠ ${t('SAVE_TEST.TICKET_WARN')}</span>` : ''}` : '';

  return `
    <div class="container">
      <p>${t('SAVE_TEST.DESC_LABEL')} (<code>it()</code>):</p>
      <input id="desc-input" type="text" placeholder="${t('SAVE_TEST.DESC_PLACEHOLDER')}"
             value="${escAttr(description)}" autocomplete="off" />
      <span class="tag-label">${t('SAVE_TEST.NOTES_LABEL')}</span>
      <textarea id="notes-input" rows="3" placeholder="${escAttr(t('SAVE_TEST.NOTES_PLACEHOLDER'))}">${escHtml(notes)}</textarea>
      <span class="tag-label">${t('SAVE_TEST.TAGS_LABEL')}</span>
      <div class="tag-input-row">
        <input id="tag-input" type="text" placeholder="${t('SAVE_TEST.TAGS_PLACEHOLDER')}" autocomplete="off" />
        <button class="btn-tag-add" id="btn-add-tag">${t('SAVE_TEST.ADD_TAG')}</button>
      </div>
      <div class="chips" id="chips-container">${chipsHtml || `<span style="color:#484f58;font-size:11px">${t('SAVE_TEST.NO_TAGS')}</span>`}</div>
      ${ticketHtml}
      <div class="btn-row">
        <button class="btn-primary" id="btn-confirm">${t('SAVE_TEST.SAVE_BTN')}</button>
        <button class="btn-success" id="btn-export">${t('SAVE_TEST.SAVE_AND_EDIT')}</button>
        <button class="btn-danger"  id="btn-cancel">${t('SAVE_TEST.CANCEL')}</button>
      </div>
    </div>`;
}
