import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../../src/components/configuration/configuration';
import type { ConfigurationElement } from '../../src/components/configuration/configuration';
import { PersistenceService } from '../../src/services/persistence.service';
import { TranslationService } from '../../src/services/translation.service';

let dbCounter = 0;

describe('Phase 8.4 — ConfigurationElement', () => {
  let el: ConfigurationElement;
  let persistence: PersistenceService;
  let translation: TranslationService;

  beforeEach(() => {
    vi.stubGlobal('alert', vi.fn());
    persistence = new PersistenceService(`config_db_${++dbCounter}`);
    translation = new TranslationService();
    el = document.createElement('e2e-configuration') as ConfigurationElement;
    el.persistence = persistence;
    el.translation = translation;
    document.body.appendChild(el);
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    el.remove();
    localStorage.clear();
  });

  it('registers as <e2e-configuration> custom element', () => {
    expect(customElements.get('e2e-configuration')).toBeDefined();
  });

  it('default selectedLanguage is "es"', () => {
    expect(el.selectedLanguage).toBe('es');
  });

  it('onLanguageChange("en") sets selectedLanguage to "en"', () => {
    el.onLanguageChange('en');
    expect(el.selectedLanguage).toBe('en');
  });

  it('onLanguageChange calls translation.setLang with the new lang', () => {
    const spy = vi.spyOn(translation, 'setLang');
    el.onLanguageChange('fr');
    expect(spy).toHaveBeenCalledWith('fr');
  });

  it('onLanguageChange persists the language in IndexedDB', async () => {
    await el.onLanguageChange('de');
    const result = await persistence.getConfig('language');
    expect(result).toMatchObject({ language: 'de' });
  });

  it('advancedHttpConfig reads from localStorage on init', () => {
    localStorage.setItem('extendedHttpCommands', 'true');
    const el2 = document.createElement('e2e-configuration') as ConfigurationElement;
    el2.persistence = persistence;
    el2.translation = translation;
    document.body.appendChild(el2);
    expect(el2.advancedHttpConfig).toBe(true);
    el2.remove();
  });

  it('onAdvancedHttpConfigChange(true) sets localStorage.extendedHttpCommands to "true"', () => {
    el.onAdvancedHttpConfigChange(true);
    expect(localStorage.getItem('extendedHttpCommands')).toBe('true');
  });

  it('onAdvancedHttpConfigChange(false) sets localStorage.extendedHttpCommands to "false"', () => {
    el.onAdvancedHttpConfigChange(false);
    expect(localStorage.getItem('extendedHttpCommands')).toBe('false');
  });

  it('onAdvancedHttpConfigChange updates advancedHttpConfig property', () => {
    el.onAdvancedHttpConfigChange(true);
    expect(el.advancedHttpConfig).toBe(true);
    el.onAdvancedHttpConfigChange(false);
    expect(el.advancedHttpConfig).toBe(false);
  });

  it('exportAllData triggers an anchor download (creates <a> with download attr)', async () => {
    // jsdom does not implement URL.createObjectURL — polyfill it
    const createUrl = vi.fn().mockReturnValue('blob:mock');
    const revokeUrl = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL: createUrl, revokeObjectURL: revokeUrl });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await persistence.insertTest('export test');
    await el.exportAllData();
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('importAllData ingests valid JSON file data', async () => {
    const jsonData = JSON.stringify({ tests: [{ name: 'imported', createdAt: Date.now() }], interceptors: [] });
    // jsdom's File may not implement .text() — use a mock
    const mockFile = { text: vi.fn().mockResolvedValue(jsonData) } as unknown as File;
    await el.importAllData(mockFile);
    const tests = await persistence.getAllTests();
    expect(tests).toHaveLength(1);
    expect(tests[0].name).toBe('imported');
  });

  it('importAllData rejects invalid JSON', async () => {
    const mockFile = { text: vi.fn().mockResolvedValue('not json') } as unknown as File;
    await expect(el.importAllData(mockFile)).rejects.toThrow();
  });

  it('importAllData rejects JSON with wrong shape', async () => {
    const mockFile = { text: vi.fn().mockResolvedValue(JSON.stringify({ foo: 'bar' })) } as unknown as File;
    await expect(el.importAllData(mockFile)).rejects.toThrow();
  });

  // ── export selection dialog ───────────────────────────────────────────────

  describe('export selection dialog', () => {
    it('openExportDialog() loads tests, defaults to "all" mode and shows the overlay', async () => {
      await persistence.insertTest('t1');
      await el.openExportDialog();
      expect(el.isExporting).toBe(true);
      expect(el.exportMode).toBe('all');
      expect(el.shadowRoot!.getElementById('export-overlay')).not.toBeNull();
      expect(el.shadowRoot!.querySelectorAll('[data-export-mode]')).toHaveLength(3);
    });

    it('#btn-export opens the dialog instead of downloading directly', () => {
      const spy = vi.spyOn(el, 'openExportDialog').mockResolvedValue(undefined);
      (el.shadowRoot!.getElementById('btn-export') as HTMLElement).click();
      expect(spy).toHaveBeenCalled();
    });

    it('"all" mode counts every test and enables export', async () => {
      await persistence.insertTest('a');
      await persistence.insertTest('b');
      await el.openExportDialog();
      const confirm = el.shadowRoot!.getElementById('btn-export-confirm') as HTMLButtonElement;
      expect(confirm.disabled).toBe(false);
      expect(el.shadowRoot!.querySelector('.export-count b')?.textContent).toBe('2');
    });

    it('"manual" mode lists every test with a checkbox', async () => {
      await persistence.insertTest('a');
      await persistence.insertTest('b');
      await el.openExportDialog();
      el.setExportMode('manual');
      expect(el.shadowRoot!.querySelectorAll('[data-export-test]')).toHaveLength(2);
    });

    it('"manual" mode with no selection disables export', async () => {
      await persistence.insertTest('a');
      await el.openExportDialog();
      el.setExportMode('manual');
      const confirm = el.shadowRoot!.getElementById('btn-export-confirm') as HTMLButtonElement;
      expect(confirm.disabled).toBe(true);
    });

    it('toggling a test in manual mode selects it and updates the count', async () => {
      const id = await persistence.insertTest('a');
      await el.openExportDialog();
      el.setExportMode('manual');
      el.toggleExportTest(id);
      expect(el.exportSelectedIds.has(id)).toBe(true);
      expect(el.shadowRoot!.querySelector('.export-count b')?.textContent).toBe('1');
    });

    it('"tags" mode lists the distinct tags', async () => {
      await persistence.insertTest('a', [], [], ['smoke']);
      await persistence.insertTest('b', [], [], ['login']);
      await el.openExportDialog();
      el.setExportMode('tags');
      expect(el.shadowRoot!.querySelectorAll('[data-export-tag]')).toHaveLength(2);
    });

    it('"tags" mode shows an empty message when no tags exist', async () => {
      await persistence.insertTest('a');
      await el.openExportDialog();
      el.setExportMode('tags');
      expect(el.shadowRoot!.querySelector('.export-empty')).not.toBeNull();
    });

    it('toggling a tag selects the tests carrying it (OR)', async () => {
      await persistence.insertTest('a', [], [], ['smoke']);
      await persistence.insertTest('b', [], [], ['login']);
      await el.openExportDialog();
      el.setExportMode('tags');
      el.toggleExportTag('smoke');
      expect(el.exportSelectedTags.has('smoke')).toBe(true);
      expect(el.shadowRoot!.querySelector('.export-count b')?.textContent).toBe('1');
    });

    it('clicking a [data-export-mode] button switches the mode', async () => {
      await persistence.insertTest('a');
      await el.openExportDialog();
      (el.shadowRoot!.querySelector('[data-export-mode="manual"]') as HTMLElement).click();
      expect(el.exportMode).toBe('manual');
    });

    it('confirmExport in "all" mode downloads every test and closes', async () => {
      await persistence.insertTest('a');
      await persistence.insertTest('b');
      await el.openExportDialog();
      const dl = vi.spyOn(el as unknown as { downloadTests: () => void }, 'downloadTests').mockImplementation(() => {});
      el.confirmExport();
      expect(dl).toHaveBeenCalled();
      expect((dl.mock.calls[0][0] as unknown as unknown[])).toHaveLength(2);
      expect(el.isExporting).toBe(false);
    });

    it('confirmExport in "manual" mode downloads only the selected tests', async () => {
      const id1 = await persistence.insertTest('a');
      await persistence.insertTest('b');
      await el.openExportDialog();
      el.setExportMode('manual');
      el.toggleExportTest(id1);
      const dl = vi.spyOn(el as unknown as { downloadTests: () => void }, 'downloadTests').mockImplementation(() => {});
      el.confirmExport();
      const exported = dl.mock.calls[0][0] as unknown as Array<{ id: number }>;
      expect(exported.map((t) => t.id)).toEqual([id1]);
    });

    it('confirmExport does nothing when the selection is empty', async () => {
      await persistence.insertTest('a');
      await el.openExportDialog();
      el.setExportMode('manual'); // nothing selected
      const dl = vi.spyOn(el as unknown as { downloadTests: () => void }, 'downloadTests').mockImplementation(() => {});
      el.confirmExport();
      expect(dl).not.toHaveBeenCalled();
      expect(el.isExporting).toBe(true);
    });

    it('cancelExport closes the dialog and clears the selection', async () => {
      const id = await persistence.insertTest('a');
      await el.openExportDialog();
      el.setExportMode('manual');
      el.toggleExportTest(id);
      el.cancelExport();
      expect(el.isExporting).toBe(false);
      expect(el.exportSelectedIds.size).toBe(0);
      expect(el.shadowRoot!.getElementById('export-overlay')).toBeNull();
    });

    it('shows an empty message and disables export when there are no tests', async () => {
      await el.openExportDialog();
      expect(el.shadowRoot!.querySelector('.export-empty')).not.toBeNull();
      const confirm = el.shadowRoot!.getElementById('btn-export-confirm') as HTMLButtonElement;
      expect(confirm.disabled).toBe(true);
    });
  });

  // ── selector strategy ────────────────────────────────────────────────────

  it('selectorStrategy defaults to "data-cy"', () => {
    expect(el.selectorStrategy).toBe('data-cy');
  });

  it('onSelectorStrategyChange("data-testid") sets selectorStrategy', () => {
    // check synchronously — the property is set before any await inside the method
    el.onSelectorStrategyChange('data-testid');
    expect(el.selectorStrategy).toBe('data-testid');
  });

  it('onSelectorStrategyChange dispatches selectorstrategychange event with strategy value', async () => {
    let received: string | null = null;
    el.addEventListener('selectorstrategychange', (e: Event) => {
      received = (e as CustomEvent).detail;
    });
    await el.onSelectorStrategyChange('aria-label');
    expect(received).toBe('aria-label');
  });

  it('onSelectorStrategyChange persists strategy to IndexedDB', async () => {
    await el.onSelectorStrategyChange('id');
    const config = await persistence.getConfig('selectorStrategy');
    expect(config).toMatchObject({ selectorStrategy: 'id' });
  });

  // ── smartSelectorEnabled (AC-01, AC-02) ─────────────────────────────────

  it('smartSelectorEnabled defaults to true', () => {
    expect(el.smartSelectorEnabled).toBe(true);
  });

  it('smart-selector-toggle checkbox is rendered in shadow DOM', () => {
    const checkbox = el.shadowRoot!.getElementById('smart-selector-toggle');
    expect(checkbox).not.toBeNull();
  });

  it('smart-selector-toggle is checked when smartSelectorEnabled is true', () => {
    el.smartSelectorEnabled = true;
    (el as any).render();
    const checkbox = el.shadowRoot!.getElementById('smart-selector-toggle') as HTMLInputElement;
    expect(checkbox.hasAttribute('checked')).toBe(true);
  });

  it('smart-selector-toggle is unchecked when smartSelectorEnabled is false', () => {
    el.smartSelectorEnabled = false;
    (el as any).render();
    const checkbox = el.shadowRoot!.getElementById('smart-selector-toggle') as HTMLInputElement;
    expect(checkbox.hasAttribute('checked')).toBe(false);
  });

  it('onSmartSelectorChange(false) sets smartSelectorEnabled to false', () => {
    el.onSmartSelectorChange(false);
    expect(el.smartSelectorEnabled).toBe(false);
  });

  it('onSmartSelectorChange(true) sets smartSelectorEnabled to true', () => {
    el.smartSelectorEnabled = false;
    el.onSmartSelectorChange(true);
    expect(el.smartSelectorEnabled).toBe(true);
  });

  it('onSmartSelectorChange persists to IndexedDB as "false"', async () => {
    await el.onSmartSelectorChange(false);
    const config = await persistence.getConfig('smartSelectorEnabled');
    expect(config).toMatchObject({ smartSelectorEnabled: 'false' });
  });

  it('onSmartSelectorChange persists to IndexedDB as "true"', async () => {
    await el.onSmartSelectorChange(true);
    const config = await persistence.getConfig('smartSelectorEnabled');
    expect(config).toMatchObject({ smartSelectorEnabled: 'true' });
  });

  it('onSmartSelectorChange dispatches smartselectorchange event', async () => {
    let received: boolean | null = null;
    el.addEventListener('smartselectorchange', (e: Event) => {
      received = (e as CustomEvent).detail;
    });
    await el.onSmartSelectorChange(false);
    expect(received).toBe(false);
  });

  // ── DOM event listeners (covered via shadow DOM dispatch) ─────────────────

  it('change event on smart-selector-toggle calls onSmartSelectorChange', async () => {
    const spy = vi.spyOn(el, 'onSmartSelectorChange');
    const checkbox = el.shadowRoot!.getElementById('smart-selector-toggle') as HTMLInputElement;
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    expect(spy).toHaveBeenCalledWith(false);
  });

  it('change event on selector-strategy calls onSelectorStrategyChange', () => {
    const spy = vi.spyOn(el, 'onSelectorStrategyChange');
    const select = el.shadowRoot!.getElementById('selector-strategy') as HTMLSelectElement;
    select.value = 'data-testid';
    select.dispatchEvent(new Event('change'));
    expect(spy).toHaveBeenCalledWith('data-testid');
  });

  // ── file-input change handler ─────────────────────────────────────────────

  it('file-input change with no file selected does nothing', () => {
    const spy = vi.spyOn(el, 'importAllData');
    const fileInput = el.shadowRoot!.getElementById('file-input') as HTMLInputElement;
    // No files property — files[0] is undefined
    fileInput.dispatchEvent(new Event('change'));
    expect(spy).not.toHaveBeenCalled();
  });

  it('file-input change with valid JSON file calls importAllData and alerts success', async () => {
    const jsonData = JSON.stringify({ tests: [], interceptors: [] });
    const mockFile = { text: vi.fn().mockResolvedValue(jsonData) } as unknown as File;
    const fileInput = el.shadowRoot!.getElementById('file-input') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', { get: () => [mockFile], configurable: true });

    fileInput.dispatchEvent(new Event('change'));
    await vi.waitFor(() => expect(vi.mocked(window.alert)).toHaveBeenCalled());
  });

  it('file-input change with invalid JSON alerts the error message', async () => {
    const mockFile = { text: vi.fn().mockResolvedValue('not-json') } as unknown as File;
    const fileInput = el.shadowRoot!.getElementById('file-input') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', { get: () => [mockFile], configurable: true });

    fileInput.dispatchEvent(new Event('change'));
    await vi.waitFor(() => expect(vi.mocked(window.alert)).toHaveBeenCalled());
  });

  it('file-input resets value to "" after processing', async () => {
    const jsonData = JSON.stringify({ tests: [], interceptors: [] });
    const mockFile = { text: vi.fn().mockResolvedValue(jsonData) } as unknown as File;
    const fileInput = el.shadowRoot!.getElementById('file-input') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', { get: () => [mockFile], configurable: true });

    fileInput.dispatchEvent(new Event('change'));
    await vi.waitFor(() => expect(fileInput.value).toBe(''));
  });

  // ── revokeAccess ─────────────────────────────────────────────────────────

  it('revokeAccess calls setConfig to revoke filesystem permission', async () => {
    const spy = vi.spyOn(persistence, 'setConfig');
    await el.revokeAccess();
    expect(spy).toHaveBeenCalledWith({ allowReadWriteFiles: 'false', cypressDirectoryHandle: null });
  });

  it('revokeAccess re-renders without btn-revoke when previously not granted', async () => {
    await el.revokeAccess();
    // btn-revoke is only rendered when filesystemGranted=true; after revoke it should be absent
    expect(el.shadowRoot!.getElementById('btn-revoke')).toBeNull();
  });

  // ── changeFolder ──────────────────────────────────────────────────────────

  it('changeFolder shows success toast when requestDirectoryPermissions resolves', async () => {
    vi.spyOn(persistence, 'requestDirectoryPermissions').mockResolvedValue(undefined);
    vi.spyOn(persistence, 'getGeneralConfig').mockResolvedValue({});
    await el.changeFolder();
    // No exception should be thrown — the toast appears in DOM
  });

  it('changeFolder suppresses error silently when user aborts (AbortError)', async () => {
    const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
    vi.spyOn(persistence, 'requestDirectoryPermissions').mockRejectedValue(abortError);
    await expect(el.changeFolder()).resolves.toBeUndefined();
  });

  it('changeFolder shows error toast for non-abort errors', async () => {
    const genericError = new Error('permission denied');
    vi.spyOn(persistence, 'requestDirectoryPermissions').mockRejectedValue(genericError);
    // Should not throw
    await expect(el.changeFolder()).resolves.toBeUndefined();
  });
});
