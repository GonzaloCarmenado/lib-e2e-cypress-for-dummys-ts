import Swal from 'sweetalert2';
import { getRecorderStyles } from './lib-e2e-recorder.styles';
import { renderRecorderWidget } from './lib-e2e-recorder.template';
import { RecordingService } from '../../services/recording.service';
import { PersistenceService } from '../../services/persistence.service';
import { TranslationService } from '../../services/translation.service';
import { HttpMonitor } from '../../services/http-monitor';
import {
  injectStyles,
  LIB_E2E_CYPRESS_FOR_DUMMYS_SWAL2_STYLES,
  SCROLLBAR_STYLES,
} from '../../utils/styles.utils';
import {
  makeModalResizable,
  makeSwalDraggable,
  setSwal2DataCyAttribute,
} from '../../utils/modal.utils';
import type { Lang } from '../../models/lang.model';
import { showToast } from '../../utils/toast.utils';

export class LibE2eRecorderElement extends HTMLElement {
  private shadow: ShadowRoot;
  private keydownHandler!: (e: KeyboardEvent) => void;
  private recordingUnsub?: () => void;
  private commandsUnsub?: () => void;
  private interceptorsUnsub?: () => void;
  private pauseUnsub?: () => void;
  private selectorNotFoundUnsub?: () => void;
  private controlFirstTimeData = true;
  private _previsualizerRef: any = null;
  private httpMonitor?: HttpMonitor;
  private smartSelectorEnabled = true;

  recording!: RecordingService;
  persistence!: PersistenceService;
  translation!: TranslationService;

  isRecording = false;
  isPaused = false;
  cypressCommands: string[] = [];
  interceptors: string[] = [];

  isCommandsDialogOpen = false;
  isSavedTestsDialogOpen = false;
  isSaveTestDialogOpen = false;
  isSettingsDialogOpen = false;
  isAdvancedEditorDialogOpen = false;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    if (!this.getAttribute('data-cy')) {
      this.setAttribute('data-cy', 'lib-e2e-cypress-for-dummys');
    }
    if (!this.recording) this.recording = new RecordingService();
    if (!this.persistence) this.persistence = new PersistenceService();
    if (!this.translation) this.translation = new TranslationService();

    this.httpMonitor = new HttpMonitor(this.recording);
    this.httpMonitor.install();

    injectStyles(LIB_E2E_CYPRESS_FOR_DUMMYS_SWAL2_STYLES, 'lib-e2e-swal2-styles');
    injectStyles(SCROLLBAR_STYLES, 'lib-e2e-scrollbar-styles');

    this.initHttpConfig();
    this.initLanguage();
    this.initFilesystemAccess();
    this.initSelectorStrategy();
    this.initSubscriptions();
    this.render();

