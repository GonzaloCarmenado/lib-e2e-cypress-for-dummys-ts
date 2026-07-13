import { escapeSingleQuotes } from '../../utils/code-format.utils';

const NO_VALUE_ASSERTIONS = new Set(['be.visible', 'not.exist', 'be.disabled', 'be.checked']);

export function injectAssertionBuilder(
  container: HTMLElement,
  t: (key: string) => string,
  onAddCommand: (cmd: string) => void,
): void {
  container.insertAdjacentHTML('beforeend', `
    <div id="assertion-builder"
      style="padding:10px 12px;border-top:1px solid #21262d;background:#0d1117">
      <div style="font-size:10px;color:#484f58;text-transform:uppercase;letter-spacing:.8px;font-weight:600;margin-bottom:8px">
        ${t('RECORDER.ASSERTION_SECTION')}
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:flex-end">
        <input id="assert-selector" type="text"
          placeholder="${t('RECORDER.ASSERT_SELECTOR_PH').replace(/"/g, '&quot;')}"
          style="flex:2;min-width:140px;padding:5px 8px;background:#161b22;border:1px solid #30363d;
                 border-radius:5px;color:#c9d1d9;font-size:11px;outline:none;
                 font-family:'Cascadia Code','Fira Code',monospace"/>
        <select id="assert-type"
          style="padding:5px 8px;background:#161b22;border:1px solid #30363d;border-radius:5px;
                 color:#c9d1d9;font-size:11px;outline:none;cursor:pointer;flex-shrink:0">
          <option value="be.visible">be.visible</option>
          <option value="not.exist">not.exist</option>
          <option value="be.disabled">be.disabled</option>
          <option value="be.checked">be.checked</option>
          <option value="contain.text">contain.text</option>
          <option value="have.value">have.value</option>
          <option value="have.length">have.length</option>
          <option value="have.class">have.class</option>
          <option value="have.attr">have.attr</option>
        </select>
        <input id="assert-value" type="text" placeholder="${t('RECORDER.ASSERT_VALUE_PH')}"
          style="flex:2;min-width:110px;padding:5px 8px;background:#161b22;border:1px solid #30363d;
                 border-radius:5px;color:#c9d1d9;font-size:11px;outline:none"/>
        <button id="btn-add-assertion"
          style="padding:5px 12px;border:none;border-radius:5px;cursor:pointer;
                 font-size:11px;font-weight:500;background:#2f81f7;color:#fff;
                 white-space:nowrap;flex-shrink:0">
          ${t('RECORDER.ASSERT_ADD_BTN')}
        </button>
      </div>
    </div>`);

  document.getElementById('btn-add-assertion')?.addEventListener('click', () => {
    const sel  = (document.getElementById('assert-selector') as HTMLInputElement).value.trim();
    const type = (document.getElementById('assert-type')     as HTMLSelectElement).value;
    const val  = (document.getElementById('assert-value')    as HTMLInputElement).value.trim();
    if (!sel) return;
    const s = escapeSingleQuotes(sel);
    const v = escapeSingleQuotes(val);
    const cmd = NO_VALUE_ASSERTIONS.has(type) || !val
      ? `cy.get('${s}').should('${type}')`
      : `cy.get('${s}').should('${type}', '${v}')`;
    onAddCommand(cmd);
    (document.getElementById('assert-selector') as HTMLInputElement).value = '';
    (document.getElementById('assert-value')    as HTMLInputElement).value = '';
  });
}
