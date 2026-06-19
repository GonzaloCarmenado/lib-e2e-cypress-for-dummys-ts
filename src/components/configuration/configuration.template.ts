import { escHtml, escAttr } from '../../utils/html.utils';
import { selectTestsForExport, type ExportMode } from '../../utils/export-selection.utils';
import type { TestWithDetails } from '../../services/persistence.service';

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
  startHidden: boolean;
  isExporting: boolean;
  exportMode: ExportMode;
  exportTests: TestWithDetails[];
  exportSelectedIds: Set<number>;
  exportSelectedTags: Set<string>;
}

export function renderExportOverlay(state: ConfigurationState, t: (key: string) => string): string {
  const { isExporting, exportMode, exportTests, exportSelectedIds, exportSelectedTags } = state;
  if (!isExporting) return '';

  const count = selectTestsForExport(exportTests, exportMode, {
    ids: exportSelectedIds,
    tags: exportSelectedTags,
  }).length;

  const modeBtn = (mode: ExportMode, key: string) =>
    `<button class="export-mode ${exportMode === mode ? 'active' : ''}" data-export-mode="${mode}">${t(key)}</button>`;

  let body: string;
  if (exportTests.length === 0) {
    body = `<div class="export-empty">${t('CONFIG.EXPORT_EMPTY')}</div>`;
  } else if (exportMode === 'all') {
    body = `<div class="export-all-desc">${t('CONFIG.EXPORT_ALL_DESC')}</div>`;
  } else if (exportMode === 'manual') {
    body = `<div class="export-list">${exportTests.map((test) => `
        <label class="export-row">
          <input type="checkbox" data-export-test="${test.id}" ${exportSelectedIds.has(test.id) ? 'checked' : ''} />
          <span class="export-row-name">${escHtml(test.name)}</span>
          ${(test.tags ?? []).map((tag) => `<span class="export-row-tag">${escHtml(tag)}</span>`).join('')}
        </label>`).join('')}</div>`;
  } else {
    const allTags = [...new Set(exportTests.flatMap((test) => test.tags ?? []))].sort();
    body = allTags.length
      ? `<div class="export-tags">${allTags.map((tag) =>
          `<button class="export-tag ${exportSelectedTags.has(tag) ? 'active' : ''}" data-export-tag="${escAttr(tag)}">${escHtml(tag)}</button>`).join('')}</div>`
      : `<div class="export-empty">${t('CONFIG.EXPORT_NO_TAGS')}</div>`;
  }

  return `
    <div class="export-overlay" id="export-overlay">
      <div class="export-modal">
        <div class="export-hd">${t('CONFIG.EXPORT_DIALOG_TITLE')}</div>
        ${exportTests.length ? `<div class="export-modes">
          ${modeBtn('all', 'CONFIG.EXPORT_MODE_ALL')}
          ${modeBtn('manual', 'CONFIG.EXPORT_MODE_MANUAL')}
          ${modeBtn('tags', 'CONFIG.EXPORT_MODE_TAGS')}
        </div>` : ''}
        <div class="export-body">${body}</div>
        <div class="export-ft">
          <span class="export-count">${t('CONFIG.EXPORT_COUNT')} <b>${count}</b></span>
          <span class="export-ft-actions">
            <button id="btn-export-confirm" class="btn-export-confirm" ${count === 0 ? 'disabled' : ''}>${t('CONFIG.EXPORT_CONFIRM')}</button>
            <button id="btn-export-cancel">${t('CONFIG.EXPORT_CANCEL')}</button>
          </span>
        </div>
      </div>
    </div>`;
}

export function renderConfiguration(state: ConfigurationState, t: (key: string) => string): string {
  const { selectedLanguage, advancedHttpConfig, selectorStrategy, filesystemGranted, cypressFolderName, smartSelectorEnabled, startHidden } = state;

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

      <!-- Start Hidden -->
      <div class="card">
        <div class="card-hd">${t('CONFIG.START_HIDDEN_SECTION')}</div>
        <label class="check-row">
          <input type="checkbox" id="start-hidden-toggle" ${startHidden ? 'checked' : ''} />
          <div>
            <div class="check-title">${t('CONFIG.START_HIDDEN_TITLE')}</div>
            <div class="check-sub">${t('CONFIG.START_HIDDEN_SUB')}</div>
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
          <pre class="fs-tree">cypress/  <span style="color:#484f58">${t('RECORDER.FS_TREE_PICK_HINT')}</span>
└── e2e/
    └── *.cy.ts</pre>
          <div class="fs-right">
            <div class="fs-status">
              <span class="fs-dot ${filesystemGranted ? 'on' : 'off'}"></span>
              ${filesystemGranted && cypressFolderName
                ? `<span>${t('CONFIG.FOLDER_CONNECTED')}</span>&nbsp;<span class="fs-folder">📁 ${escHtml(cypressFolderName)}</span>`
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

    </div>${renderExportOverlay(state, t)}`;
}