    this.keydownHandler = (e: KeyboardEvent) => this.handleKeyboardEvent(e);
    window.addEventListener('keydown', this.keydownHandler);
  }

  disconnectedCallback(): void {
    window.removeEventListener('keydown', this.keydownHandler);
    this.recordingUnsub?.();
    this.commandsUnsub?.();
    this.interceptorsUnsub?.();
    this.pauseUnsub?.();
    this.selectorNotFoundUnsub?.();
    this.httpMonitor?.uninstall();
    this.recording.destroy();
  }

  private async initHttpConfig(): Promise<void> {
    const config = await this.persistence.getConfig('extendedHttpCommands');
    if (config === null) {
      await this.persistence.setConfig({ extendedHttpCommands: 'true' });
      localStorage.setItem('extendedHttpCommands', 'true');
    } else {
      localStorage.setItem('extendedHttpCommands', (config['extendedHttpCommands'] as string) ?? 'true');
    }
  }

  private async initLanguage(): Promise<void> {
    const config = await this.persistence.getConfig('language');
    const lang = config?.['language'] as Lang | undefined;
    this.translation.setLang(lang ?? this.translation.detectLang());
  }

  private initSubscriptions(): void {
    this.recordingUnsub = this.recording.onRecordingChange((val) => {
      this.isRecording = val;
      if (!val && !this.controlFirstTimeData) {
        this.saveRecordingHistory();
        this.showSaveTestDialog();
      }
      this.controlFirstTimeData = false;
      this.render();
    });
    this.commandsUnsub = this.recording.onCommandsChange((cmds) => {
      this.cypressCommands = cmds;
      if (this._previsualizerRef) this._previsualizerRef.commands = cmds;
    });
    this.interceptorsUnsub = this.recording.onInterceptorsChange((icps) => {
      this.interceptors = icps;
      if (this._previsualizerRef) this._previsualizerRef.interceptors = icps;
    });
    this.pauseUnsub = this.recording.onPauseChange((paused) => {
      this.isPaused = paused;
      this.render();
    });
    this.selectorNotFoundUnsub = this.recording.onSelectorNotFound((target) => {
      if (this.smartSelectorEnabled) this.showSelectorPicker(target);
    });
  }

  private showSelectorPicker(target: HTMLElement): void {
    import('../../components/selector-picker/selector-picker').then(() => {
      const existing = document.querySelector('selector-picker');
      if (existing) existing.remove();

      const picker = document.createElement('selector-picker') as any;
      picker.targetElement = target;
      picker.recording = this.recording;
      picker.translation = this.translation;
      document.body.appendChild(picker);
    });
  }

  private async initSelectorStrategy(): Promise<void> {
    const config = await this.persistence.getGeneralConfig();
    const strategy = config?.['selectorStrategy'] as string | undefined;
    if (strategy) this.recording.selectorStrategy = strategy as any;
    this.smartSelectorEnabled = config?.['smartSelectorEnabled'] !== 'false';
  }

  toggle(): void {
    this.recording.toggleRecording();
  }

  togglePause(): void {
    this.recording.togglePause();
  }

  setLanguage(lang?: string): void {
    const resolved = lang ? (lang as Lang) : this.translation.detectLang();
    this.translation.setLang(resolved);
  }

  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!event.ctrlKey) return;
    const key = event.key.toLowerCase();
    if (key === 'r')      { event.preventDefault(); this.toggle(); }
    else if (key === 'p') { event.preventDefault(); this.togglePause(); }
    else if (key === '1') { event.preventDefault(); this.showSavedTestsDialog(); }
    else if (key === '2') { event.preventDefault(); this.showCommandsDialog(); }
    else if (key === '3') { event.preventDefault(); this.showSettingsDialog(); }
  }

  // ── recording history (task 5) ────────────────────────────────────────────

  private saveRecordingHistory(): void {
    if (!this.cypressCommands.length) return;
    try {
      const existing = JSON.parse(localStorage.getItem('e2e-recording-history') ?? '[]');
      existing.unshift({ commands: this.cypressCommands, interceptors: this.interceptors, savedAt: Date.now() });
      if (existing.length > 5) existing.splice(5);
      localStorage.setItem('e2e-recording-history', JSON.stringify(existing));
    } catch { /* ignore storage errors */ }
  }

  recoverLastRecording(): void {
    try {
      const existing = JSON.parse(localStorage.getItem('e2e-recording-history') ?? '[]');
      if (!existing.length) return;
      const { commands, interceptors } = existing[0];
      commands.forEach((cmd: string) => this.recording.appendCommand(cmd));
      (interceptors as string[]).forEach((_icp: string) => { /* interceptors are not appendable the same way */ });
    } catch { /* ignore */ }
  }

  clearRecordingHistory(): void {
    localStorage.removeItem('e2e-recording-history');
  }

  getRecordingHistory(): Array<{ commands: string[]; interceptors: string[]; savedAt: number }> {
    try {
      return JSON.parse(localStorage.getItem('e2e-recording-history') ?? '[]');
    } catch { return []; }
  }

  // ── filesystem setup ─────────────────────────────────────────────────────

  private async initFilesystemAccess(): Promise<void> {
    const config = await this.persistence.getGeneralConfig();
    // Only show if the user has never made a choice (key doesn't exist yet)
    if (config && 'allowReadWriteFiles' in config) return;
    this.showFilesystemSetupDialog();
  }

  private showFilesystemSetupDialog(): void {
    Swal.fire({
      title: this.translation.translate('RECORDER.FS_TITLE'),
      html: '<div id="fs-setup-content"></div>',
      showCloseButton: true,
      showConfirmButton: false,
      didOpen: () => {
        makeSwalDraggable();
        setSwal2DataCyAttribute();
        const container = document.getElementById('fs-setup-content')!;
        container.innerHTML = `
          <div style="padding:16px 20px 20px;color:#8b949e;font-size:13px;line-height:1.7">
            <p>${this.translation.translate('RECORDER.FS_INTRO_HTML')}</p>
            <p style="margin-top:10px;margin-bottom:6px;font-size:11px;color:#8b949e">
              ${this.translation.translate('RECORDER.FS_STRUCTURE_HINT_HTML')}
            </p>
            <pre style="margin:0;padding:10px 14px;background:#0d1117;border:1px solid #21262d;
                        border-radius:8px;font-size:11px;color:#c9d1d9;line-height:1.8;
                        font-family:'Cascadia Code','Fira Code','Consolas',monospace">
cypress/         <span style="color:#484f58">${this.translation.translate('RECORDER.FS_TREE_PICK_HINT')}</span>
└── e2e/         <span style="color:#484f58">${this.translation.translate('RECORDER.FS_TREE_READ_HINT')}</span>
    └── *.cy.ts</pre>
            <p style="margin-top:8px;font-size:11px;color:#484f58">
              ${this.translation.translate('RECORDER.FS_PERMISSION_NOTE')}
            </p>
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px">
              <button id="fs-skip"
                style="padding:7px 16px;border:1px solid #30363d;border-radius:6px;cursor:pointer;
                       font-size:12px;font-weight:500;background:transparent;color:#8b949e">
                ${this.translation.translate('RECORDER.FS_LATER_BTN')}
              </button>
              <button id="fs-select"
                style="padding:7px 16px;border:none;border-radius:6px;cursor:pointer;
                       font-size:12px;font-weight:500;background:#2f81f7;color:#fff">
                ${this.translation.translate('RECORDER.FS_SELECT_BTN')}
              </button>
            </div>
          </div>`;

        document.getElementById('fs-skip')!.addEventListener('click', async () => {
          await this.persistence.setConfigKey('allowReadWriteFiles', 'false');
          Swal.close();
        });

        document.getElementById('fs-select')!.addEventListener('click', async () => {
          try {
            await this.persistence.requestDirectoryPermissions();
            Swal.close();
            showToast(this.translation.translate('RECORDER.FS_SUCCESS_TOAST'));
          } catch (e: unknown) {
            if ((e as DOMException)?.name !== 'AbortError') {
              showToast(this.translation.translate('RECORDER.FS_ERROR_TOAST'), false);
            }
            // AbortError = user cancelled the picker, leave dialog open
          }
        });
      },
    });
  }

  // ── dialogs ──────────────────────────────────────────────────────────────

  showCommandsDialog(): void {
    this.toggleModal('isCommandsDialogOpen', () => {
      Swal.fire({
        title: this.translation.translate('MAIN_FRAME.DIALOG_COMMANDS'),
        html: '<div id="commands-modal-content" style="min-height:250px;padding:0"></div>',
        showCloseButton: true,
        showConfirmButton: false,
        allowOutsideClick: false,
        width: 640,
        color: '#e6edf3',
        didOpen: () => {
          makeSwalDraggable();
          setSwal2DataCyAttribute();
          const container = document.getElementById('commands-modal-content');
          if (!container) return;

          const child = document.createElement('test-previsualizer') as any;
          child.translation = this.translation;
          child.commands = this.cypressCommands;
          child.interceptors = this.interceptors;
          child.editable = true;
          container.appendChild(child);
          this._previsualizerRef = child;

          child.addEventListener('deletecommand', (e: CustomEvent) => {
            this.recording.removeCommand(e.detail);
          });
          child.addEventListener('movecommand', (e: CustomEvent) => {
            this.recording.moveCommand(e.detail.from, e.detail.to);
          });
          child.addEventListener('deleteinterceptor', (e: CustomEvent) => {
            this.recording.removeInterceptor(e.detail);
          });

          // ── Assertion builder panel ──────────────────────────────────────
          const assertionHtml = `
            <div id="assertion-builder"
              style="padding:10px 12px;border-top:1px solid #21262d;background:#0d1117">
              <div style="font-size:10px;color:#484f58;text-transform:uppercase;letter-spacing:.8px;font-weight:600;margin-bottom:8px">
                ${this.translation.translate('RECORDER.ASSERTION_SECTION')}
              </div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:flex-end">
                <input id="assert-selector" type="text"
                  placeholder="${this.translation.translate('RECORDER.ASSERT_SELECTOR_PH').replace(/"/g, '&quot;')}"
                  style="flex:2;min-width:140px;padding:5px 8px;background:#161b22;border:1px solid #30363d;
                         border-radius:5px;color:#c9d1d9;font-size:11px;outline:none;
                         font-family:'Cascadia Code','Fira Code',monospace"/>
                <select id="assert-type"
                  style="padding:5px 8px;background:#161b22;border:1px solid #30363d;border-radius:5px;
                         color:#c9d1d9;font-size:11px;outline:none;cursor:pointer;flex-shrink:0">
                  <option value="be.visible">be.visible</option>
                  <option value="not.exist">not.exist</option>
                  <option value="be.disabled">be.disabled</option>
                  <option value="be.checked">be.checked</option>
                  <option value="contain.text">contain.text</option>
                  <option value="have.value">have.value</option>
                  <option value="have.length">have.length</option>
                  <option value="have.class">have.class</option>
                  <option value="have.attr">have.attr</option>
                </select>
                <input id="assert-value" type="text" placeholder="${this.translation.translate('RECORDER.ASSERT_VALUE_PH')}"
                  style="flex:2;min-width:110px;padding:5px 8px;background:#161b22;border:1px solid #30363d;
                         border-radius:5px;color:#c9d1d9;font-size:11px;outline:none"/>
                <button id="btn-add-assertion"
                  style="padding:5px 12px;border:none;border-radius:5px;cursor:pointer;
                         font-size:11px;font-weight:500;background:#2f81f7;color:#fff;
                         white-space:nowrap;flex-shrink:0">
                  ${this.translation.translate('RECORDER.ASSERT_ADD_BTN')}
                </button>
              </div>
            </div>`;
          container.insertAdjacentHTML('beforeend', assertionHtml);

          const NO_VALUE_ASSERTIONS = new Set(['be.visible', 'not.exist', 'be.disabled', 'be.checked']);
          document.getElementById('btn-add-assertion')?.addEventListener('click', () => {
            const sel  = (document.getElementById('assert-selector') as HTMLInputElement).value.trim();
            const type = (document.getElementById('assert-type')     as HTMLSelectElement).value;
            const val  = (document.getElementById('assert-value')    as HTMLInputElement).value.trim();
            if (!sel) return;
            const cmd = NO_VALUE_ASSERTIONS.has(type) || !val
              ? `cy.get('${sel}').should('${type}')`
              : `cy.get('${sel}').should('${type}', '${val}')`;
            this.recording.appendCommand(cmd);
            (document.getElementById('assert-selector') as HTMLInputElement).value = '';
            (document.getElementById('assert-value')    as HTMLInputElement).value = '';
          });
        },
        willClose: () => {
          this.isCommandsDialogOpen = false;
          this._previsualizerRef = null;
        },
      });
      this.resizePopup();
    });
  }

  showSavedTestsDialog(): void {
    this.toggleModal('isSavedTestsDialogOpen', () => {
      Swal.fire({
        title: this.translation.translate('MAIN_FRAME.DIALOG_SAVED_TESTS'),
        html: '<div id="saved-tests-modal-content" style="min-height:250px;padding:0"></div>',
        showCloseButton: true,
        showConfirmButton: false,
        width: 680,
        color: '#e6edf3',
        didOpen: () => {
          makeSwalDraggable();
          setSwal2DataCyAttribute();
          const container = document.getElementById('saved-tests-modal-content');
          if (!container) return;
          const child = document.createElement('test-editor') as any;
          child.persistence = this.persistence;
          child.translation = this.translation;
          container.appendChild(child);
        },
        willClose: () => { this.isSavedTestsDialogOpen = false; },
      });
      this.resizePopup();
    });
  }

  showSaveTestDialog(): void {
    this.toggleModal('isSaveTestDialogOpen', () => {
      Swal.fire({
        title: this.translation.translate('MAIN_FRAME.DIALOG_SAVE'),
        html: '<div id="save-test-modal-content" style="padding:0"></div>',
        showCloseButton: true,
        showConfirmButton: false,
        color: '#e6edf3',
        didOpen: () => {
          makeSwalDraggable();
          setSwal2DataCyAttribute();
          const container = document.getElementById('save-test-modal-content');
          if (!container) return;
          const child = document.createElement('save-test') as any;
          child.translation = this.translation;
          container.appendChild(child);
          child.addEventListener('savetest', (e: CustomEvent) => {
            const { description, tags } = e.detail ?? {};
            this.onSaveTest(description ?? null, tags ?? []);
            Swal.close();
          });
          child.addEventListener('saveandexport', (e: CustomEvent) => {
            const { description, tags } = e.detail ?? {};
            this.onSaveAndExportTest(description ?? null, tags ?? []);
            Swal.close();
          });
        },
        willClose: () => { this.isSaveTestDialogOpen = false; },
      });
    });
  }

  showSettingsDialog(): void {
    this.toggleModal('isSettingsDialogOpen', () => {
      Swal.fire({
        title: this.translation.translate('MAIN_FRAME.SETTINGS'),
        html: '<div id="settings-modal-content" style="padding:0"></div>',
        showCloseButton: true,
        showConfirmButton: false,
        width: 520,
        color: '#e6edf3',
        didOpen: () => {
          makeSwalDraggable();
          setSwal2DataCyAttribute();
          const container = document.getElementById('settings-modal-content');
          if (!container) return;
          const child = document.createElement('e2e-configuration') as any;
          child.persistence = this.persistence;
          child.translation = this.translation;
          container.appendChild(child);
          child.addEventListener('smartselectorchange', (e: CustomEvent) => {
            this.smartSelectorEnabled = e.detail;
          });
        },
        willClose: () => { this.isSettingsDialogOpen = false; },
      });
      this.resizePopup();
    });
  }

  showAdvancedEditorDialog(testId?: number): void {
    this.toggleModal('isAdvancedEditorDialogOpen', () => {
      Swal.fire({
        title: this.translation.translate('MAIN_FRAME.SHOW_ADVANCED_EDITOR'),
        html: '<div id="advanced-editor-modal-content" style="min-height:300px;padding:0"></div>',
        showCloseButton: true,
        showConfirmButton: false,
        width: 780,
        color: '#e6edf3',
        didOpen: () => {
          makeSwalDraggable();
          setSwal2DataCyAttribute();
          const container = document.getElementById('advanced-editor-modal-content');
          if (!container) return;
          const child = document.createElement('advanced-test-editor') as any;
          child.persistence = this.persistence;
          child.translation = this.translation;
          if (testId !== undefined) child.testId = testId;
          container.appendChild(child);
          child.addEventListener('selectorstrategychange', (e: CustomEvent) => {
            this.recording.selectorStrategy = e.detail;
          });
          child.addEventListener('closemodal', () => Swal.close());
          child.addEventListener('openfileeditor', (e: CustomEvent) => {
            Swal.close();
            setTimeout(() => this.showFileEditorDialog(
              e.detail.handle, e.detail.content, e.detail.fileName, e.detail.testId,
              e.detail.itBlock, e.detail.interceptorsBlock,
            ), 150);
          });
        },
        willClose: () => { this.isAdvancedEditorDialogOpen = false; },
      });
      this.resizePopup();
    });
  }

  private showFileEditorDialog(
    handle: FileSystemFileHandle,
    content: string,
    fileName: string,
    testId?: number,
    itBlock = '',
    interceptorsBlock = '',
  ): void {
    Swal.fire({
      title: this.translation.translate('RECORDER.FILE_EDITOR_TITLE'),
      html: '<div id="file-editor-modal-content" style="padding:0;height:540px"></div>',
      showCloseButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
      width: 1100,
      color: '#e6edf3',
      didOpen: () => {
        makeSwalDraggable();
        setSwal2DataCyAttribute();
        const container = document.getElementById('file-editor-modal-content');
        if (!container) return;
        const child = document.createElement('file-preview') as any;
        child.translation = this.translation;
        child.fileContent = content;
        child.fileName = fileName;
        child.closeLabel = this.translation.translate('FILE_PREVIEW.BACK_TO_EDITOR');
        child.itBlock = itBlock;
        child.interceptorsBlock = interceptorsBlock;
        container.appendChild(child);
        child.addEventListener('close', () => {
          Swal.close();
          setTimeout(() => this.showAdvancedEditorDialog(testId), 150);
        });
        child.addEventListener('save', async (e: CustomEvent) => {
          try {
            const writable = await (handle as any).createWritable();
            await writable.write(e.detail);
            await writable.close();
            showToast(this.translation.translate('RECORDER.FILE_SAVED_TOAST'));
          } catch {
            showToast(this.translation.translate('RECORDER.FILE_SAVE_ERROR_TOAST'), false);
          }
          Swal.close();
          setTimeout(() => this.showAdvancedEditorDialog(testId), 150);
        });
      },
    });
    this.resizePopup();
  }

  // ── save handlers ─────────────────────────────────────────────────────────

  private async onSaveTest(description: string | null, tags: string[] = []): Promise<void> {
    if (description) {
      await this.persistence.insertTest(description, this.cypressCommands, this.interceptors, tags);
      this.recording.clearCommands();
      this.clearRecordingHistory();
      this.cypressCommands = [];
      this.interceptors = [];
    }
  }

  private async onSaveAndExportTest(description: string | null, tags: string[] = []): Promise<void> {
    if (description) {
      const id = await this.persistence.insertTest(description, this.cypressCommands, this.interceptors, tags);
      this.recording.clearCommands();
      this.clearRecordingHistory();
      this.cypressCommands = [];
      this.interceptors = [];
      setTimeout(() => this.showAdvancedEditorDialog(id), 300);
    }
  }

  // ── helpers ───────────────────────────────────────────────────────────────

  private toggleModal(flag: keyof this, openFn: () => void): void {
    if (this[flag]) {
      Swal.close();
      (this as Record<string, unknown>)[flag as string] = false;
      return;
    }
    (this as Record<string, unknown>)[flag as string] = true;
    openFn();
  }

  private resizePopup(): void {
    setTimeout(() => {
      const popup = Swal.getPopup();
      if (popup) makeModalResizable(popup, { minWidth: 400, minHeight: 200 });
    }, 0);
  }

  private render(): void {
    const rec    = this.isRecording;
    const paused = this.isPaused;
    this.shadow.innerHTML = `<style>${getRecorderStyles(rec, paused)}</style>${renderRecorderWidget(rec, paused, this.translation.translate.bind(this.translation))}`;
    this.shadow.querySelector('[data-action="toggle"]')!
      .addEventListener('click', () => this.toggle());
    this.shadow.querySelector('[data-action="pause"]')
      ?.addEventListener('click', () => this.togglePause());
    this.shadow.querySelector('[data-action="tests"]')!
      .addEventListener('click', () => this.showSavedTestsDialog());
    this.shadow.querySelector('[data-action="commands"]')!
      .addEventListener('click', () => this.showCommandsDialog());
    this.shadow.querySelector('[data-action="config"]')!
      .addEventListener('click', () => this.showSettingsDialog());
    this.shadow.querySelector('[data-action="browse"]')!
      .addEventListener('click', () => this.showAdvancedEditorDialog());
  }
}

if (!customElements.get('lib-e2e-recorder')) {
  customElements.define('lib-e2e-recorder', LibE2eRecorderElement);
}
