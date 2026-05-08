import { escHtml } from '../../utils/html.utils';

export function renderTestPrevisualizer(
  commands: string[],
  interceptors: string[],
  showInterceptors: boolean,
  editable: boolean,
  t: (key: string) => string,
): string {
  const editControls = (idx: number, total: number) => editable ? `
    <span class="item-actions">
      <button class="btn-step" data-move-up="${idx}" title="${t('TEST_PREVISUALIZER.UP_TITLE')}" ${idx === 0 ? 'disabled style="opacity:.3"' : ''}>↑</button>
      <button class="btn-step" data-move-dn="${idx}" title="${t('TEST_PREVISUALIZER.DOWN_TITLE')}" ${idx === total - 1 ? 'disabled style="opacity:.3"' : ''}>↓</button>
      <button class="btn-step btn-step-del" data-del="${idx}" title="${t('TEST_PREVISUALIZER.DEL_TITLE')}">✕</button>
    </span>` : '';

  const cmdItems = commands.length
    ? commands.map((c, i) => `
        <div class="item">
          <span class="cmd-text">${escHtml(c)}</span>
          ${editControls(i, commands.length)}
        </div>`).join('')
    : `<div class="empty">${t('TEST_PREVISUALIZER.NO_CMDS_YET')}</div>`;

  const icpEditControls = (idx: number) => editable
    ? `<span class="item-actions"><button class="btn-step btn-step-del" data-del-icp="${idx}" title="${t('TEST_PREVISUALIZER.DEL_TITLE')}">✕</button></span>`
    : '';

  const icpSection = showInterceptors
    ? `<div class="section" data-section="interceptors">
        <div class="section-title">${t('TEST_PREVISUALIZER.INTERCEPTORS')}</div>
        <div class="list">
          ${
            interceptors.length
              ? interceptors.map((ic, idx) => `
                  <div class="item">
                    <span class="cmd-text">${escHtml(ic)}</span>
                    ${icpEditControls(idx)}
                  </div>`).join('')
              : `<div class="empty">${t('TEST_PREVISUALIZER.NO_ICP_SHORT')}</div>`
          }
        </div>
        <button style="margin-top:6px" data-action="copy-icp">${t('TEST_PREVISUALIZER.COPY_ICP_BTN')}</button>
      </div>`
    : '';

  return `
    <div class="toolbar">
      <button data-action="copy">${t('TEST_PREVISUALIZER.COPY_CMDS_BTN')}</button>
      <button data-action="toggle-icp" class="${showInterceptors ? 'active' : ''}">
        ${showInterceptors ? t('TEST_PREVISUALIZER.HIDE_INTERCEPTORS') : t('TEST_PREVISUALIZER.SHOW_INTERCEPTORS')} (${interceptors.length})
      </button>
    </div>
    <div class="section section-cmds">
      <div class="section-title">${t('TEST_PREVISUALIZER.SECTION_COMMANDS')} (${commands.length})</div>
      <div class="list" data-ref="cmds">${cmdItems}</div>
    </div>
    ${icpSection}`;
}
