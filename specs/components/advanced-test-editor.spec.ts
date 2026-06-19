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
    el.testNotes = 'Validates the login flow.';

    let detail: any = null;
    el.addEventListener('openfileeditor', (e) => { detail = (e as CustomEvent).detail; });
    el.openEditManually();

    expect(detail).toMatchObject({
      handle: mockHandle,
      content: 'describe("suite", () => {});',
      fileName: 'login.cy.ts',
      testId: 42,
      notes: 'Validates the login flow.',
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

  // ── btn-reauth click handler ──────────────────────────────────────────────

  describe('btn-reauth click handler', () => {
    it('does nothing when _dirHandle is null', async () => {
      (el as any).hasPermission = false;
      (el as any).needsReauth = true;
      (el as any)._dirHandle = null;
      (el as any).render();

      const btn = el.shadowRoot!.getElementById('btn-reauth') as HTMLElement;
      expect(btn).not.toBeNull();
      btn.click();
      await Promise.resolve();

      expect((el as any).hasPermission).toBe(false);
    });

    it('sets hasPermission to true when requestPermission returns granted', async () => {
      const mockDirHandle = {
        requestPermission: vi.fn().mockResolvedValue('granted'),
      };
      vi.spyOn(el, 'getFoldersData').mockResolvedValue(undefined);

      (el as any).hasPermission = false;
      (el as any).needsReauth = true;
      (el as any)._dirHandle = mockDirHandle;
      (el as any).render();

      const btn = el.shadowRoot!.getElementById('btn-reauth') as HTMLElement;
      btn.click();
      await Promise.resolve();
      await Promise.resolve();

      expect((el as any).hasPermission).toBe(true);
      expect((el as any).needsReauth).toBe(false);
    });

    it('does not change hasPermission when requestPermission is denied', async () => {
      const mockDirHandle = {
        requestPermission: vi.fn().mockResolvedValue('denied'),
      };

      (el as any).hasPermission = false;
      (el as any).needsReauth = true;
      (el as any)._dirHandle = mockDirHandle;
      (el as any).render();

      const btn = el.shadowRoot!.getElementById('btn-reauth') as HTMLElement;
      btn.click();
      await Promise.resolve();
      await Promise.resolve();

      expect((el as any).hasPermission).toBe(false);
    });
  });

  // ── saveCommandsToFile ────────────────────────────────────────────────────

  describe('saveCommandsToFile', () => {
    it('writes content with beforeEach when interceptorsBlock is set', async () => {
      const writeMock = vi.fn();
      const closeMock = vi.fn();
      const mockHandle = {
        createWritable: vi.fn().mockResolvedValue({ write: writeMock, close: closeMock }),
      } as unknown as FileSystemFileHandle;

      el.selectedFileHandle = mockHandle;
      el.selectedFileContent = "describe('suite', () => {\n});";
      el.testItBlock = "it('my test', () => { cy.visit('/'); });";
      el.interceptorsBlock = "  cy.intercept('GET', '**/api').as('api');\n";

      await el.saveCommandsToFile();

      expect(writeMock).toHaveBeenCalled();
      const written = writeMock.mock.calls[0][0] as string;
      expect(written).toContain('beforeEach');
      expect(written).toContain('my test');
    });

    it('dispatches closemodal event on success', async () => {
      const mockHandle = {
        createWritable: vi.fn().mockResolvedValue({ write: vi.fn(), close: vi.fn() }),
      } as unknown as FileSystemFileHandle;

      el.selectedFileHandle = mockHandle;
      el.selectedFileContent = "describe('suite', () => {\n});";
      el.testItBlock = "it('test', () => {});";
      el.interceptorsBlock = '';

      let fired = false;
      el.addEventListener('closemodal', () => { fired = true; });

      await el.saveCommandsToFile();

      expect(fired).toBe(true);
    });

    it('does nothing when insertItBlock returns empty (content has no closing brace)', async () => {
      const mockHandle = { createWritable: vi.fn() } as unknown as FileSystemFileHandle;

      el.selectedFileHandle = mockHandle;
      el.selectedFileContent = 'no closing brace here';
      el.testItBlock = "it('test', () => {});";

      await el.saveCommandsToFile();

      expect(mockHandle.createWritable).not.toHaveBeenCalled();
    });
  });

  // ── onFileClick partial paths ─────────────────────────────────────────────

  describe('onFileClick', () => {
    it('sets saveButtonEnabled to true when entry is a file (no _dirHandle)', async () => {
      const file = { kind: 'file', name: 'login.cy.ts' };
      await el.onFileClick(file);
      expect(el.saveButtonEnabled).toBe(true);
    });

    it('leaves selectedFileContent null when _dirHandle is null', async () => {
      const file = { kind: 'file', name: 'login.cy.ts' };
      await el.onFileClick(file);
      expect(el.selectedFileContent).toBeNull();
    });
  });

  // ── loadCypressCommandsForTest edge cases ─────────────────────────────────

  it('loadCypressCommandsForTest sets empty strings when test does not exist', async () => {
    el.testItBlock = 'something';
    el.interceptorsBlock = 'something';
    await el.loadCypressCommandsForTest(99999);
    expect(el.testItBlock).toBe('');
    expect(el.interceptorsBlock).toBe('');
  });

  // ── createNewFolder ───────────────────────────────────────────────────────

  describe('createNewFile', () => {
    it('does nothing when _e2eHandle is null', async () => {
      (el as any)._e2eHandle = null;
      await expect(el.createNewFile('whatever')).resolves.toBeUndefined();
    });

    it('does nothing when the name is empty', async () => {
      const getFileHandle = vi.fn();
      (el as any)._e2eHandle = { getFileHandle };
      await el.createNewFile('   ');
      expect(getFileHandle).not.toHaveBeenCalled();
    });

    it('creates a <name>.cy.ts file with a describe/it scaffold', async () => {
      const write = vi.fn();
      const close = vi.fn();
      const getFileHandle = vi.fn().mockResolvedValue({ createWritable: vi.fn().mockResolvedValue({ write, close }) });
      (el as any)._e2eHandle = { getFileHandle };
      vi.spyOn(el, 'getFoldersData').mockResolvedValue(undefined);
      await el.createNewFile('login');
      expect(getFileHandle).toHaveBeenCalledWith('login.cy.ts', { create: true });
      const written = write.mock.calls[0][0] as string;
      expect(written).toContain("describe('login'");
      expect(written).toContain("it('should '");
    });

    it('strips a trailing .cy.ts from the typed name', async () => {
      const getFileHandle = vi.fn().mockResolvedValue({ createWritable: vi.fn().mockResolvedValue({ write: vi.fn(), close: vi.fn() }) });
      (el as any)._e2eHandle = { getFileHandle };
      vi.spyOn(el, 'getFoldersData').mockResolvedValue(undefined);
      await el.createNewFile('login.cy.ts');
      expect(getFileHandle).toHaveBeenCalledWith('login.cy.ts', { create: true });
    });

    it('refreshes the tree and resets isCreatingFile after creating', async () => {
      const getFileHandle = vi.fn().mockResolvedValue({ createWritable: vi.fn().mockResolvedValue({ write: vi.fn(), close: vi.fn() }) });
      (el as any)._e2eHandle = { getFileHandle };
      const refresh = vi.spyOn(el, 'getFoldersData').mockResolvedValue(undefined);
      el.isCreatingFile = true;
      await el.createNewFile('login');
      expect(el.isCreatingFile).toBe(false);
      expect(refresh).toHaveBeenCalled();
    });

    it('does not throw when getFileHandle rejects', async () => {
      const getFileHandle = vi.fn().mockRejectedValue(new Error('denied'));
      (el as any)._e2eHandle = { getFileHandle };
      vi.spyOn(el, 'getFoldersData').mockResolvedValue(undefined);
      await expect(el.createNewFile('login')).resolves.toBeUndefined();
    });

    it('btn-new-file toggles the file form open', () => {
      (el as any).hasPermission = true;
      (el as any).render();
      const btn = el.shadowRoot!.getElementById('btn-new-file') as HTMLElement;
      expect(btn).not.toBeNull();
      btn.click();
      expect(el.isCreatingFile).toBe(true);
      expect(el.shadowRoot!.getElementById('input-new-file')).not.toBeNull();
    });

    it('opening the file form closes the folder form', () => {
      (el as any).hasPermission = true;
      el.isCreatingFolder = true;
      (el as any).render();
      (el.shadowRoot!.getElementById('btn-new-file') as HTMLElement).click();
      expect(el.isCreatingFolder).toBe(false);
      expect(el.isCreatingFile).toBe(true);
    });

    it('btn-new-file-confirm calls createNewFile with the input value', () => {
      (el as any).hasPermission = true;
      el.isCreatingFile = true;
      (el as any).render();
      const input = el.shadowRoot!.getElementById('input-new-file') as HTMLInputElement;
      input.value = 'my-test';
      const spy = vi.spyOn(el, 'createNewFile').mockResolvedValue(undefined);
      (el.shadowRoot!.getElementById('btn-new-file-confirm') as HTMLElement).click();
      expect(spy).toHaveBeenCalledWith('my-test');
    });

    it('btn-new-file-cancel closes the file form', () => {
      (el as any).hasPermission = true;
      el.isCreatingFile = true;
      (el as any).render();
      (el.shadowRoot!.getElementById('btn-new-file-cancel') as HTMLElement).click();
      expect(el.isCreatingFile).toBe(false);
    });

    it('pressing Enter in the file input calls createNewFile', () => {
      (el as any).hasPermission = true;
      el.isCreatingFile = true;
      (el as any).render();
      const input = el.shadowRoot!.getElementById('input-new-file') as HTMLInputElement;
      input.value = 'typed';
      const spy = vi.spyOn(el, 'createNewFile').mockResolvedValue(undefined);
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(spy).toHaveBeenCalledWith('typed');
    });

    it('pressing Escape in the file input closes the file form', () => {
      (el as any).hasPermission = true;
      el.isCreatingFile = true;
      (el as any).render();
      const input = el.shadowRoot!.getElementById('input-new-file') as HTMLInputElement;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(el.isCreatingFile).toBe(false);
    });
  });

  describe('createNewFolder', () => {
    it('does nothing when _e2eHandle is null', async () => {
      (el as any)._e2eHandle = null;
      await expect(el.createNewFolder('whatever')).resolves.toBeUndefined();
    });

    it('does nothing when the name is empty', async () => {
      const getDir = vi.fn();
      (el as any)._e2eHandle = { getDirectoryHandle: getDir };
      await el.createNewFolder('   ');
      expect(getDir).not.toHaveBeenCalled();
    });

    it('creates a directory with the trimmed name', async () => {
      const getDir = vi.fn().mockResolvedValue({});
      (el as any)._e2eHandle = { getDirectoryHandle: getDir };
      vi.spyOn(el, 'getFoldersData').mockResolvedValue(undefined);
      await el.createNewFolder('  my-folder  ');
      expect(getDir).toHaveBeenCalledWith('my-folder', { create: true });
    });

    it('strips path separators from the folder name', async () => {
      const getDir = vi.fn().mockResolvedValue({});
      (el as any)._e2eHandle = { getDirectoryHandle: getDir };
      vi.spyOn(el, 'getFoldersData').mockResolvedValue(undefined);
      await el.createNewFolder('a/b\\c');
      expect(getDir).toHaveBeenCalledWith('abc', { create: true });
    });

    it('refreshes the tree and resets isCreatingFolder after creating', async () => {
      const getDir = vi.fn().mockResolvedValue({});
      (el as any)._e2eHandle = { getDirectoryHandle: getDir };
      const refresh = vi.spyOn(el, 'getFoldersData').mockResolvedValue(undefined);
      el.isCreatingFolder = true;
      await el.createNewFolder('folder');
      expect(el.isCreatingFolder).toBe(false);
      expect(refresh).toHaveBeenCalled();
    });

    it('does not throw when getDirectoryHandle rejects', async () => {
      const getDir = vi.fn().mockRejectedValue(new Error('denied'));
      (el as any)._e2eHandle = { getDirectoryHandle: getDir };
      vi.spyOn(el, 'getFoldersData').mockResolvedValue(undefined);
      await expect(el.createNewFolder('folder')).resolves.toBeUndefined();
    });

    it('btn-new-folder toggles the folder form open', () => {
      (el as any).hasPermission = true;
      (el as any).render();
      const btn = el.shadowRoot!.getElementById('btn-new-folder') as HTMLElement;
      expect(btn).not.toBeNull();
      btn.click();
      expect(el.isCreatingFolder).toBe(true);
      expect(el.shadowRoot!.getElementById('input-new-folder')).not.toBeNull();
    });

    it('opening the folder form closes the file form', () => {
      (el as any).hasPermission = true;
      el.isCreatingFile = true;
      (el as any).render();
      (el.shadowRoot!.getElementById('btn-new-folder') as HTMLElement).click();
      expect(el.isCreatingFile).toBe(false);
      expect(el.isCreatingFolder).toBe(true);
    });

    it('btn-new-folder-confirm calls createNewFolder with the input value', () => {
      (el as any).hasPermission = true;
      el.isCreatingFolder = true;
      (el as any).render();
      const input = el.shadowRoot!.getElementById('input-new-folder') as HTMLInputElement;
      input.value = 'my-folder';
      const spy = vi.spyOn(el, 'createNewFolder').mockResolvedValue(undefined);
      (el.shadowRoot!.getElementById('btn-new-folder-confirm') as HTMLElement).click();
      expect(spy).toHaveBeenCalledWith('my-folder');
    });

    it('btn-new-folder-cancel closes the folder form', () => {
      (el as any).hasPermission = true;
      el.isCreatingFolder = true;
      (el as any).render();
      (el.shadowRoot!.getElementById('btn-new-folder-cancel') as HTMLElement).click();
      expect(el.isCreatingFolder).toBe(false);
    });

    it('pressing Enter in the folder input calls createNewFolder', () => {
      (el as any).hasPermission = true;
      el.isCreatingFolder = true;
      (el as any).render();
      const input = el.shadowRoot!.getElementById('input-new-folder') as HTMLInputElement;
      input.value = 'typed-folder';
      const spy = vi.spyOn(el, 'createNewFolder').mockResolvedValue(undefined);
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(spy).toHaveBeenCalledWith('typed-folder');
    });

    it('pressing Escape in the folder input closes the folder form', () => {
      (el as any).hasPermission = true;
      el.isCreatingFolder = true;
      (el as any).render();
      const input = el.shadowRoot!.getElementById('input-new-folder') as HTMLInputElement;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(el.isCreatingFolder).toBe(false);
    });
  });

  // ── no-permission render variations ──────────────────────────────────────

  describe('no-permission render', () => {
    it('renders btn-reauth when needsReauth is true', () => {
      (el as any).hasPermission = false;
      (el as any).needsReauth = true;
      (el as any).render();
      expect(el.shadowRoot!.getElementById('btn-reauth')).not.toBeNull();
    });

    it('does not render btn-reauth when needsReauth is false', () => {
      (el as any).hasPermission = false;
      (el as any).needsReauth = false;
      (el as any).render();
      expect(el.shadowRoot!.getElementById('btn-reauth')).toBeNull();
    });
  });
});
