import { PersistenceService } from '../../services/persistence.service';
import type { TestWithDetails } from '../../services/persistence.service';
import { TranslationService } from '../../services/translation.service';
import type { Lang } from '../../models/lang.model';
import type { SelectorStrategy } from '../../services/recording.service';
import { RESUME_TTL_CONFIG_KEY, DEFAULT_RESUME_TTL_MINUTES } from '../../models/active-session.model';
import { showToast } from '../../utils/toast.utils';
import { selectTestsForExport, type ExportMode } from '../../utils/export-selection.utils';
import { CONFIGURATION_STYLES } from './configuration.styles';
import { renderConfiguration } from './configuration.template';

export class ConfigurationElement extends HTMLElement {
  private shadow: ShadowRoot;
  persistence!: PersistenceService;
  translation!: TranslationService;
  selectedLanguage = 'es';
  advancedHttpConfig = false;
  selectorStrategy: SelectorStrategy = 'data-cy';
  smartSelectorEnabled = true;
  startHidden = false;
  resumeTtlMinutes = DEFAULT_RESUME_TTL_MINUTES;
  isExporting = false;
  exportMode: ExportMode = 'all';
  exportTests: TestWithDetails[] = [];
  exportSelectedIds: Set<number> = new Set();
  exportSelectedTags: Set<string> = new Set();
  private filesystemGranted = false;
  private cypressFolderName: string | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.advancedHttpConfig = localStorage.getItem('extendedHttpCommands') === 'true';
  }

  connectedCallback(): void {
    if (!this.persistence) this.persistence = new PersistenceService();
    if (!this.translation) this.translation = new TranslationService();
    this.loadConfig();
    this.render();
  }

  private t(key: string): string { return this.translation.translate(key); }

  private async loadConfig(): Promise<void> {
    const config = await this.persistence.getGeneralConfig();
    if (config?.['language']) {
      this.selectedLanguage = config['language'] as string;
      this.translation.setLang(this.selectedLanguage as Lang);
    }
    this.advancedHttpConfig = localStorage.getItem('extendedHttpCommands') === 'true';
    this.selectorStrategy = (config?.['selectorStrategy'] as SelectorStrategy) ?? 'data-cy';
    this.smartSelectorEnabled = config?.['smartSelectorEnabled'] !== 'false';
    this.startHidden = config?.['startHidden'] === 'true';
    // Only override when the key exists — otherwise an async load could clobber a
    // value just set via onResumeTtlChange (same pattern as `language`).
    const ttlRaw = config?.[RESUME_TTL_CONFIG_KEY];
    if (ttlRaw !== undefined && ttlRaw !== null) {
      const ttl = Number(ttlRaw);
      this.resumeTtlMinutes = Number.isFinite(ttl) && ttl > 0 ? ttl : DEFAULT_RESUME_TTL_MINUTES;
    }
    this.filesystemGranted = config?.['allowReadWriteFiles'] === 'true';
    const handle = config?.['cypressDirectoryHandle'] as FileSystemDirectoryHandle | undefined;
    this.cypressFolderName = handle?.name ?? null;
    this.render();
  }

  async onLanguageChange(lang: string): Promise<void> {
    this.selectedLanguage = lang;
    this.translation.setLang(lang as Lang);
    await this.persistence.setConfig({ language: lang });
    this.render();
  }

  onAdvancedHttpConfigChange(checked: boolean): void {
    this.advancedHttpConfig = checked;
    localStorage.setItem('extendedHttpCommands', checked ? 'true' : 'false');
    this.persistence.setConfig({ extendedHttpCommands: checked ? 'true' : 'false' });
    this.render();
  }

  async onStartHiddenChange(checked: boolean): Promise<void> {
    this.startHidden = checked;
    await this.persistence.setConfig({ startHidden: checked ? 'true' : 'false' });
    this.dispatchEvent(new CustomEvent('starthiddenchange', { detail: checked, bubbles: true, composed: true }));
    this.render();
  }

  async onResumeTtlChange(minutes: number): Promise<void> {
    const safe = Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : DEFAULT_RESUME_TTL_MINUTES;
    this.resumeTtlMinutes = safe;
    await this.persistence.setConfig({ [RESUME_TTL_CONFIG_KEY]: safe });
    this.render();
  }

  async onSmartSelectorChange(enabled: boolean): Promise<void> {
    this.smartSelectorEnabled = enabled;
    await this.persistence.setConfig({ smartSelectorEnabled: enabled ? 'true' : 'false' });
    this.dispatchEvent(new CustomEvent('smartselectorchange', { detail: enabled, bubbles: true, composed: true }));
    this.render();
  }

  async onSelectorStrategyChange(strategy: SelectorStrategy): Promise<void> {
    this.selectorStrategy = strategy;
    await this.persistence.setConfig({ selectorStrategy: strategy });
    this.dispatchEvent(new CustomEvent('selectorstrategychange', { detail: strategy, bubbles: true, composed: true }));
    this.render();
  }

  async changeFolder(): Promise<void> {
    try {
      await this.persistence.requestDirectoryPermissions();
      await this.loadConfig();
      showToast(this.t('CONFIG.FOLDER_UPDATED_TOAST'));
    } catch (e: unknown) {
      if ((e as DOMException)?.name !== 'AbortError') {
        showToast(this.t('CONFIG.FOLDER_ERROR_TOAST'), false);
      }
    }
  }

  async revokeAccess(): Promise<void> {
    await this.persistence.setConfig({ allowReadWriteFiles: 'false', cypressDirectoryHandle: null });
    this.filesystemGranted = false;
    this.cypressFolderName = null;
    this.render();
  }

  private downloadTests(tests: TestWithDetails[]): void {
    const blob = new Blob([JSON.stringify({ tests, interceptors: [] }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'e2e-cypress-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Downloads every saved test (used by the "Todo" mode and as a direct API). */
  async exportAllData(): Promise<void> {
    const tests = await this.persistence.getAllTests();
    this.downloadTests(tests);
  }

  /** Opens the export selection dialog, loading the current tests. */
  async openExportDialog(): Promise<void> {
    this.exportTests = await this.persistence.getAllTests();
    this.exportMode = 'all';
    this.exportSelectedIds = new Set();
    this.exportSelectedTags = new Set();
    this.isExporting = true;
    this.render();
  }

  cancelExport(): void {
    this.isExporting = false;
    this.exportSelectedIds.clear();
    this.exportSelectedTags.clear();
    this.render();
  }

  setExportMode(mode: ExportMode): void {
    this.exportMode = mode;
    this.render();
  }

  toggleExportTest(id: number): void {
    if (this.exportSelectedIds.has(id)) this.exportSelectedIds.delete(id);
    else this.exportSelectedIds.add(id);
    this.render();
  }

  toggleExportTag(tag: string): void {
    if (this.exportSelectedTags.has(tag)) this.exportSelectedTags.delete(tag);
    else this.exportSelectedTags.add(tag);
    this.render();
  }

  /** Downloads the tests resolved by the current mode + selection. No-op if empty. */
  confirmExport(): void {
    const subset = selectTestsForExport(this.exportTests, this.exportMode, {
      ids: this.exportSelectedIds,
      tags: this.exportSelectedTags,
    });
    if (!subset.length) return;
    this.downloadTests(subset);
    this.isExporting = false;
    this.exportSelectedIds.clear();
    this.exportSelectedTags.clear();
    this.render();
  }

  async importAllData(file: File): Promise<void> {
    const text = await file.text();
    let data: { tests: Record<string, unknown>[]; interceptors: Record<string, unknown>[] };
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(this.t('CONFIG.JSON_INVALID'));
    }
    if (!data || !Array.isArray(data.tests) || !Array.isArray(data.interceptors)) {
      throw new Error(this.t('CONFIG.JSON_BAD_FORMAT'));
    }
    // Merge: append the imported tests to whatever is already stored — never wipe
    // existing data (see docs/specs/004-merge-on-import.md).
    await this.persistence.ingestFileData(data.tests, data.interceptors);
  }

  private render(): void {
    this.shadow.innerHTML = `<style>${CONFIGURATION_STYLES}</style>${renderConfiguration({
      selectedLanguage: this.selectedLanguage,
      advancedHttpConfig: this.advancedHttpConfig,
      selectorStrategy: this.selectorStrategy,
      filesystemGranted: this.filesystemGranted,
      cypressFolderName: this.cypressFolderName,
      smartSelectorEnabled: this.smartSelectorEnabled,
      startHidden: this.startHidden,
      resumeTtlMinutes: this.resumeTtlMinutes,
      isExporting: this.isExporting,
      exportMode: this.exportMode,
      exportTests: this.exportTests,
      exportSelectedIds: this.exportSelectedIds,
      exportSelectedTags: this.exportSelectedTags,
    }, this.t.bind(this))}`;
    ;(this.shadow.getElementById('lang-select') as HTMLSelectElement).addEventListener('change', (e) =>
      this.onLanguageChange((e.target as HTMLSelectElement).value),
    )
    ;(this.shadow.getElementById('http-toggle') as HTMLInputElement).addEventListener('change', (e) =>
      this.onAdvancedHttpConfigChange((e.target as HTMLInputElement).checked),
    )
    ;(this.shadow.getElementById('smart-selector-toggle') as HTMLInputElement).addEventListener('change', (e) =>
      this.onSmartSelectorChange((e.target as HTMLInputElement).checked),
    )
    ;(this.shadow.getElementById('start-hidden-toggle') as HTMLInputElement).addEventListener('change', (e) =>
      this.onStartHiddenChange((e.target as HTMLInputElement).checked),
    )
    ;(this.shadow.getElementById('resume-ttl-input') as HTMLInputElement).addEventListener('change', (e) =>
      this.onResumeTtlChange(Number((e.target as HTMLInputElement).value)),
    )
    ;(this.shadow.getElementById('selector-strategy') as HTMLSelectElement).addEventListener('change', (e) =>
      this.onSelectorStrategyChange((e.target as HTMLSelectElement).value as SelectorStrategy),
    );

    this.shadow.getElementById('btn-change-folder')?.addEventListener('click', () => this.changeFolder());
    this.shadow.getElementById('btn-revoke')?.addEventListener('click', () => this.revokeAccess());
    this.shadow.getElementById('btn-export')?.addEventListener('click', () => this.openExportDialog());

    this.shadow.getElementById('btn-export-confirm')?.addEventListener('click', () => this.confirmExport());
    this.shadow.getElementById('btn-export-cancel')?.addEventListener('click', () => this.cancelExport());
    this.shadow.querySelectorAll('[data-export-mode]').forEach((el) =>
      el.addEventListener('click', () => this.setExportMode((el as HTMLElement).dataset['exportMode'] as ExportMode)),
    );
    this.shadow.querySelectorAll('[data-export-test]').forEach((el) =>
      el.addEventListener('change', () => this.toggleExportTest(Number((el as HTMLElement).dataset['exportTest']))),
    );
    this.shadow.querySelectorAll('[data-export-tag]').forEach((el) =>
      el.addEventListener('click', () => this.toggleExportTag((el as HTMLElement).dataset['exportTag'] ?? '')),
    )
    ;(this.shadow.getElementById('file-input') as HTMLInputElement).addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        await this.importAllData(file);
        alert(this.t('CONFIG.IMPORT_SUCCESS'));
      } catch (err: unknown) {
        alert((err as Error).message ?? this.t('CONFIG.IMPORT_ERROR'));
      }
      const target = e.target as HTMLInputElement | null;
      if (target) target.value = '';
    });
  }
}

if (!customElements.get('e2e-configuration')) {
  customElements.define('e2e-configuration', ConfigurationElement);
}
