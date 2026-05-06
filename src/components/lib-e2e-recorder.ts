import Swal from 'sweetalert2';
import { RecordingService } from '../services/recording.service';
import { PersistenceService } from '../services/persistence.service';
import { TranslationService } from '../services/translation.service';
import { HttpMonitor } from '../services/http-monitor';
import {
  injectStyles,
  LIB_E2E_CYPRESS_FOR_DUMMYS_SWAL2_STYLES,
  SCROLLBAR_STYLES,
} from '../utils/styles.utils';
import {
  makeModalResizable,
  makeSwalDraggable,
  setSwal2DataCyAttribute,
} from '../utils/modal.utils';
import type { Lang } from '../models/lang.model';

export class LibE2eRecorderElement extends HTMLElement {
  private shadow: ShadowRoot;
  private keydownHandler!: (e: KeyboardEvent) => void;
  private recordingUnsub?: () => void;
  private commandsUnsub?: () => void;
  private interceptorsUnsub?: () => void;
  private controlFirstTimeData = true;
  private _previsualizerRef: any = null;
  private httpMonitor?: HttpMonitor;

  recording!: RecordingService;
  persistence!: PersistenceService;
  translation!: TranslationService;

  isRecording = false;
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
    if (!this.recording) this.recording = new RecordingService();
    if (!this.persistence) this.persistence = new PersistenceService();
    if (!this.translation) this.translation = new TranslationService();

    this.httpMonitor = new HttpMonitor(this.recording);
    this.httpMonitor.install();

    injectStyles(LIB_E2E_CYPRESS_FOR_DUMMYS_SWAL2_STYLES, 'lib-e2e-swal2-styles');
    injectStyles(SCROLLBAR_STYLES, 'lib-e2e-scrollbar-styles');

