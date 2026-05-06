import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Swal from 'sweetalert2';

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: false }),
    close: vi.fn(),
    getPopup: vi.fn().mockReturnValue(null),
  },
}));

import '../../src/components/lib-e2e-recorder';
import type { LibE2eRecorderElement } from '../../src/components/lib-e2e-recorder';
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

  it('Ctrl+R keyboard event calls toggle()', () => {
    const spy = vi.spyOn(el, 'toggle');
    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'r', bubbles: true });
    window.dispatchEvent(event);
    expect(spy).toHaveBeenCalled();
  });

  it('Ctrl+1 opens saved tests panel', () => {
    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: '1', bubbles: true });
    window.dispatchEvent(event);
    expect(el.isSavedTestsDialogOpen).toBe(true);
  });

  it('Ctrl+2 opens commands panel', () => {
    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: '2', bubbles: true });
    window.dispatchEvent(event);
    expect(el.isCommandsDialogOpen).toBe(true);
  });

  it('Ctrl+3 opens settings panel', () => {
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
});
