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

    afterEach(() => { container.remove(); });

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
});
