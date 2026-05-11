import { PersistenceService } from "../../services/persistence.service"
import { TranslationService } from "../../services/translation.service"
import type { Lang } from "../../models/lang.model"
import type { SelectorStrategy } from "../../services/recording.service"
import { showToast } from "../../utils/toast.utils"
import { CONFIGURATION_STYLES } from './configuration.styles';
import { renderConfiguration } from './configuration.template';

export class ConfigurationElement extends HTMLElement {
  private shadow: ShadowRoot
  persistence!: PersistenceService
  translation!: TranslationService
  selectedLanguage = "es"
  advancedHttpConfig = false
  selectorStrategy: SelectorStrategy = 'data-cy'
  smartSelectorEnabled = true
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
    this.smartSelectorEnabled = config?.['smartSelectorEnabled'] !== 'false'
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

  async onSmartSelectorChange(enabled: boolean): Promise<void> {
    this.smartSelectorEnabled = enabled
    await this.persistence.setConfig({ smartSelectorEnabled: enabled ? 'true' : 'false' })
    this.dispatchEvent(new CustomEvent('smartselectorchange', { detail: enabled, bubbles: true, composed: true }))
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
    this.shadow.innerHTML = `<style>${CONFIGURATION_STYLES}</style>${renderConfiguration({
      selectedLanguage: this.selectedLanguage,
      advancedHttpConfig: this.advancedHttpConfig,
      selectorStrategy: this.selectorStrategy,
      filesystemGranted: this.filesystemGranted,
      cypressFolderName: this.cypressFolderName,
      smartSelectorEnabled: this.smartSelectorEnabled,
    }, this.t.bind(this))}`;
    ;(this.shadow.getElementById("lang-select") as HTMLSelectElement).addEventListener("change", (e) =>
      this.onLanguageChange((e.target as HTMLSelectElement).value),
    )
    ;(this.shadow.getElementById("http-toggle") as HTMLInputElement).addEventListener("change", (e) =>
      this.onAdvancedHttpConfigChange((e.target as HTMLInputElement).checked),
    )
    ;(this.shadow.getElementById("smart-selector-toggle") as HTMLInputElement).addEventListener("change", (e) =>
      this.onSmartSelectorChange((e.target as HTMLInputElement).checked),
    )
    ;(this.shadow.getElementById("selector-strategy") as HTMLSelectElement).addEventListener("change", (e) =>
      this.onSelectorStrategyChange((e.target as HTMLSelectElement).value as SelectorStrategy),
    )

    this.shadow.getElementById("btn-change-folder")?.addEventListener("click", () => this.changeFolder())
    this.shadow.getElementById("btn-revoke")?.addEventListener("click", () => this.revokeAccess())
    this.shadow.getElementById("btn-export")?.addEventListener("click", () => this.exportAllData())
    ;(this.shadow.getElementById("file-input") as HTMLInputElement).addEventListener("change", async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        await this.importAllData(file)
        alert(this.t('CONFIG.IMPORT_SUCCESS'))
      } catch (err: unknown) {
        alert((err as Error).message ?? this.t('CONFIG.IMPORT_ERROR'))
      }
      const target = e.target as HTMLInputElement | null
      if (target) target.value = ''
    })
  }
}

if (!customElements.get("e2e-configuration")) {
  customElements.define("e2e-configuration", ConfigurationElement)
}
