import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Swal from 'sweetalert2';

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: false }),
    close: vi.fn(),
    getPopup: vi.fn().mockReturnValue(null),
  },
}));

import '../../src/components/lib-e2e-recorder/lib-e2e-recorder';
import type { LibE2eRecorderElement } from '../../src/components/lib-e2e-recorder/lib-e2e-recorder';
import { RecordingService } from '../../src/services/recording.service';
import { PersistenceService } from '../../src/services/persistence.service';
import { TranslationService } from '../../src/services/translation.service';
import { ACTIVE_SESSION_BREADCRUMB_KEY, type ActiveSessionState } from '../../src/models/active-session.model';

function makeSession(overrides: Partial<ActiveSessionState> = {}): ActiveSessionState {
  return {
    sessionId: 's-1',
    isRecording: true,
    isPaused: false,
    commands: ["cy.visit('/app-a')", "cy.get('#go').click()"],
    interceptors: [],
    selectorStrategy: 'data-cy',
    startedAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

let dbCounter = 0;

describe('Phase 8.7 — LibE2eRecorderElement', () => {
  let el: LibE2eRecorderElement;
  let recording: RecordingService;
  let persistence: PersistenceService;
  let translation: TranslationService;

  beforeEach(() => {
    recording = new RecordingService();
    persistence = new PersistenceService(`recorder_db_${++dbCounter}`);
    translation = new TranslationService();

    el = document.createElement('lib-e2e-recorder') as LibE2eRecorderElement;
    el.recording = recording;
    el.persistence = persistence;
    el.translation = translation;
    document.body.appendChild(el);
  });

  afterEach(() => {
    el.remove();
    recording.destroy();
    vi.clearAllMocks();
  });

  it('registers as <lib-e2e-recorder> custom element', () => {
    expect(customElements.get('lib-e2e-recorder')).toBeDefined();
  });

  it('initial isRecording is false', () => {
    expect(el.isRecording).toBe(false);
  });

  it('toggle() flips isRecording to true', () => {
    el.toggle();
    expect(el.isRecording).toBe(true);
  });

  it('toggle() called twice returns isRecording to false', () => {
    el.toggle();
    el.toggle();
    expect(el.isRecording).toBe(false);
  });

  it('toggle() delegates to recording.toggleRecording()', () => {
    const spy = vi.spyOn(recording, 'toggleRecording');
    el.toggle();
    expect(spy).toHaveBeenCalled();
  });

  it('Ctrl+Shift+E toggles visibility regardless of current isVisible state', () => {
    expect(el.isVisible).toBe(false);
    window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, shiftKey: true, key: 'E', bubbles: true }));
    expect(el.isVisible).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, shiftKey: true, key: 'E', bubbles: true }));
    expect(el.isVisible).toBe(false);
  });

  it('other Ctrl shortcuts are blocked when isVisible is false', () => {
    el.isVisible = false;
    const spy = vi.spyOn(el, 'toggle');
    window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, key: 'r', bubbles: true }));
    expect(spy).not.toHaveBeenCalled();
  });

  it('Ctrl+R keyboard event calls toggle()', () => {
    el.isVisible = true;
    const spy = vi.spyOn(el, 'toggle');
    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'r', bubbles: true });
    window.dispatchEvent(event);
    expect(spy).toHaveBeenCalled();
  });

  it('Ctrl+1 opens saved tests panel', () => {
    el.isVisible = true;
    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: '1', bubbles: true });
    window.dispatchEvent(event);
    expect(el.isSavedTestsDialogOpen).toBe(true);
  });

  it('Ctrl+2 opens commands panel', () => {
    el.isVisible = true;
    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: '2', bubbles: true });
    window.dispatchEvent(event);
    expect(el.isCommandsDialogOpen).toBe(true);
  });

  it('Ctrl+3 opens settings panel', () => {
    el.isVisible = true;
    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: '3', bubbles: true });
    window.dispatchEvent(event);
    expect(el.isSettingsDialogOpen).toBe(true);
  });

  it('showSavedTestsDialog() sets isSavedTestsDialogOpen to true', () => {
    el.showSavedTestsDialog();
    expect(el.isSavedTestsDialogOpen).toBe(true);
  });

  it('showCommandsDialog() sets isCommandsDialogOpen to true', () => {
    el.showCommandsDialog();
    expect(el.isCommandsDialogOpen).toBe(true);
  });

  it('showSettingsDialog() sets isSettingsDialogOpen to true', () => {
    el.showSettingsDialog();
    expect(el.isSettingsDialogOpen).toBe(true);
  });

  it('setLanguage("en") calls translation.setLang("en")', () => {
    const spy = vi.spyOn(translation, 'setLang');
    el.setLanguage('en');
    expect(spy).toHaveBeenCalledWith('en');
  });

  it('setLanguage() with no arg auto-detects via translation.detectLang()', () => {
    const spy = vi.spyOn(translation, 'setLang');
    el.setLanguage();
    expect(spy).toHaveBeenCalled();
  });

  it('calling showSavedTestsDialog() twice closes and reopens (toggles)', () => {
    el.showSavedTestsDialog();
    expect(el.isSavedTestsDialogOpen).toBe(true);
    el.showSavedTestsDialog();
    expect(el.isSavedTestsDialogOpen).toBe(false);
  });

  it('showAdvancedEditorDialog() sets isAdvancedEditorDialogOpen to true', () => {
    el.showAdvancedEditorDialog();
    expect(el.isAdvancedEditorDialogOpen).toBe(true);
  });

  it('showAdvancedEditorDialog() called twice toggles isAdvancedEditorDialogOpen to false', () => {
    el.showAdvancedEditorDialog();
    el.showAdvancedEditorDialog();
    expect(el.isAdvancedEditorDialogOpen).toBe(false);
  });

  it('browse button (data-action="browse") opens advanced editor dialog', () => {
    const btn = el.shadowRoot!.querySelector('[data-action="browse"]') as HTMLElement;
    btn.click();
    expect(el.isAdvancedEditorDialogOpen).toBe(true);
  });

  it('widget renders 4 action buttons', () => {
    const buttons = el.shadowRoot!.querySelectorAll('.btn-action');
    expect(buttons.length).toBe(4);
  });

  it('showFileEditorDialog() calls Swal.fire', () => {
    const mockHandle = {
      createWritable: vi.fn().mockResolvedValue({ write: vi.fn(), close: vi.fn() }),
    } as unknown as FileSystemFileHandle;
    (el as any).showFileEditorDialog(mockHandle, 'content', 'test.cy.ts', 1);
    expect(Swal.fire).toHaveBeenCalled();
  });

  // ── pause / resume (task 1) ──────────────────────────────────────────────

  it('isPaused is false initially', () => {
    expect(el.isPaused).toBe(false);
  });

  it('togglePause() delegates to recording.togglePause()', () => {
    const spy = vi.spyOn(recording, 'togglePause');
    el.togglePause();
    expect(spy).toHaveBeenCalled();
  });

  it('Ctrl+P keyboard event calls togglePause()', () => {
    el.isVisible = true;
    const spy = vi.spyOn(el, 'togglePause');
    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'p', bubbles: true });
    window.dispatchEvent(event);
    expect(spy).toHaveBeenCalled();
  });

  // ── recording history (task 5) ───────────────────────────────────────────

  it('getRecordingHistory() returns empty array when nothing is saved', () => {
    localStorage.removeItem('e2e-recording-history');
    expect(el.getRecordingHistory()).toEqual([]);
  });

  it('getRecordingHistory() reads saved entries from localStorage', () => {
    const entry = { commands: ["cy.visit('/')"], interceptors: [], savedAt: Date.now() };
    localStorage.setItem('e2e-recording-history', JSON.stringify([entry]));
    const history = el.getRecordingHistory();
    expect(history).toHaveLength(1);
    expect(history[0].commands[0]).toBe("cy.visit('/')");
  });

  it('clearRecordingHistory() removes the key from localStorage', () => {
    localStorage.setItem('e2e-recording-history', JSON.stringify([{ commands: [], interceptors: [], savedAt: 1 }]));
    el.clearRecordingHistory();
    expect(localStorage.getItem('e2e-recording-history')).toBeNull();
  });

  it('recoverLastRecording() calls appendCommand for each command in the latest entry', () => {
    const spy = vi.spyOn(recording, 'appendCommand');
    const entry = { commands: ["cy.visit('/')", "cy.get('#btn').click()"], interceptors: [], savedAt: Date.now() };
    localStorage.setItem('e2e-recording-history', JSON.stringify([entry]));
    el.recoverLastRecording();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith("cy.visit('/')");
    expect(spy).toHaveBeenCalledWith("cy.get('#btn').click()");
  });

  it('recoverLastRecording() does nothing when history is empty', () => {
    const spy = vi.spyOn(recording, 'appendCommand');
    localStorage.removeItem('e2e-recording-history');
    el.recoverLastRecording();
    expect(spy).not.toHaveBeenCalled();
  });

  // ── showSaveTestDialog ────────────────────────────────────────────────────

  it('showSaveTestDialog() sets isSaveTestDialogOpen to true', () => {
    el.showSaveTestDialog();
    expect(el.isSaveTestDialogOpen).toBe(true);
  });

  it('showSaveTestDialog() calling twice toggles isSaveTestDialogOpen to false', () => {
    el.showSaveTestDialog();
    el.showSaveTestDialog();
    expect(el.isSaveTestDialogOpen).toBe(false);
  });

  // ── saveRecordingHistory ──────────────────────────────────────────────────

  it('saveRecordingHistory() skips saving when cypressCommands is empty', () => {
    localStorage.removeItem('e2e-recording-history');
    el.cypressCommands = [];
    (el as any).saveRecordingHistory();
    expect(localStorage.getItem('e2e-recording-history')).toBeNull();
  });

  it('saveRecordingHistory() saves commands to localStorage', () => {
    localStorage.removeItem('e2e-recording-history');
    el.cypressCommands = ["cy.visit('/')"];
    el.interceptors = [];
    (el as any).saveRecordingHistory();
    const history = el.getRecordingHistory();
    expect(history).toHaveLength(1);
    expect(history[0].commands).toContain("cy.visit('/')");
  });

  it('saveRecordingHistory() prepends new entries and keeps max 5', () => {
    const entries = Array.from({ length: 5 }, (_, i) => ({
      commands: [`cy.visit('/page${i}')`],
      interceptors: [],
      savedAt: Date.now() - i * 1000,
    }));
    localStorage.setItem('e2e-recording-history', JSON.stringify(entries));

    el.cypressCommands = ["cy.get('#new').click()"];
    el.interceptors = [];
    (el as any).saveRecordingHistory();

    const history = el.getRecordingHistory();
    expect(history).toHaveLength(5);
    expect(history[0].commands).toContain("cy.get('#new').click()");
  });

  it('stop recording triggers saveRecordingHistory when commands exist', () => {
    localStorage.removeItem('e2e-recording-history');
    el.toggle(); // start — adds 3 initial commands, sets controlFirstTimeData = false
    el.toggle(); // stop  — calls saveRecordingHistory()
    const history = el.getRecordingHistory();
    expect(history).toHaveLength(1);
    expect(history[0].commands.length).toBeGreaterThan(0);
  });

  it('getRecordingHistory() returns [] when localStorage contains invalid JSON', () => {
    localStorage.setItem('e2e-recording-history', '{invalid json}');
    expect(el.getRecordingHistory()).toEqual([]);
  });

  // ── onSaveTest ────────────────────────────────────────────────────────────

  it('onSaveTest() does nothing when description is null', async () => {
    el.cypressCommands = ["cy.visit('/')"];
    await (el as any).onSaveTest(null, []);
    expect(el.cypressCommands).toEqual(["cy.visit('/')"]);
  });

  it('onSaveTest() clears commands and recording history when description is given', async () => {
    el.cypressCommands = ["cy.visit('/')"];
    el.interceptors = [];
    localStorage.setItem('e2e-recording-history', JSON.stringify([{ commands: [], interceptors: [], savedAt: 1 }]));
    await (el as any).onSaveTest('My Test', ['tag1']);
    expect(el.cypressCommands).toEqual([]);
    expect(el.getRecordingHistory()).toEqual([]);
  });

  // ── onSaveAndExportTest ───────────────────────────────────────────────────

  it('onSaveAndExportTest() does nothing when description is null', async () => {
    el.cypressCommands = ["cy.visit('/')"];
    await (el as any).onSaveAndExportTest(null, []);
    expect(el.cypressCommands).toEqual(["cy.visit('/')"]);
  });

  it('onSaveAndExportTest() clears commands', async () => {
    el.cypressCommands = ["cy.visit('/')"];
    el.interceptors = [];
    await (el as any).onSaveAndExportTest('Export Test', []);
    expect(el.cypressCommands).toEqual([]);
  });

  it('onSaveAndExportTest() schedules showAdvancedEditorDialog', async () => {
    const dialogSpy = vi.spyOn(el, 'showAdvancedEditorDialog');
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementationOnce((fn: any) => {
      fn(); // invoke immediately instead of waiting 300 ms
      return 0 as any;
    });
    el.cypressCommands = ["cy.visit('/')"];
    el.interceptors = [];
    await (el as any).onSaveAndExportTest('Export Test', []);
    expect(dialogSpy).toHaveBeenCalled();
    timeoutSpy.mockRestore();
  });

  // ── willClose callbacks ───────────────────────────────────────────────────

  describe('willClose callbacks reset dialog flags', () => {
    function withWillClose(fn: () => void): void {
      vi.mocked(Swal.fire).mockImplementationOnce(async (opts: any) => {
        if (opts?.willClose) opts.willClose();
        return { isConfirmed: false } as any;
      });
      fn();
    }

    it('showSavedTestsDialog willClose resets isSavedTestsDialogOpen', () => {
      withWillClose(() => el.showSavedTestsDialog());
      expect(el.isSavedTestsDialogOpen).toBe(false);
    });

    it('showCommandsDialog willClose resets isCommandsDialogOpen', () => {
      withWillClose(() => el.showCommandsDialog());
      expect(el.isCommandsDialogOpen).toBe(false);
    });

    it('showSettingsDialog willClose resets isSettingsDialogOpen', () => {
      withWillClose(() => el.showSettingsDialog());
      expect(el.isSettingsDialogOpen).toBe(false);
    });

    it('showAdvancedEditorDialog willClose resets isAdvancedEditorDialogOpen', () => {
      withWillClose(() => el.showAdvancedEditorDialog());
      expect(el.isAdvancedEditorDialogOpen).toBe(false);
    });

    it('showSaveTestDialog willClose resets isSaveTestDialogOpen', () => {
      withWillClose(() => el.showSaveTestDialog());
      expect(el.isSaveTestDialogOpen).toBe(false);
    });
  });

  // ── assertion builder (showCommandsDialog didOpen) ────────────────────────

  describe('assertion builder in showCommandsDialog', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement('div');
      container.id = 'commands-modal-content';
      document.body.appendChild(container);
      vi.mocked(Swal.fire).mockImplementationOnce(async (opts: any) => {
        if (opts?.didOpen) opts.didOpen();
        return { isConfirmed: false } as any;
      });
    });

    afterEach(() => {
      container.remove();
    });

    it('adds a cy.get command with a value', () => {
      el.showCommandsDialog();
      const selectorInput = document.getElementById('assert-selector') as HTMLInputElement;
      const typeSelect    = document.getElementById('assert-type')     as HTMLSelectElement;
      const valueInput    = document.getElementById('assert-value')    as HTMLInputElement;
      const addBtn        = document.getElementById('btn-add-assertion') as HTMLButtonElement;

      selectorInput.value = '[data-cy="btn"]';
      typeSelect.value    = 'contain.text';
      valueInput.value    = 'Submit';
      addBtn.click();

      expect(recording.getCommandsSnapshot().at(-1)).toBe(
        "cy.get('[data-cy=\"btn\"]').should('contain.text', 'Submit')"
      );
    });

    it('adds a command without value for no-value assertion types', () => {
      el.showCommandsDialog();
      const selectorInput = document.getElementById('assert-selector') as HTMLInputElement;
      const typeSelect    = document.getElementById('assert-type')     as HTMLSelectElement;
      const addBtn        = document.getElementById('btn-add-assertion') as HTMLButtonElement;

      selectorInput.value = '[data-cy="btn"]';
      typeSelect.value    = 'be.visible';
      addBtn.click();

      expect(recording.getCommandsSnapshot().at(-1)).toBe(
        "cy.get('[data-cy=\"btn\"]').should('be.visible')"
      );
    });

    it('skips adding command when selector is empty', () => {
      el.showCommandsDialog();
      const before = recording.getCommandsSnapshot().length;
      (document.getElementById('btn-add-assertion') as HTMLButtonElement).click();
      expect(recording.getCommandsSnapshot().length).toBe(before);
    });

    it('escapes single quotes in selector and value (spec 008)', () => {
      el.showCommandsDialog();
      (document.getElementById('assert-selector') as HTMLInputElement).value = '[data-cy="x\'y"]';
      (document.getElementById('assert-type')     as HTMLSelectElement).value = 'contain.text';
      (document.getElementById('assert-value')    as HTMLInputElement).value = "O'Brien";
      (document.getElementById('btn-add-assertion') as HTMLButtonElement).click();
      const cmd = recording.getCommandsSnapshot().at(-1)!;
      expect(cmd).toContain("x\\'y");
      expect(cmd).toContain("O\\'Brien");
    });

    it('deletecommand event calls recording.removeCommand', () => {
      recording.startRecording();
      el.showCommandsDialog();
      const child = container.querySelector('test-previsualizer')!;
      child.dispatchEvent(new CustomEvent('deletecommand', { detail: 0 }));
      expect(recording.getCommandsSnapshot().length).toBe(2); // 3 initial → remove index 0 → 2
    });

    it('movecommand event calls recording.moveCommand', () => {
      recording.startRecording();
      el.showCommandsDialog();
      const [first, second] = recording.getCommandsSnapshot();
      const child = container.querySelector('test-previsualizer')!;
      child.dispatchEvent(new CustomEvent('movecommand', { detail: { from: 0, to: 1 } }));
      expect(recording.getCommandsSnapshot()[0]).toBe(second);
      expect(recording.getCommandsSnapshot()[1]).toBe(first);
    });

    it('deleteinterceptor event calls recording.removeInterceptor', () => {
      recording.startRecording();
      recording.registerInterceptor('GET', '/api/users', 'get-api-users');
      el.showCommandsDialog();
      const child = container.querySelector('test-previsualizer')!;
      child.dispatchEvent(new CustomEvent('deleteinterceptor', { detail: 0 }));
      expect(recording.getInterceptorsSnapshot()).toHaveLength(0);
    });
  });

  // ── remaining dialog didOpen callbacks ───────────────────────────────────

  describe('showSavedTestsDialog didOpen', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement('div');
      container.id = 'saved-tests-modal-content';
      document.body.appendChild(container);
      vi.mocked(Swal.fire).mockImplementationOnce(async (opts: any) => {
        if (opts?.didOpen) opts.didOpen();
        return { isConfirmed: false } as any;
      });
    });

    afterEach(() => { container.remove(); });

    it('appends a test-editor child element', () => {
      el.showSavedTestsDialog();
      expect(container.querySelector('test-editor')).not.toBeNull();
    });
  });

  describe('showSaveTestDialog didOpen', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement('div');
      container.id = 'save-test-modal-content';
      document.body.appendChild(container);
      vi.mocked(Swal.fire).mockImplementationOnce(async (opts: any) => {
        if (opts?.didOpen) opts.didOpen();
        return { isConfirmed: false } as any;
      });
    });

    afterEach(() => { container.remove(); });

    it('appends a save-test child element', () => {
      el.showSaveTestDialog();
      expect(container.querySelector('save-test')).not.toBeNull();
    });

    it('savetest event calls Swal.close', () => {
      el.showSaveTestDialog();
      const child = container.querySelector('save-test')!;
      child.dispatchEvent(new CustomEvent('savetest', { detail: { description: 'from-event', tags: [] } }));
      expect(Swal.close).toHaveBeenCalled();
    });

    it('saveandexport event calls Swal.close', () => {
      el.showSaveTestDialog();
      const child = container.querySelector('save-test')!;
      child.dispatchEvent(new CustomEvent('saveandexport', { detail: { description: 'export', tags: [] } }));
      expect(Swal.close).toHaveBeenCalled();
    });
  });

  describe('showSettingsDialog didOpen', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement('div');
      container.id = 'settings-modal-content';
      document.body.appendChild(container);
      vi.mocked(Swal.fire).mockImplementationOnce(async (opts: any) => {
        if (opts?.didOpen) opts.didOpen();
        return { isConfirmed: false } as any;
      });
    });

    afterEach(() => { container.remove(); });

    it('appends an e2e-configuration child element', () => {
      el.showSettingsDialog();
      expect(container.querySelector('e2e-configuration')).not.toBeNull();
    });
  });

  describe('showAdvancedEditorDialog didOpen', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement('div');
      container.id = 'advanced-editor-modal-content';
      document.body.appendChild(container);
      vi.mocked(Swal.fire).mockImplementationOnce(async (opts: any) => {
        if (opts?.didOpen) opts.didOpen();
        return { isConfirmed: false } as any;
      });
    });

    afterEach(() => { container.remove(); vi.mocked(Swal.getPopup).mockReturnValue(null); });

    it('appends an advanced-test-editor child element', () => {
      el.showAdvancedEditorDialog();
      expect(container.querySelector('advanced-test-editor')).not.toBeNull();
    });

    it('closemodal event on child calls Swal.close', () => {
      el.showAdvancedEditorDialog();
      const child = container.querySelector('advanced-test-editor')!;
      child.dispatchEvent(new CustomEvent('closemodal'));
      expect(Swal.close).toHaveBeenCalled();
    });

    it('selectorstrategychange event updates recording.selectorStrategy', () => {
      el.showAdvancedEditorDialog();
      const child = container.querySelector('advanced-test-editor')!;
      child.dispatchEvent(new CustomEvent('selectorstrategychange', { detail: 'aria-label' }));
      expect(recording.selectorStrategy).toBe('aria-label');
    });

    it('styles the popup when Swal.getPopup returns an element', () => {
      const htmlContainer = document.createElement('div');
      htmlContainer.className = 'swal2-html-container';
      const popup = document.createElement('div');
      popup.appendChild(htmlContainer);
      vi.mocked(Swal.getPopup).mockReturnValue(popup as unknown as HTMLElement);
      el.showAdvancedEditorDialog();
      expect(popup.style.height).toBe('600px');
    });

    it('openfileeditor event on child closes Swal (reopens the file editor)', () => {
      el.showAdvancedEditorDialog();
      const child = container.querySelector('advanced-test-editor')!;
      child.dispatchEvent(new CustomEvent('openfileeditor', {
        detail: { handle: {}, content: 'x', fileName: 'f.cy.ts', testId: 1, itBlock: '', interceptorsBlock: '', notes: '' },
      }));
      expect(Swal.close).toHaveBeenCalled();
    });
  });

  describe('showFileEditorDialog didOpen', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement('div');
      container.id = 'file-editor-modal-content';
      document.body.appendChild(container);
      vi.mocked(Swal.fire).mockImplementationOnce(async (opts: any) => {
        if (opts?.didOpen) opts.didOpen();
        return { isConfirmed: false } as any;
      });
    });

    afterEach(() => { container.remove(); });

    it('appends a file-preview child element', () => {
      (el as any).showFileEditorDialog({}, 'content', 'f.cy.ts', 1, 'it', 'icp', 'notes');
      expect(container.querySelector('file-preview')).not.toBeNull();
    });

    it('close event on child calls Swal.close', () => {
      (el as any).showFileEditorDialog({}, 'content', 'f.cy.ts', 1);
      const child = container.querySelector('file-preview')!;
      child.dispatchEvent(new CustomEvent('close'));
      expect(Swal.close).toHaveBeenCalled();
    });

    it('save event writes the file content via the handle', async () => {
      const write = vi.fn();
      const close = vi.fn();
      const handle = { createWritable: vi.fn().mockResolvedValue({ write, close }) };
      (el as any).showFileEditorDialog(handle, 'content', 'f.cy.ts', 1);
      const child = container.querySelector('file-preview')!;
      child.dispatchEvent(new CustomEvent('save', { detail: 'new content' }));
      await Promise.resolve();
      await Promise.resolve();
      expect(write).toHaveBeenCalledWith('new content');
      expect(close).toHaveBeenCalled();
    });

    it('save event does not throw when writing fails', async () => {
      const handle = { createWritable: vi.fn().mockRejectedValue(new Error('denied')) };
      (el as any).showFileEditorDialog(handle, 'content', 'f.cy.ts', 1);
      const child = container.querySelector('file-preview')!;
      child.dispatchEvent(new CustomEvent('save', { detail: 'x' }));
      await Promise.resolve();
      await Promise.resolve();
      expect(Swal.close).toHaveBeenCalled();
    });
  });

  // ── async init methods ────────────────────────────────────────────────────

  describe('initHttpConfig', () => {
    it('sets extendedHttpCommands to true when no config exists in DB', async () => {
      const freshDb = new PersistenceService(`fresh_init_db_${Date.now()}`);
      el.persistence = freshDb;
      localStorage.removeItem('extendedHttpCommands');
      await (el as any).initHttpConfig();
      expect(localStorage.getItem('extendedHttpCommands')).toBe('true');
    });

    it('reads extendedHttpCommands from DB when config exists', async () => {
      const freshDb = new PersistenceService(`fresh_init_db_${Date.now()}`);
      el.persistence = freshDb;
      await freshDb.setConfig({ extendedHttpCommands: 'false' });
      localStorage.removeItem('extendedHttpCommands');
      await (el as any).initHttpConfig();
      expect(localStorage.getItem('extendedHttpCommands')).toBe('false');
    });
  });

  describe('initLanguage', () => {
    it('calls setLang with stored language when config exists', async () => {
      const freshDb = new PersistenceService(`fresh_lang_db_${Date.now()}`);
      el.persistence = freshDb;
      await freshDb.setConfig({ language: 'en' });
      const spy = vi.spyOn(translation, 'setLang');
      await (el as any).initLanguage();
      expect(spy).toHaveBeenCalledWith('en');
    });

    it('calls detectLang when no language config exists', async () => {
      const freshDb = new PersistenceService(`fresh_lang_db_${Date.now()}`);
      el.persistence = freshDb;
      const spy = vi.spyOn(translation, 'detectLang').mockReturnValue('de');
      await (el as any).initLanguage();
      expect(spy).toHaveBeenCalled();
    });
  });

  // ── disconnectedCallback ──────────────────────────────────────────────────

  it('disconnectedCallback removes keyboard shortcut listener', () => {
    const spy = vi.spyOn(el, 'toggle');
    el.remove(); // triggers disconnectedCallback — removes window keydown listener
    window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, key: 'r', bubbles: true }));
    expect(spy).not.toHaveBeenCalled();
  });

  it('non-Ctrl keyboard events are ignored', () => {
    const spy = vi.spyOn(el, 'toggle');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true }));
    expect(spy).not.toHaveBeenCalled();
  });

  it('re-renders the widget when the UI language changes', () => {
    const renderSpy = vi.spyOn(el as any, 'render');
    translation.setLang('de');
    expect(renderSpy).toHaveBeenCalled();
  });

  // ── cross-app session continuity (spec 006) ───────────────────────────────

  describe('cross-app session continuity', () => {
    beforeEach(() => {
      localStorage.removeItem(ACTIVE_SESSION_BREADCRUMB_KEY);
    });

    it('hasActiveSession() is false when there is no breadcrumb', () => {
      expect(el.hasActiveSession()).toBe(false);
    });

    it('hasActiveSession() is true when the breadcrumb marks a recording', () => {
      localStorage.setItem(ACTIVE_SESSION_BREADCRUMB_KEY, JSON.stringify({ sessionId: 'x', isRecording: true, updatedAt: Date.now() }));
      expect(el.hasActiveSession()).toBe(true);
    });

    it('starting a recording writes the active-session breadcrumb', () => {
      el.toggle(); // start
      expect(el.hasActiveSession()).toBe(true);
    });

    it('stopping a recording clears the active-session breadcrumb', () => {
      el.toggle(); // start — writes breadcrumb
      el.toggle(); // stop  — clears it
      expect(localStorage.getItem(ACTIVE_SESSION_BREADCRUMB_KEY)).toBeNull();
    });

    it('discardSession() clears the breadcrumb and the persisted record', () => {
      localStorage.setItem(ACTIVE_SESSION_BREADCRUMB_KEY, JSON.stringify({ sessionId: 'x', isRecording: true, updatedAt: Date.now() }));
      const spy = vi.spyOn(persistence, 'clearActiveSession');
      el.discardSession();
      expect(localStorage.getItem(ACTIVE_SESSION_BREADCRUMB_KEY)).toBeNull();
      expect(spy).toHaveBeenCalled();
    });

    it('resumes a recent active session on connect (rehydrates the buffer, no bootstrap)', async () => {
      const db = new PersistenceService(`resume_db_${++dbCounter}`);
      await db.setConfig({ allowReadWriteFiles: 'false' }); // skip the FS setup dialog
      await db.saveActiveSession(makeSession());
      const rec = new RecordingService();
      const el2 = document.createElement('lib-e2e-recorder') as LibE2eRecorderElement;
      el2.recording = rec;
      el2.persistence = db;
      el2.translation = new TranslationService();
      document.body.appendChild(el2);

      await vi.waitFor(() => expect(rec.getCommandsSnapshot()).toContain("cy.get('#go').click()"));
      expect(el2.isRecording).toBe(true);
      // No bootstrap re-emitted: the buffer is exactly what was persisted.
      expect(rec.getCommandsSnapshot()).toHaveLength(2);

      el2.remove();
      rec.destroy();
    });

    it('does NOT silently resume a stale session (older than the TTL); it prompts instead', async () => {
      const db = new PersistenceService(`stale_db_${++dbCounter}`);
      await db.setConfig({ allowReadWriteFiles: 'false' });
      await db.saveActiveSession(makeSession({ updatedAt: Date.now() - 31 * 60_000 }));
      const rec = new RecordingService();
      const el2 = document.createElement('lib-e2e-recorder') as LibE2eRecorderElement;
      el2.recording = rec;
      el2.persistence = db;
      el2.translation = new TranslationService();
      document.body.appendChild(el2);

      await vi.waitFor(() => expect(Swal.fire).toHaveBeenCalled());
      // Stale → not auto-restored into the recorder buffer.
      expect(rec.getCommandsSnapshot()).not.toContain("cy.get('#go').click()");

      el2.remove();
      rec.destroy();
    });
  });

  // ── draggable widget (spec 007) ───────────────────────────────────────────

  describe('draggable widget', () => {
    function toggleBtn(): HTMLElement {
      return el.shadowRoot!.querySelector('[data-action="toggle"]') as HTMLElement;
    }
    function widget(): HTMLElement {
      return el.shadowRoot!.querySelector('.widget') as HTMLElement;
    }
    const ptr = (type: string, x: number, y: number): MouseEvent =>
      new MouseEvent(type, { clientX: x, clientY: y, bubbles: true });

    it('applies a default position and up-left expansion on render', () => {
      expect(widget().getAttribute('data-expand')).toBe('up-left');
      expect(widget().style.left).not.toBe('');
    });

    it('a plain click (no drag) toggles recording', () => {
      toggleBtn().dispatchEvent(ptr('pointerdown', 500, 500));
      window.dispatchEvent(ptr('pointerup', 500, 500));
      toggleBtn().dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(el.isRecording).toBe(true);
    });

    it('dragging past the threshold repositions the widget and does NOT toggle recording', () => {
      const setConfigSpy = vi.spyOn(persistence, 'setConfig');
      toggleBtn().dispatchEvent(ptr('pointerdown', 500, 500));
      window.dispatchEvent(ptr('pointermove', 560, 440)); // >5px → drag
      window.dispatchEvent(ptr('pointerup', 560, 440));
      // The click that the browser fires after a drag must be swallowed.
      toggleBtn().dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(el.isRecording).toBe(false);
      expect(widget().style.left).not.toBe('');
      expect(setConfigSpy).toHaveBeenCalledWith(
        expect.objectContaining({ widgetPosition: expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }) }),
      );
    });

    it('a sub-threshold move is treated as a click, not a drag', () => {
      toggleBtn().dispatchEvent(ptr('pointerdown', 500, 500));
      window.dispatchEvent(ptr('pointermove', 502, 501)); // <5px
      window.dispatchEvent(ptr('pointerup', 502, 501));
      toggleBtn().dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(el.isRecording).toBe(true);
    });

    it('resetWidgetPosition() returns to the default corner and clears the saved position', () => {
      const setConfigSpy = vi.spyOn(persistence, 'setConfig');
      // move it first
      toggleBtn().dispatchEvent(ptr('pointerdown', 500, 500));
      window.dispatchEvent(ptr('pointermove', 100, 100));
      window.dispatchEvent(ptr('pointerup', 100, 100));

      el.resetWidgetPosition();
      expect(setConfigSpy).toHaveBeenCalledWith({ widgetPosition: null });
      expect(widget().getAttribute('data-expand')).toBe('up-left'); // default bottom-right
    });

    it('restores a saved position on connect (adaptive direction)', async () => {
      const db = new PersistenceService(`wpos_db_${++dbCounter}`);
      await db.setConfig({ allowReadWriteFiles: 'false', widgetPosition: { x: 100, y: 100 } });
      const rec = new RecordingService();
      const el2 = document.createElement('lib-e2e-recorder') as LibE2eRecorderElement;
      el2.recording = rec;
      el2.persistence = db;
      el2.translation = new TranslationService();
      document.body.appendChild(el2);

      const w2 = () => el2.shadowRoot!.querySelector('.widget') as HTMLElement;
      // top-left quadrant → expands down-right
      await vi.waitFor(() => expect(w2().getAttribute('data-expand')).toBe('down-right'));

      el2.remove();
      rec.destroy();
    });
  });

  // ── lifecycle & fidelity fixes (spec 008) ─────────────────────────────────

  describe('lifecycle & fidelity (spec 008)', () => {
    function makeBtn(dataCy: string): HTMLButtonElement {
      const b = document.createElement('button');
      b.setAttribute('data-cy', dataCy);
      document.body.appendChild(b);
      return b;
    }
    const click = (node: HTMLElement): void =>
      node.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    it('disconnect→reconnect of the same element flushes, rebuilds the recorder and keeps capturing', async () => {
      const db = new PersistenceService(`reconnect_db_${++dbCounter}`);
      await db.setConfig({ allowReadWriteFiles: 'false' });
      const el2 = document.createElement('lib-e2e-recorder') as LibE2eRecorderElement;
      el2.persistence = db;
      el2.translation = new TranslationService();
      document.body.appendChild(el2);
      el2.toggle(); // start recording (new own RecordingService)

      const before = makeBtn('before');
      click(before);
      expect(el2.recording.getCommandsSnapshot()).toContain('cy.get(\'[data-cy="before"]\').click()');

      // Unmount: must flush the session to IndexedDB before tearing down (AC-02).
      el2.remove();
      await vi.waitFor(async () => {
        const s = await db.getActiveSession();
        expect(s?.commands).toContain('cy.get(\'[data-cy="before"]\').click()');
      });

      // Remount the SAME element: a fresh service is built and the buffer rehydrates.
      document.body.appendChild(el2);
      await vi.waitFor(() =>
        expect(el2.recording.getCommandsSnapshot()).toContain('cy.get(\'[data-cy="before"]\').click()'),
      );
      expect(el2.isRecording).toBe(true);

      // The fresh service's DOM listeners capture again (the core fix).
      const after = makeBtn('after');
      click(after);
      expect(el2.recording.getCommandsSnapshot()).toContain('cy.get(\'[data-cy="after"]\').click()');

      el2.remove();
      before.remove();
      after.remove();
    });

    it('a drag ending off the toggle does not swallow the next genuine click', () => {
      const toggle = el.shadowRoot!.querySelector('[data-action="toggle"]') as HTMLElement;
      const down = (x: number, y: number) => toggle.dispatchEvent(new MouseEvent('pointerdown', { clientX: x, clientY: y, bubbles: true }));
      const move = (x: number, y: number) => window.dispatchEvent(new MouseEvent('pointermove', { clientX: x, clientY: y, bubbles: true }));
      const up   = (x: number, y: number) => window.dispatchEvent(new MouseEvent('pointerup', { clientX: x, clientY: y, bubbles: true }));

      // Drag that ends OFF the toggle → no click fires there → suppression set.
      down(500, 500);
      move(560, 440);
      up(560, 440);
      // No click dispatched here (cursor ended elsewhere).

      // A subsequent genuine click must still toggle recording.
      down(980, 720);
      up(980, 720);
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(el.isRecording).toBe(true);
    });
  });
});
