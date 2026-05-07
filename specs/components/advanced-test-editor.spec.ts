import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../../src/components/advanced-test-editor/advanced-test-editor';
import type { AdvancedTestEditorElement } from '../../src/components/advanced-test-editor/advanced-test-editor';
import { PersistenceService } from '../../src/services/persistence.service';
import { TranslationService } from '../../src/services/translation.service';

let dbCounter = 0;

describe('Phase 8.5 — AdvancedTestEditorElement', () => {
  let el: AdvancedTestEditorElement;
  let persistence: PersistenceService;
  let translation: TranslationService;

  beforeEach(() => {
    persistence = new PersistenceService(`adv_editor_db_${++dbCounter}`);
    translation = new TranslationService();
    el = document.createElement('advanced-test-editor') as AdvancedTestEditorElement;
    el.persistence = persistence;
    el.translation = translation;
    document.body.appendChild(el);
  });

  afterEach(() => {
    el.remove();
  });

  it('registers as <advanced-test-editor> custom element', () => {
    expect(customElements.get('advanced-test-editor')).toBeDefined();
  });

  it('initial e2eTree is an empty array', () => {
    expect(el.e2eTree).toEqual([]);
  });

  it('initial selectedFileContent is null', () => {
    expect(el.selectedFileContent).toBeNull();
  });

  it('getFoldersData() does nothing when no allowReadWriteFiles permission', async () => {
    await el.getFoldersData();
    expect(el.e2eTree).toEqual([]);
  });

  it('saveCommandsToFile() does nothing when selectedFileHandle is null', async () => {
    el.testItBlock = "it('test', () => {});";
    await expect(el.saveCommandsToFile()).resolves.toBeUndefined();
  });

  it('saveCommandsToFile() does nothing when testItBlock is empty', async () => {
    const mockHandle = {
      createWritable: vi.fn().mockResolvedValue({ write: vi.fn(), close: vi.fn() }),
    } as unknown as FileSystemFileHandle;
    el.selectedFileHandle = mockHandle;
    el.selectedFileContent = 'describe("test", () => { });';
    el.testItBlock = '';
    await el.saveCommandsToFile();
    expect(mockHandle.createWritable).not.toHaveBeenCalled();
  });

  it('onFileClick does nothing for a non-file entry', async () => {
    const entry = { kind: 'directory', name: 'myfolder' };
    await el.onFileClick(entry);
    expect(el.selectedFileContent).toBeNull();
  });

  it('markFileAsSelected sets selectedFile', () => {
    const file = { kind: 'file', name: 'test.cy.ts' };
    el.markFileAsSelected(file);
    expect(el.selectedFile).toBe(file);
  });

  it('loads cypress commands when testId is provided', async () => {
    const id = await persistence.insertTest('loaded test', ["cy.visit('/')"], ["cy.intercept('GET', '**/api')"]);
    el.testId = id;
    await el.loadCypressCommandsForTest(id);
    expect(el.testItBlock).toContain("it('loaded test'");
  });

  it('closePreview() resets preview state', () => {
    el.isPreviewMode = true;
    el.previewFileName = 'test.cy.ts';
    el.closePreview();
    expect(el.isPreviewMode).toBe(false);
    expect(el.previewFileName).toBeNull();
  });

  it('dispatches "closemodal" event when closePreview is called with testId set', () => {
    let fired = false;
    el.addEventListener('closemodal', () => { fired = true; });
    el.testId = 999;
    el.closePreview();
    expect(fired).toBe(true);
  });

  it('openEditManually() does nothing when no file is selected', () => {
    let fired = false;
    el.addEventListener('openfileeditor', () => { fired = true; });
    el.openEditManually();
    expect(fired).toBe(false);
  });

  it('openEditManually() does nothing when selectedFileContent is null', () => {
    el.selectedFileHandle = {} as FileSystemFileHandle;
    el.selectedFileContent = null;
    let fired = false;
    el.addEventListener('openfileeditor', () => { fired = true; });
    el.openEditManually();
    expect(fired).toBe(false);
  });

  it('openEditManually() dispatches openfileeditor with correct detail', () => {
    const mockHandle = {} as FileSystemFileHandle;
    el.selectedFileHandle = mockHandle;
    el.selectedFileContent = 'describe("suite", () => {});';
    el.selectedFile = { kind: 'file', name: 'login.cy.ts' };
    el.saveButtonEnabled = true;
    el.testId = 42;

    let detail: any = null;
    el.addEventListener('openfileeditor', (e) => { detail = (e as CustomEvent).detail; });
    el.openEditManually();

    expect(detail).toMatchObject({
      handle: mockHandle,
      content: 'describe("suite", () => {});',
      fileName: 'login.cy.ts',
      testId: 42,
    });
  });

  it('copyToClipboard() calls navigator.clipboard.writeText', () => {
    const writeMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeMock },
      configurable: true,
    });
    el.copyToClipboard('cy.visit("/")');
    expect(writeMock).toHaveBeenCalledWith('cy.visit("/")');
  });

  it('copyToClipboard() does not throw when clipboard is unavailable', () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    expect(() => el.copyToClipboard('text')).not.toThrow();
  });

  it('copy-it button appears when testItBlock is set', async () => {
    const id = await persistence.insertTest('copy test', ["cy.visit('/')"], []);
    await el.loadCypressCommandsForTest(id);
    // init() resets hasPermission async; force the full UI after all async work
    (el as any).hasPermission = true;
    (el as any).render();
    expect(el.shadowRoot!.querySelector('#btn-copy-it')).not.toBeNull();
  });

  it('copy-interceptors button appears when interceptorsBlock is set', async () => {
    const id = await persistence.insertTest('icp test', ["cy.visit('/')"], ["cy.intercept('GET', '**/api')"]);
    await el.loadCypressCommandsForTest(id);
    (el as any).hasPermission = true;
    (el as any).render();
    expect(el.shadowRoot!.querySelector('#btn-copy-interceptors')).not.toBeNull();
  });

  it('copy-interceptors button is absent when there are no interceptors', async () => {
    const id = await persistence.insertTest('no icp', ["cy.visit('/')"], []);
    await el.loadCypressCommandsForTest(id);
    (el as any).hasPermission = true;
    (el as any).render();
    expect(el.shadowRoot!.querySelector('#btn-copy-interceptors')).toBeNull();
  });

  it('openEditManually() uses empty string for fileName when selectedFile has no name', () => {
    el.selectedFileHandle = {} as FileSystemFileHandle;
    el.selectedFileContent = 'content';
    el.selectedFile = null;
    let detail: any = null;
    el.addEventListener('openfileeditor', (e) => { detail = (e as CustomEvent).detail; });
    el.openEditManually();
    expect(detail.fileName).toBe('');
  });
});
