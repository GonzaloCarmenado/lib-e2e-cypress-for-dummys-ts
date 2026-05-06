import { PersistenceService } from "../services/persistence.service"
import { TranslationService } from "../services/translation.service"
import type { Lang } from "../models/lang.model"
import type { SelectorStrategy } from "../services/recording.service"
import { showToast } from "../utils/toast.utils"

const STYLES = `
  :host { display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e6edf3; }
  * { box-sizing: border-box; }

  /* ── Grid container ───────────────────────────────────── */
  .cfg-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 14px;
  }

  /* ── Cards ────────────────────────────────────────────── */
  .card {
    background: #161b22;
    border: 1px solid #21262d;
    border-radius: 10px;
    padding: 14px 16px;
    transition: border-color 0.15s;
  }
  .card:hover { border-color: #30363d; }
  .card-wide { grid-column: 1 / -1; }

  /* ── Card header ──────────────────────────────────────── */
  .card-hd {
    display: flex; align-items: center; gap: 7px;
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.8px; color: #484f58; margin-bottom: 12px;
  }
  .card-hd-icon { font-size: 13px; }

  /* ── Language ─────────────────────────────────────────── */
  .field-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .field-label { font-size: 12px; color: #8b949e; }
  select {
    background: #0d1117; color: #e6edf3; border: 1px solid #30363d;
    border-radius: 6px; padding: 6px 10px; font-size: 12px; outline: none;
    cursor: pointer; transition: border-color 0.15s; flex-shrink: 0;
  }
  select:focus { border-color: #2f81f7; box-shadow: 0 0 0 3px rgba(47,129,247,0.12); }

  /* ── HTTP toggle ──────────────────────────────────────── */
  .check-row {
    display: flex; align-items: flex-start; gap: 10px;
    cursor: pointer; user-select: none;
  }
  input[type="checkbox"] { width: 15px; height: 15px; margin-top: 2px; cursor: pointer; accent-color: #2f81f7; flex-shrink: 0; }
  .check-title { font-size: 12px; color: #c9d1d9; margin-bottom: 3px; }
  .check-sub   { font-size: 10px; color: #484f58; line-height: 1.5; }

  /* ── Cypress folder ───────────────────────────────────── */
  .fs-layout { display: flex; gap: 12px; align-items: flex-start; }
  .fs-tree {
    flex-shrink: 0;
    margin: 0; padding: 8px 10px;
    background: #0d1117; border: 1px solid #21262d; border-radius: 6px;
    font-size: 10px; color: #c9d1d9; line-height: 1.8;
    font-family: 'Cascadia Code','Fira Code','Consolas',monospace;
  }
  .fs-right { display: flex; flex-direction: column; gap: 10px; flex: 1; }
  .fs-status {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; color: #8b949e;
    background: #0d1117; border: 1px solid #21262d; border-radius: 6px;
    padding: 8px 10px;
  }
  .fs-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .fs-dot.on  { background: #3fb950; box-shadow: 0 0 6px rgba(63,185,80,.5); }
  .fs-dot.off { background: #484f58; }
  .fs-folder  { color: #e6edf3; font-family: 'Cascadia Code','Fira Code','Consolas',monospace; font-size: 11px; }

  /* ── Buttons ──────────────────────────────────────────── */
  .btn-row { display: flex; gap: 8px; flex-wrap: wrap; }
  button {
    padding: 7px 14px; border: 1px solid #30363d; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-weight: 500; background: #21262d; color: #8b949e;
    transition: background 0.15s, color 0.12s, border-color 0.15s;
  }
  button:hover { background: #30363d; color: #e6edf3; border-color: #484f58; }
  .btn-import {
    display: inline-block;
    padding: 7px 14px; border: 1px solid #30363d; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-weight: 500; background: #21262d; color: #8b949e;
    transition: background 0.15s, color 0.12s, border-color 0.15s;
  }
  .btn-import:hover { background: #30363d; color: #e6edf3; border-color: #484f58; }
  .btn-danger { border-color: rgba(248,81,73,.4); color: #f85149; background: transparent; }
  .btn-danger:hover { background: rgba(248,81,73,.08); border-color: #f85149; color: #f85149; }
  .file-input { display: none; }

  /* ── Data section desc ────────────────────────────────── */
  .data-desc { font-size: 11px; color: #484f58; margin-bottom: 10px; line-height: 1.5; }
`

const LANGS = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "it", label: "Italiano" },
  { value: "de", label: "Deutsch" },
]

