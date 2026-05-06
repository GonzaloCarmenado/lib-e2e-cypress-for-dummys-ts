import { PersistenceService } from "../services/persistence.service"
import { TranslationService } from "../services/translation.service"
import type { Lang } from "../models/lang.model"

const STYLES = `
  :host { display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e6edf3; }
  * { box-sizing: border-box; }
  .section { padding: 16px 20px; border-bottom: 1px solid #21262d; }
  .section:last-child { border-bottom: none; }
  h4 { margin: 0 0 12px; font-size: 10px; text-transform: uppercase;
       letter-spacing: 0.8px; color: #484f58; font-weight: 700; }
  label { display: flex; align-items: center; gap: 10px; font-size: 13px;
          color: #8b949e; cursor: pointer; margin-bottom: 10px; }
  label:last-child { margin-bottom: 0; }
  select {
    background: #0d1117; color: #e6edf3; border: 1px solid #30363d;
    border-radius: 6px; padding: 6px 10px; font-size: 13px; outline: none;
    cursor: pointer; transition: border-color 0.15s;
  }
  select:focus { border-color: #2f81f7; box-shadow: 0 0 0 3px rgba(47,129,247,0.12); }
  input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; accent-color: #2f81f7; }
  .toggle-desc { font-size: 11px; color: #484f58; margin-left: 2px; }
  .btn-row { display: flex; gap: 8px; flex-wrap: wrap; }
  button {
    padding: 7px 16px; border: 1px solid #30363d; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-weight: 500; background: #21262d; color: #8b949e;
    transition: background 0.15s, color 0.12s, border-color 0.15s;
  }
  button:hover { background: #30363d; color: #e6edf3; border-color: #484f58; }
  .file-input { display: none; }
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
    const config = await this.persistence.getConfig("language")
    if (config?.['language']) {
      this.selectedLanguage = config['language'] as string
      this.translation.setLang(this.selectedLanguage as Lang)
    }
    this.advancedHttpConfig = localStorage.getItem("extendedHttpCommands") === "true"
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
      <div class="section">
        <h4>Idioma</h4>
        <label>
          Idioma de la interfaz:
          <select id="lang-select">${langOptions}</select>
        </label>
      </div>
      <div class="section">
        <h4>HTTP Avanzado</h4>
        <label>
          <input type="checkbox" id="http-toggle" ${this.advancedHttpConfig ? "checked" : ""} />
          Validaciones automáticas de body
          <span class="toggle-desc">(GET → response, POST/PUT → request)</span>
        </label>
      </div>
      <div class="section">
        <h4>Datos</h4>
        <div class="btn-row">
          <button id="btn-export">⬆️ Exportar tests</button>
          <label class="btn-row" style="cursor:pointer;margin:0">
            <span style="padding:7px 16px;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;background:#2a3245;color:#adb5d0">
              ⬇️ Importar tests
            </span>
            <input type="file" class="file-input" id="file-input" accept=".json" />
          </label>
        </div>
      </div>
    `
    ;(this.shadow.getElementById("lang-select") as HTMLSelectElement).addEventListener("change", (e) =>
      this.onLanguageChange((e.target as HTMLSelectElement).value),
    )
    ;(this.shadow.getElementById("http-toggle") as HTMLInputElement).addEventListener("change", (e) =>
      this.onAdvancedHttpConfigChange((e.target as HTMLInputElement).checked),
    )

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
