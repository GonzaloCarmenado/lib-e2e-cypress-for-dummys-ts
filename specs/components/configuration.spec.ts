import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../../src/components/configuration';
import type { ConfigurationElement } from '../../src/components/configuration';
import { PersistenceService } from '../../src/services/persistence.service';
import { TranslationService } from '../../src/services/translation.service';

let dbCounter = 0;

describe('Phase 8.4 — ConfigurationElement', () => {
  let el: ConfigurationElement;
  let persistence: PersistenceService;
  let translation: TranslationService;

  beforeEach(() => {
    persistence = new PersistenceService(`config_db_${++dbCounter}`);
    translation = new TranslationService();
    el = document.createElement('e2e-configuration') as ConfigurationElement;
    el.persistence = persistence;
    el.translation = translation;
    document.body.appendChild(el);
    localStorage.clear();
  });

  afterEach(() => {
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
});