export class ConfigurationElement extends HTMLElement {
  private shadow: ShadowRoot
  persistence!: PersistenceService
  translation!: TranslationService
  selectedLanguage = "es"
  advancedHttpConfig = false
  selectorStrategy: SelectorStrategy = 'data-cy'
  private filesystemGranted = false
  private cypressFolderName: string | null = null

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: "open" })
    this.advancedHttpConfig = localStorage.getItem("extendedHttpCommands") === "true"
  }

  connectedCallback(): void {
    if (!this.persistence) this.persistence = new PersistenceService()
    if (!this.translation) this.translation = new TranslationService()
    this.loadConfig()
    this.render()
  }

  private t(key: string): string { return this.translation.translate(key); }

  private async loadConfig(): Promise<void> {
    const config = await this.persistence.getGeneralConfig()
    if (config?.['language']) {
      this.selectedLanguage = config['language'] as string
      this.translation.setLang(this.selectedLanguage as Lang)
    }
    this.advancedHttpConfig = localStorage.getItem("extendedHttpCommands") === "true"
    this.selectorStrategy = (config?.['selectorStrategy'] as SelectorStrategy) ?? 'data-cy'
    this.filesystemGranted = config?.['allowReadWriteFiles'] === 'true'
    const handle = config?.['cypressDirectoryHandle'] as FileSystemDirectoryHandle | undefined
    this.cypressFolderName = handle?.name ?? null
    this.render()
  }

  async onLanguageChange(lang: string): Promise<void> {
    this.selectedLanguage = lang
    this.translation.setLang(lang as Lang)
    await this.persistence.setConfig({ language: lang })
    this.render()
  }

  onAdvancedHttpConfigChange(checked: boolean): void {
    this.advancedHttpConfig = checked
    localStorage.setItem("extendedHttpCommands", checked ? "true" : "false")
    this.persistence.setConfig({ extendedHttpCommands: checked ? "true" : "false" })
    this.render()
  }

  async onSelectorStrategyChange(strategy: SelectorStrategy): Promise<void> {
    this.selectorStrategy = strategy
    await this.persistence.setConfig({ selectorStrategy: strategy })
    this.dispatchEvent(new CustomEvent('selectorstrategychange', { detail: strategy, bubbles: true, composed: true }))
    this.render()
  }

  async changeFolder(): Promise<void> {
    try {
      await this.persistence.requestDirectoryPermissions()
      await this.loadConfig()
      showToast(this.t('CONFIG.FOLDER_UPDATED_TOAST'))
    } catch (e: unknown) {
      if ((e as DOMException)?.name !== 'AbortError') {
        showToast(this.t('CONFIG.FOLDER_ERROR_TOAST'), false)
      }
    }
  }

  async revokeAccess(): Promise<void> {
    await this.persistence.setConfig({ allowReadWriteFiles: 'false', cypressDirectoryHandle: null })
    this.filesystemGranted = false
    this.cypressFolderName = null
    this.render()
  }

  async exportAllData(): Promise<void> {
    const tests = await this.persistence.getAllTests()
    const blob = new Blob([JSON.stringify({ tests, interceptors: [] }, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "e2e-cypress-export.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  async importAllData(file: File): Promise<void> {
    const text = await file.text()
    let data: { tests: Record<string, unknown>[]; interceptors: Record<string, unknown>[] }
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error(this.t('CONFIG.JSON_INVALID'))
    }
    if (!data || !Array.isArray(data.tests) || !Array.isArray(data.interceptors)) {
      throw new Error(this.t('CONFIG.JSON_BAD_FORMAT'))
    }
    await this.persistence.clearAllData()
    await this.persistence.ingestFileData(data.tests, data.interceptors)
  }

  private render(): void {
    const langOptions = LANGS.map(
      (l) => `<option value="${l.value}" ${this.selectedLanguage === l.value ? "selected" : ""}>${l.label}</option>`,
    ).join("")

    this.shadow.innerHTML = `
      <style>${STYLES}</style>
      <div class="cfg-grid">

        <!-- Language -->
        <div class="card">
          <div class="card-hd">${this.t('CONFIG.LANG_SECTION')}</div>
          <div class="field-row">
            <span class="field-label">${this.t('CONFIG.LANG_FIELD')}</span>
            <select id="lang-select">${langOptions}</select>
          </div>
        </div>

        <!-- HTTP Advanced -->
        <div class="card">
          <div class="card-hd">${this.t('CONFIG.HTTP_SECTION')}</div>
          <label class="check-row">
            <input type="checkbox" id="http-toggle" ${this.advancedHttpConfig ? "checked" : ""} />
            <div>
              <div class="check-title">${this.t('CONFIG.HTTP_TITLE')}</div>
              <div class="check-sub">${this.t('CONFIG.HTTP_SUB')}</div>
            </div>
          </label>
        </div>

        <!-- Selector Strategy -->
        <div class="card card-wide">
          <div class="card-hd">${this.t('CONFIG.SELECTOR_SECTION')}</div>
          <div class="field-row">
            <span class="field-label">${this.t('CONFIG.SELECTOR_LABEL')}</span>
            <select id="selector-strategy">
              <option value="data-cy"     ${this.selectorStrategy === 'data-cy'     ? 'selected' : ''}>${this.t('CONFIG.SELECTOR_OPT_DATACY')}</option>
              <option value="data-testid" ${this.selectorStrategy === 'data-testid' ? 'selected' : ''}>${this.t('CONFIG.SELECTOR_OPT_TESTID')}</option>
              <option value="aria-label"  ${this.selectorStrategy === 'aria-label'  ? 'selected' : ''}>${this.t('CONFIG.SELECTOR_OPT_ARIA')}</option>
              <option value="id"          ${this.selectorStrategy === 'id'          ? 'selected' : ''}>${this.t('CONFIG.SELECTOR_OPT_ID')}</option>
            </select>
          </div>
          <div class="check-sub" style="margin-top:8px">${this.t('CONFIG.SELECTOR_HINT')}</div>
        </div>

        <!-- Cypress Folder -->
        <div class="card card-wide">
          <div class="card-hd">${this.t('CONFIG.FOLDER_SECTION')}</div>
          <div class="fs-layout">
            <pre class="fs-tree">cypress/  <span style="color:#484f58">← selecciona</span>
└── e2e/
    └── *.cy.ts</pre>
            <div class="fs-right">
              <div class="fs-status">
                <span class="fs-dot ${this.filesystemGranted ? 'on' : 'off'}"></span>
                ${this.filesystemGranted && this.cypressFolderName
                  ? `<span>${this.t('CONFIG.FOLDER_CONNECTED')}</span>&nbsp;<span class="fs-folder">📁 ${this.cypressFolderName}</span>`
                  : `<span>${this.t('CONFIG.FOLDER_NOT_SET')}</span>`}
              </div>
              <div class="btn-row">
                <button id="btn-change-folder">
                  ${this.filesystemGranted ? this.t('CONFIG.FOLDER_CHANGE_BTN') : this.t('CONFIG.FOLDER_SELECT_BTN')}
                </button>
                ${this.filesystemGranted
                  ? `<button id="btn-revoke" class="btn-danger">${this.t('CONFIG.FOLDER_REVOKE_BTN')}</button>`
                  : ''}
              </div>
            </div>
          </div>
        </div>

        <!-- Data -->
        <div class="card card-wide">
          <div class="card-hd">${this.t('CONFIG.DATA_SECTION')}</div>
          <p class="data-desc">${this.t('CONFIG.DATA_DESC')}</p>
          <div class="btn-row">
            <button id="btn-export">${this.t('CONFIG.EXPORT_BTN')}</button>
            <label style="cursor:pointer;margin:0">
              <span class="btn-import">${this.t('CONFIG.IMPORT_BTN')}</span>
              <input type="file" class="file-input" id="file-input" accept=".json" />
            </label>
          </div>
        </div>

      </div>
    `
    ;(this.shadow.getElementById("lang-select") as HTMLSelectElement).addEventListener("change", (e) =>
      this.onLanguageChange((e.target as HTMLSelectElement).value),
    )
    ;(this.shadow.getElementById("http-toggle") as HTMLInputElement).addEventListener("change", (e) =>
      this.onAdvancedHttpConfigChange((e.target as HTMLInputElement).checked),
    )
    ;(this.shadow.getElementById("selector-strategy") as HTMLSelectElement).addEventListener("change", (e) =>
      this.onSelectorStrategyChange((e.target as HTMLSelectElement).value as SelectorStrategy),
    )

    this.shadow.getElementById("btn-change-folder")!.addEventListener("click", () => this.changeFolder())
    this.shadow.getElementById("btn-revoke")?.addEventListener("click", () => this.revokeAccess())
    this.shadow.getElementById("btn-export")!.addEventListener("click", () => this.exportAllData())
    ;(this.shadow.getElementById("file-input") as HTMLInputElement).addEventListener("change", async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        await this.importAllData(file)
        alert(this.t('CONFIG.IMPORT_SUCCESS'))
      } catch (err: unknown) {
        alert((err as Error).message ?? this.t('CONFIG.IMPORT_ERROR'))
      }
      ;(e.target as HTMLInputElement).value = ""
    })
  }
}

if (!customElements.get("e2e-configuration")) {
  customElements.define("e2e-configuration", ConfigurationElement)
}
