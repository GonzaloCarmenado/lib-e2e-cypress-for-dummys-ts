export const LANGS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'it', label: 'Italiano' },
  { value: 'de', label: 'Deutsch' },
];

export interface ConfigurationState {
  selectedLanguage: string;
  advancedHttpConfig: boolean;
  selectorStrategy: string;
  filesystemGranted: boolean;
  cypressFolderName: string | null;
  smartSelectorEnabled: boolean;
}

export function renderConfiguration(state: ConfigurationState, t: (key: string) => string): string {
  const { selectedLanguage, advancedHttpConfig, selectorStrategy, filesystemGranted, cypressFolderName, smartSelectorEnabled } = state;

  const langOptions = LANGS.map(
    (l) => `<option value="${l.value}" ${selectedLanguage === l.value ? 'selected' : ''}>${l.label}</option>`,
  ).join('');

  return `
    <div class="cfg-grid">

      <!-- Language -->
      <div class="card">
        <div class="card-hd">${t('CONFIG.LANG_SECTION')}</div>
        <div class="field-row">
          <span class="field-label">${t('CONFIG.LANG_FIELD')}</span>
          <select id="lang-select">${langOptions}</select>
        </div>
      </div>

      <!-- HTTP Advanced -->
      <div class="card">
        <div class="card-hd">${t('CONFIG.HTTP_SECTION')}</div>
        <label class="check-row">
          <input type="checkbox" id="http-toggle" ${advancedHttpConfig ? 'checked' : ''} />
          <div>
            <div class="check-title">${t('CONFIG.HTTP_TITLE')}</div>
            <div class="check-sub">${t('CONFIG.HTTP_SUB')}</div>
          </div>
        </label>
      </div>

      <!-- Smart Selector -->
      <div class="card">
        <div class="card-hd">${t('CONFIG.SMART_SELECTOR_SECTION')}</div>
        <label class="check-row">
          <input type="checkbox" id="smart-selector-toggle" ${smartSelectorEnabled ? 'checked' : ''} />
          <div>
            <div class="check-title">${t('CONFIG.SMART_SELECTOR_TITLE')}</div>
            <div class="check-sub">${t('CONFIG.SMART_SELECTOR_SUB')}</div>
          </div>
        </label>
      </div>

      <!-- Selector Strategy -->
      <div class="card card-wide">
        <div class="card-hd">${t('CONFIG.SELECTOR_SECTION')}</div>
        <div class="field-row">
          <span class="field-label">${t('CONFIG.SELECTOR_LABEL')}</span>
          <select id="selector-strategy">
            <option value="data-cy"     ${selectorStrategy === 'data-cy'     ? 'selected' : ''}>${t('CONFIG.SELECTOR_OPT_DATACY')}</option>
            <option value="data-testid" ${selectorStrategy === 'data-testid' ? 'selected' : ''}>${t('CONFIG.SELECTOR_OPT_TESTID')}</option>
            <option value="aria-label"  ${selectorStrategy === 'aria-label'  ? 'selected' : ''}>${t('CONFIG.SELECTOR_OPT_ARIA')}</option>
            <option value="id"          ${selectorStrategy === 'id'          ? 'selected' : ''}>${t('CONFIG.SELECTOR_OPT_ID')}</option>
          </select>
        </div>
        <div class="check-sub" style="margin-top:8px">${t('CONFIG.SELECTOR_HINT')}</div>
      </div>

      <!-- Cypress Folder -->
      <div class="card card-wide">
        <div class="card-hd">${t('CONFIG.FOLDER_SECTION')}</div>
        <div class="fs-layout">
          <pre class="fs-tree">cypress/  <span style="color:#484f58">← selecciona</span>
└── e2e/
    └── *.cy.ts</pre>
          <div class="fs-right">
            <div class="fs-status">
              <span class="fs-dot ${filesystemGranted ? 'on' : 'off'}"></span>
              ${filesystemGranted && cypressFolderName
                ? `<span>${t('CONFIG.FOLDER_CONNECTED')}</span>&nbsp;<span class="fs-folder">📁 ${cypressFolderName}</span>`
                : `<span>${t('CONFIG.FOLDER_NOT_SET')}</span>`}
            </div>
            <div class="btn-row">
              <button id="btn-change-folder">
                ${filesystemGranted ? t('CONFIG.FOLDER_CHANGE_BTN') : t('CONFIG.FOLDER_SELECT_BTN')}
              </button>
              ${filesystemGranted
                ? `<button id="btn-revoke" class="btn-danger">${t('CONFIG.FOLDER_REVOKE_BTN')}</button>`
                : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- Data -->
      <div class="card card-wide">
        <div class="card-hd">${t('CONFIG.DATA_SECTION')}</div>
        <p class="data-desc">${t('CONFIG.DATA_DESC')}</p>
        <div class="btn-row">
          <button id="btn-export">${t('CONFIG.EXPORT_BTN')}</button>
          <label style="cursor:pointer;margin:0">
            <span class="btn-import">${t('CONFIG.IMPORT_BTN')}</span>
            <input type="file" class="file-input" id="file-input" accept=".json" />
          </label>
        </div>
      </div>

    </div>`;
}
