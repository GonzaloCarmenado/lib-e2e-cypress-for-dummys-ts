import { PersistenceService } from '../../services/persistence.service';
import type { TestWithDetails } from '../../services/persistence.service';
import { TranslationService } from '../../services/translation.service';
import type { Lang } from '../../models/lang.model';
import type { SelectorStrategy } from '../../services/recording.service';
import { RESUME_TTL_CONFIG_KEY, DEFAULT_RESUME_TTL_MINUTES } from '../../models/active-session.model';
import { DEFAULT_ISSUE_TRACKER_CONFIG, type IssueTrackerConfig, type IssueTrackerProvider } from '../../models/issue-tracker.model';
import type { LoginSetupConfig } from '../../models/login-setup.model';
import { extractExportedFunctions, buildLoginScaffold } from '../../utils/login-setup.utils';
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
  fixtureMode = false;
  selectorStrategy: SelectorStrategy = 'data-cy';
  smartSelectorEnabled = true;
  startHidden = false;
  resumeTtlMinutes = DEFAULT_RESUME_TTL_MINUTES;
  isExporting = false;
  exportMode: ExportMode = 'all';
  exportTests: TestWithDetails[] = [];
  exportSelectedIds: Set<number> = new Set();
  exportSelectedTags: Set<string> = new Set();
  issueTrackerConfig: IssueTrackerConfig = { ...DEFAULT_ISSUE_TRACKER_CONFIG };
  isLoginSetupOpen = false;
  loginSetupConfig: LoginSetupConfig | null = null;
  loginSetupDraftPath = '';
  loginSetupDraftFunctions: string[] = [];
  loginSetupDraftBeforeFn: string | null = null;
  loginSetupDraftBeforeEachFn: string | null = null;
  loginSetupDraftHasContent = false;
  private loginSetupDraftHandle: FileSystemFileHandle | null = null;
  private loginSetupDraftContent = '';
  private filesystemGranted = false;
  private cypressFolderName: string | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.advancedHttpConfig = localStorage.getItem('extendedHttpCommands') === 'true';
    this.fixtureMode = localStorage.getItem('fixtureMode') === 'true';
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
    this.fixtureMode = localStorage.getItem('fixtureMode') === 'true';
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
    this.issueTrackerConfig = {
      enabled:  config?.['issueTrackerEnabled']  === 'true',
      provider: (config?.['issueTrackerProvider'] as IssueTrackerProvider) ?? DEFAULT_ISSUE_TRACKER_CONFIG.provider,
      baseUrl:  (config?.['issueTrackerBaseUrl']  as string) ?? '',
    };
    this.loginSetupConfig = await this.persistence.getLoginSetup();
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

  onFixtureModeChange(checked: boolean): void {
    this.fixtureMode = checked;
    localStorage.setItem('fixtureMode', checked ? 'true' : 'false');
    this.persistence.setConfig({ fixtureMode: checked ? 'true' : 'false' });
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

  onResetWidgetPosition(): void {
    this.dispatchEvent(new CustomEvent('resetwidgetposition', { bubbles: true, composed: true }));
    showToast(this.t('CONFIG.WIDGET_POSITION_RESET_DONE'));
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

  async onIssueTrackerEnabledChange(enabled: boolean): Promise<void> {
    this.issueTrackerConfig = { ...this.issueTrackerConfig, enabled };
    await this.persistence.setConfig({ issueTrackerEnabled: enabled ? 'true' : 'false' });
    this.dispatchEvent(new CustomEvent('issuetrackerchange', { detail: { ...this.issueTrackerConfig }, bubbles: true, composed: true }));
    this.render();
  }

  async onIssueTrackerProviderChange(provider: IssueTrackerProvider): Promise<void> {
    this.issueTrackerConfig = { ...this.issueTrackerConfig, provider };
    await this.persistence.setConfig({ issueTrackerProvider: provider });
    this.dispatchEvent(new CustomEvent('issuetrackerchange', { detail: { ...this.issueTrackerConfig }, bubbles: true, composed: true }));
    this.render();
  }

  async onIssueTrackerBaseUrlChange(baseUrl: string): Promise<void> {
    this.issueTrackerConfig = { ...this.issueTrackerConfig, baseUrl };
    await this.persistence.setConfig({ issueTrackerBaseUrl: baseUrl });
    this.dispatchEvent(new CustomEvent('issuetrackerchange', { detail: { ...this.issueTrackerConfig }, bubbles: true, composed: true }));
  }

  openLoginSetupPanel(): void {
    this.isLoginSetupOpen = true;
    const cfg = this.loginSetupConfig;
    this.loginSetupDraftHandle = null;
    this.loginSetupDraftContent = cfg?.fileContent ?? '';
    this.loginSetupDraftPath = cfg?.filePath ?? '';
    this.loginSetupDraftFunctions = cfg?.detectedFunctions ?? [];
    this.loginSetupDraftBeforeFn = cfg?.beforeFn ?? null;
    this.loginSetupDraftBeforeEachFn = cfg?.beforeEachFn ?? null;
    this.loginSetupDraftHasContent = !!(cfg?.fileContent);
    this.render();
  }

  closeLoginSetupPanel(): void {
    this.isLoginSetupOpen = false;
    this.render();
  }

  async saveLoginSetupConfig(config: LoginSetupConfig): Promise<void> {
    await this.persistence.saveLoginSetup(config);
    this.loginSetupConfig = config;
    this.isLoginSetupOpen = false;
    this.render();
  }

  async clearLoginSetupConfig(): Promise<void> {
    await this.persistence.clearLoginSetup();
    this.loginSetupConfig = null;
    this.render();
  }

  async loginSetupPickFile(): Promise<void> {
    type OpenPicker = (opts: object) => Promise<FileSystemFileHandle[]>;
    const currentPath = (this.shadow.getElementById('login-setup-filepath') as HTMLInputElement | null)?.value.trim() ?? '';
    try {
      const [handle] = await (window as unknown as { showOpenFilePicker: OpenPicker }).showOpenFilePicker({
        types: [{ description: 'TypeScript files', accept: { 'text/plain': ['.ts'] } }],
        multiple: false,
      });
      this.loginSetupDraftHandle = handle;
      const file = await handle.getFile();
      this.loginSetupDraftContent = await file.text();
      this.loginSetupDraftHasContent = true;
      this.loginSetupDraftPath = currentPath || `cypress/common-services/${handle.name}`;
      this.loginSetupDraftFunctions = extractExportedFunctions(this.loginSetupDraftContent);
      this.render();
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') showToast(this.t('CONFIG.FOLDER_ERROR_TOAST'), false);
    }
  }

  async loginSetupCreateScaffold(): Promise<void> {
    type SavePicker = (opts: object) => Promise<FileSystemFileHandle>;
    const currentPath = (this.shadow.getElementById('login-setup-filepath') as HTMLInputElement | null)?.value.trim() ?? '';
    try {
      const handle = await (window as unknown as { showSaveFilePicker: SavePicker }).showSaveFilePicker({
        suggestedName: 'login.service.ts',
        types: [{ description: 'TypeScript files', accept: { 'text/plain': ['.ts'] } }],
      });
      const content = buildLoginScaffold();
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      this.loginSetupDraftHandle = handle;
      this.loginSetupDraftContent = content;
      this.loginSetupDraftHasContent = true;
      this.loginSetupDraftPath = currentPath || `cypress/common-services/${handle.name}`;
      this.loginSetupDraftFunctions = extractExportedFunctions(content);
      this.render();
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') showToast(this.t('CONFIG.FOLDER_ERROR_TOAST'), false);
    }
  }

  async loginSetupRescan(): Promise<void> {
    const currentPath = (this.shadow.getElementById('login-setup-filepath') as HTMLInputElement | null)?.value.trim();
    if (currentPath !== undefined) this.loginSetupDraftPath = currentPath;
    try {
      if (this.loginSetupDraftHandle) {
        const file = await this.loginSetupDraftHandle.getFile();
        this.loginSetupDraftContent = await file.text();
      }
      this.loginSetupDraftFunctions = extractExportedFunctions(this.loginSetupDraftContent);
      this.render();
    } catch { /* silently ignore */ }
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
      fixtureMode: this.fixtureMode,
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
      issueTrackerConfig: this.issueTrackerConfig,
      isLoginSetupOpen: this.isLoginSetupOpen,
      loginSetupConfig: this.loginSetupConfig,
      loginSetupDraftPath: this.loginSetupDraftPath,
      loginSetupDraftFunctions: this.loginSetupDraftFunctions,
      loginSetupDraftBeforeFn: this.loginSetupDraftBeforeFn,
      loginSetupDraftBeforeEachFn: this.loginSetupDraftBeforeEachFn,
      loginSetupDraftHasContent: this.loginSetupDraftHasContent,
    }, this.t.bind(this))}`;
    ;(this.shadow.getElementById('lang-select') as HTMLSelectElement).addEventListener('change', (e) =>
      this.onLanguageChange((e.target as HTMLSelectElement).value),
    )
    ;(this.shadow.getElementById('http-toggle') as HTMLInputElement).addEventListener('change', (e) =>
      this.onAdvancedHttpConfigChange((e.target as HTMLInputElement).checked),
    )
    ;(this.shadow.getElementById('fixture-toggle') as HTMLInputElement).addEventListener('change', (e) =>
      this.onFixtureModeChange((e.target as HTMLInputElement).checked),
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
    ;this.shadow.getElementById('btn-reset-position')?.addEventListener('click', () => this.onResetWidgetPosition())
    ;(this.shadow.getElementById('selector-strategy') as HTMLSelectElement).addEventListener('change', (e) =>
      this.onSelectorStrategyChange((e.target as HTMLSelectElement).value as SelectorStrategy),
    );

    ;(this.shadow.getElementById('issue-tracker-toggle') as HTMLInputElement)?.addEventListener('change', (e) =>
      this.onIssueTrackerEnabledChange((e.target as HTMLInputElement).checked),
    )
    ;(this.shadow.getElementById('issue-tracker-provider') as HTMLSelectElement)?.addEventListener('change', (e) =>
      this.onIssueTrackerProviderChange((e.target as HTMLSelectElement).value as IssueTrackerProvider),
    )
    ;(this.shadow.getElementById('issue-tracker-base-url') as HTMLInputElement)?.addEventListener('change', (e) =>
      this.onIssueTrackerBaseUrlChange((e.target as HTMLInputElement).value),
    )
    ;this.shadow.getElementById('btn-change-folder')?.addEventListener('click', () => this.changeFolder());
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
    );
    this.shadow.getElementById('btn-open-login-setup')?.addEventListener('click', () => this.openLoginSetupPanel());
    this.shadow.getElementById('btn-login-setup-cancel')?.addEventListener('click', () => this.closeLoginSetupPanel());
    this.shadow.getElementById('btn-login-setup-pick-file')?.addEventListener('click', () => this.loginSetupPickFile());
    this.shadow.getElementById('btn-login-setup-create-scaffold')?.addEventListener('click', () => this.loginSetupCreateScaffold());
    this.shadow.getElementById('btn-login-setup-rescan')?.addEventListener('click', () => this.loginSetupRescan());
    this.shadow.getElementById('btn-login-setup-clear')?.addEventListener('click', () => this.clearLoginSetupConfig());
    this.shadow.getElementById('btn-login-setup-save')?.addEventListener('click', async () => {
      const pathEl        = this.shadow.getElementById('login-setup-filepath')     as HTMLInputElement  | null;
      const beforeEl      = this.shadow.getElementById('login-setup-before-fn')    as HTMLSelectElement | null;
      const beforeEachEl  = this.shadow.getElementById('login-setup-before-each-fn') as HTMLSelectElement | null;
      await this.saveLoginSetupConfig({
        enabled: true,
        filePath:          pathEl?.value.trim()   ?? this.loginSetupDraftPath,
        fileContent:       this.loginSetupDraftContent,
        detectedFunctions: this.loginSetupDraftFunctions,
        beforeFn:          beforeEl?.value        || null,
        beforeEachFn:      beforeEachEl?.value    || null,
      });
    });

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

if (!customElements.get('lib-e2e-configuration')) {
  customElements.define('lib-e2e-configuration', ConfigurationElement);
}