    this.initHttpConfig();
    this.initLanguage();
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
  }

  toggle(): void {
    this.recording.toggleRecording();
  }

  setLanguage(lang?: string): void {
    const resolved = lang ? (lang as Lang) : this.translation.detectLang();
    this.translation.setLang(resolved);
  }

  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!event.ctrlKey) return;
    const key = event.key.toLowerCase();
    if (key === 'r')      { event.preventDefault(); this.toggle(); }
    else if (key === '1') { event.preventDefault(); this.showSavedTestsDialog(); }
    else if (key === '2') { event.preventDefault(); this.showCommandsDialog(); }
    else if (key === '3') { event.preventDefault(); this.showSettingsDialog(); }
  }

  // ── dialogs ──────────────────────────────────────────────────────────────

  showCommandsDialog(): void {
    this.toggleModal('isCommandsDialogOpen', () => {
      Swal.fire({
        title: this.translation.translate('MAIN_FRAME.DIALOG_COMMANDS'),
        html: '<div id="commands-modal-content" style="min-height:250px;padding:0"></div>',
        showCloseButton: true,
        showConfirmButton: false,
        width: 640,
        background: '#181c24',
        color: '#fff',
        didOpen: () => {
          makeSwalDraggable();
          setSwal2DataCyAttribute();
          const container = document.getElementById('commands-modal-content');
          if (!container) return;
          const child = document.createElement('test-previsualizer') as any;
          child.commands = this.cypressCommands;
          child.interceptors = this.interceptors;
          container.appendChild(child);
          this._previsualizerRef = child;
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
        background: '#181c24',
        color: '#fff',
        didOpen: () => {
          makeSwalDraggable();
          setSwal2DataCyAttribute();
          const container = document.getElementById('saved-tests-modal-content');
          if (!container) return;
          const child = document.createElement('test-editor') as any;
          child.persistence = this.persistence;
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
        background: '#181c24',
        color: '#fff',
        didOpen: () => {
          makeSwalDraggable();
          setSwal2DataCyAttribute();
          const container = document.getElementById('save-test-modal-content');
          if (!container) return;
          const child = document.createElement('save-test') as any;
          container.appendChild(child);
          child.addEventListener('savetest', (e: CustomEvent) => {
            this.onSaveTest(e.detail);
            Swal.close();
          });
          child.addEventListener('saveandexport', (e: CustomEvent) => {
            this.onSaveAndExportTest(e.detail);
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
        background: '#181c24',
        color: '#fff',
        didOpen: () => {
          makeSwalDraggable();
          setSwal2DataCyAttribute();
          const container = document.getElementById('settings-modal-content');
          if (!container) return;
          const child = document.createElement('e2e-configuration') as any;
          child.persistence = this.persistence;
          child.translation = this.translation;
          container.appendChild(child);
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
        background: '#181c24',
        color: '#fff',
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
          child.addEventListener('closemodal', () => Swal.close());
        },
        willClose: () => { this.isAdvancedEditorDialogOpen = false; },
      });
      this.resizePopup();
    });
  }

  // ── save handlers ─────────────────────────────────────────────────────────

  private async onSaveTest(description: string | null): Promise<void> {
    if (description) {
      await this.persistence.insertTest(description, this.cypressCommands, this.interceptors);
      this.recording.clearCommands();
      this.cypressCommands = [];
      this.interceptors = [];
    }
  }

  private async onSaveAndExportTest(description: string | null): Promise<void> {
    if (description) {
      const id = await this.persistence.insertTest(description, this.cypressCommands, this.interceptors);
      this.recording.clearCommands();
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
    this.shadow.innerHTML = `
      <style>
        :host { all: initial; }
        *, *::before, *::after { box-sizing: border-box; }
        .widget {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 2147483647;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .toolbar {
          display: flex;
          gap: 2px;
          background: rgba(13, 17, 23, 0.95);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: 4px;
          border-radius: 10px;
          border: 1px solid rgba(48, 54, 61, 0.9);
          box-shadow: 0 8px 32px rgba(0,0,0,0.55);
        }
        .btn-action {
          position: relative;
          width: 30px;
          height: 30px;
          border: none;
          border-radius: 7px;
          cursor: pointer;
          background: transparent;
          color: #8b949e;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.12s;
        }
        .btn-action:hover { background: #21262d; color: #e6edf3; }
        .btn-action:active { background: #30363d; }
        .btn-action::after {
          content: attr(data-tooltip);
          position: absolute;
          bottom: calc(100% + 7px);
          left: 50%;
          transform: translateX(-50%);
          background: #1c2128;
          color: #e6edf3;
          font-size: 11px;
          font-weight: 500;
          padding: 3px 8px;
          border-radius: 5px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s;
          border: 1px solid #30363d;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        .btn-action:hover::after { opacity: 1; }
        .btn-toggle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          font-size: 17px;
          background: ${this.isRecording ? 'linear-gradient(135deg, #f85149 0%, #da3633 100%)' : 'linear-gradient(135deg, #2f81f7 0%, #1f6feb 100%)'};
          color: #fff;
          box-shadow: ${this.isRecording ? '0 4px 16px rgba(248,81,73,0.5), 0 0 0 3px rgba(248,81,73,0.12)' : '0 4px 16px rgba(47,129,247,0.4), 0 0 0 3px rgba(47,129,247,0.1)'};
          transition: transform 0.15s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-toggle:hover { transform: scale(1.08); }
        .btn-toggle:active { transform: scale(0.94); }
        .rec-badge {
          position: fixed;
          top: 14px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(90deg, #f85149, #da3633);
          color: #fff;
          padding: 3px 16px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          z-index: 2147483647;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          box-shadow: 0 4px 16px rgba(248,81,73,0.4);
          display: ${this.isRecording ? 'block' : 'none'};
          animation: rec-pulse 1.8s ease-in-out infinite;
        }
        @keyframes rec-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.65; }
        }
      </style>
      <div class="widget">
        <div class="toolbar">
          <button class="btn-action" data-action="tests"    data-tooltip="Tests">📋</button>
          <button class="btn-action" data-action="commands" data-tooltip="Comandos">⌨️</button>
          <button class="btn-action" data-action="config"   data-tooltip="Config">⚙️</button>
        </div>
        <button class="btn-toggle" data-action="toggle"
          title="${this.isRecording ? 'Detener (Ctrl+R)' : 'Grabar (Ctrl+R)'}">
          ${this.isRecording ? '⏹' : '⏺'}
        </button>
      </div>
      <div class="rec-badge">● REC</div>
    `;
    this.shadow.querySelector('[data-action="toggle"]')!
      .addEventListener('click', () => this.toggle());
    this.shadow.querySelector('[data-action="tests"]')!
      .addEventListener('click', () => this.showSavedTestsDialog());
    this.shadow.querySelector('[data-action="commands"]')!
      .addEventListener('click', () => this.showCommandsDialog());
    this.shadow.querySelector('[data-action="config"]')!
      .addEventListener('click', () => this.showSettingsDialog());
  }
}

if (!customElements.get('lib-e2e-recorder')) {
  customElements.define('lib-e2e-recorder', LibE2eRecorderElement);
}
