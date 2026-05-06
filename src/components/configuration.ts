import { PersistenceService } from "../services/persistence.service"
import { TranslationService } from "../services/translation.service"
import type { Lang } from "../models/lang.model"
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

  private async loadConfig(): Promise<void> {
    const config = await this.persistence.getGeneralConfig()
    if (config?.['language']) {
      this.selectedLanguage = config['language'] as string
      this.translation.setLang(this.selectedLanguage as Lang)
    }
    this.advancedHttpConfig = localStorage.getItem("extendedHttpCommands") === "true"
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

  async changeFolder(): Promise<void> {
    try {
      await this.persistence.requestDirectoryPermissions()
      await this.loadConfig()
      showToast('✓ Carpeta de Cypress actualizada')
    } catch (e: unknown) {
      if ((e as DOMException)?.name !== 'AbortError') {
        showToast('Error al acceder a la carpeta', false)
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
      throw new Error("El archivo no es un JSON válido.")
    }
    if (!data || !Array.isArray(data.tests) || !Array.isArray(data.interceptors)) {
      throw new Error("El archivo no tiene el formato esperado.")
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

        <!-- Idioma -->
        <div class="card">
          <div class="card-hd"><span class="card-hd-icon">🌐</span> Idioma</div>
          <div class="field-row">
            <span class="field-label">Interfaz</span>
            <select id="lang-select">${langOptions}</select>
          </div>
        </div>

        <!-- HTTP Avanzado -->
        <div class="card">
          <div class="card-hd"><span class="card-hd-icon">⚡</span> HTTP Avanzado</div>
          <label class="check-row">
            <input type="checkbox" id="http-toggle" ${this.advancedHttpConfig ? "checked" : ""} />
            <div>
              <div class="check-title">Validaciones de body</div>
              <div class="check-sub">GET → response · POST/PUT → request</div>
            </div>
          </label>
        </div>

        <!-- Carpeta Cypress -->
        <div class="card card-wide">
          <div class="card-hd"><span class="card-hd-icon">📁</span> Carpeta Cypress</div>
          <div class="fs-layout">
            <pre class="fs-tree">cypress/  <span style="color:#484f58">← selecciona</span>
└── e2e/
    └── *.cy.ts</pre>
            <div class="fs-right">
              <div class="fs-status">
                <span class="fs-dot ${this.filesystemGranted ? 'on' : 'off'}"></span>
                ${this.filesystemGranted && this.cypressFolderName
                  ? `<span>conectado &mdash;</span>&nbsp;<span class="fs-folder">📁 ${this.cypressFolderName}</span>`
                  : `<span>sin configurar</span>`}
              </div>
              <div class="btn-row">
                <button id="btn-change-folder">
                  ${this.filesystemGranted ? '📁 Cambiar carpeta' : '📁 Seleccionar carpeta'}
                </button>
                ${this.filesystemGranted
                  ? '<button id="btn-revoke" class="btn-danger">✕ Quitar acceso</button>'
                  : ''}
              </div>
            </div>
          </div>
        </div>

        <!-- Datos -->
        <div class="card card-wide">
          <div class="card-hd"><span class="card-hd-icon">💾</span> Datos</div>
          <p class="data-desc">Exporta todos tus tests a JSON o importa una copia de seguridad.</p>
          <div class="btn-row">
            <button id="btn-export">⬆️ Exportar tests</button>
            <label style="cursor:pointer;margin:0">
              <span class="btn-import">⬇️ Importar tests</span>
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

    this.shadow.getElementById("btn-change-folder")!.addEventListener("click", () => this.changeFolder())
    this.shadow.getElementById("btn-revoke")?.addEventListener("click", () => this.revokeAccess())
    this.shadow.getElementById("btn-export")!.addEventListener("click", () => this.exportAllData())
    ;(this.shadow.getElementById("file-input") as HTMLInputElement).addEventListener("change", async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        await this.importAllData(file)
        alert("Datos importados correctamente.")
      } catch (err: unknown) {
        alert((err as Error).message ?? "Error al importar.")
      }
      ;(e.target as HTMLInputElement).value = ""
    })
  }
}

if (!customElements.get("e2e-configuration")) {
  customElements.define("e2e-configuration", ConfigurationElement)
}
