import Swal, { type SweetAlertOptions } from 'sweetalert2';
import { getRecorderStyles } from './lib-e2e-recorder.styles';
import { renderRecorderWidget } from './lib-e2e-recorder.template';
import { injectAssertionBuilder } from './assertion-builder';
import { mountFilesystemSetupContent } from './filesystem-setup';
import { mountComponentInSwal } from '../../utils/swal-mount.utils';
import { RecordingService, type SelectorStrategy } from '../../services/recording.service';
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
  ensurePopupDimensions,
} from '../../utils/modal.utils';
import type { Lang } from '../../models/lang.model';
import type { LoginSetupConfig } from '../../models/login-setup.model';
import {
  type ActiveSessionState,
  ACTIVE_SESSION_BREADCRUMB_KEY,
  RESUME_TTL_CONFIG_KEY,
  DEFAULT_RESUME_TTL_MINUTES,
} from '../../models/active-session.model';
import {
  type ExpandDirection,
  type Point,
  DRAG_THRESHOLD,
  clampTogglePosition,
  resolveExpandDirection,
  defaultTogglePosition,
  boxTopLeftFor,
} from '../../utils/widget-position.utils';
import { showToast } from '../../utils/toast.utils';
import { DEFAULT_ISSUE_TRACKER_CONFIG, type IssueTrackerConfig, type IssueTrackerProvider } from '../../models/issue-tracker.model';
import { toFixtureInterceptors, simplifyFixtureWaits } from '../../utils/fixture-convert.utils';

/**
 * Minimal property/event shapes for dynamically-created child custom elements.
 * Not extending HTMLElement avoids conflicts with the strict EventListener signature;
 * cast to Node/HTMLElement only for actual DOM insertion.
 */
interface PrevisualizerEl {
  translation: TranslationService; commands: string[]; interceptors: string[]; editable: boolean;
  addEventListener(type: string, listener: (e: CustomEvent) => void): void;
}
interface TestEditorEl { persistence: PersistenceService; translation: TranslationService; issueTrackerConfig: IssueTrackerConfig; groupByTicket: boolean; }
interface SaveTestEl {
  translation: TranslationService;
  issueTrackerConfig: IssueTrackerConfig;
  addEventListener(type: string, listener: (e: CustomEvent) => void): void;
}
interface ConfigEl {
  persistence: PersistenceService; translation: TranslationService;
  addEventListener(type: string, listener: (e: CustomEvent) => void): void;
}
interface AdvancedEditorEl {
  persistence: PersistenceService; translation: TranslationService; testId?: number;
  loginSetupConfig: LoginSetupConfig | null;
  addEventListener(type: string, listener: (e: CustomEvent) => void | Promise<void>): void;
}
interface FilePreviewEl {
  translation: TranslationService; fileContent: string | null; fileName: string | null;
  closeLabel: string; itBlock: string; interceptorsBlock: string; notes: string;
  addEventListener(type: string, listener: (e: CustomEvent) => void | Promise<void>): void;
}
interface SelectorPickerEl {
  targetElement: HTMLElement; recording: RecordingService; translation: TranslationService;
}
interface HelpPanelEl { translation: TranslationService }

export class LibE2eRecorderElement extends HTMLElement {
  private shadow: ShadowRoot;
  private _isDisabled = false;
  private keydownHandler!: (e: KeyboardEvent) => void;
  private recordingUnsub?: () => void;
  private commandsUnsub?: () => void;
  private interceptorsUnsub?: () => void;
  private pauseUnsub?: () => void;
  private selectorNotFoundUnsub?: () => void;
  private langUnsub?: () => void;
  private sessionUnsub?: () => void;
  private sessionSaveTimer?: ReturnType<typeof setTimeout>;
  private controlFirstTimeData = true;

  // ── draggable widget (spec 007) ──
  private togglePos: Point | null = null;
  private expandDir: ExpandDirection = 'up-left';
  private dragState?: { startX: number; startY: number; origX: number; origY: number; moved: boolean };
  private suppressNextToggleClick = false;
  private widgetPointerMove?: (e: MouseEvent) => void;
  private widgetPointerUp?: () => void;
  private widgetResize?: () => void;
  private _previsualizerRef: { commands: string[]; interceptors: string[] } | null = null;
  private httpMonitor?: HttpMonitor;
  private smartSelectorEnabled = true;
  private _needsRecordingRebuild = false;
  private issueTrackerConfig: IssueTrackerConfig = { ...DEFAULT_ISSUE_TRACKER_CONFIG };

  recording!: RecordingService;
  persistence!: PersistenceService;
  translation!: TranslationService;

  isVisible = false;
  isRecording = false;
  isPaused = false;
  cypressCommands: string[] = [];
  interceptors: string[] = [];

  isCommandsDialogOpen = false;
  isSavedTestsDialogOpen = false;
  isSaveTestDialogOpen = false;
  isSettingsDialogOpen = false;
  isAdvancedEditorDialogOpen = false;
  isHelpDialogOpen = false;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    if ('Cypress' in window) {
      this._isDisabled = true;
      return;
    }
    if (!this.getAttribute('data-cy')) {
      this.setAttribute('data-cy', 'lib-e2e-cypress-for-dummys');
    }
    // Build a fresh recording service on first connect, or rebuild after a
    // disconnect destroyed the previous one (its listeners are dead). spec 008.
    if (!this.recording || this._needsRecordingRebuild) {
      this.recording = new RecordingService();
      this._needsRecordingRebuild = false;
    }
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
    this.initVisibility();
    this.initSessionContinuity();
    this.initWidgetPosition();

    this.keydownHandler = (e: KeyboardEvent) => this.handleKeyboardEvent(e);
    window.addEventListener('keydown', this.keydownHandler);

    // Draggable widget (spec 007): pointer move/up tracked at window level so the
    // drag keeps working even if the cursor leaves the toggle button.
    this.widgetPointerMove = (e: MouseEvent) => this.onWidgetPointerMove(e);
    this.widgetPointerUp = () => this.onWidgetPointerUp();
    this.widgetResize = () => this.applyWidgetPosition();
    window.addEventListener('pointermove', this.widgetPointerMove as EventListener);
    window.addEventListener('pointerup', this.widgetPointerUp);
    window.addEventListener('resize', this.widgetResize);
  }

  disconnectedCallback(): void {
    if (this._isDisabled) return;
    window.removeEventListener('keydown', this.keydownHandler);
    // Final flush: if a recording is in progress, persist it synchronously-ish
    // before tearing the service down, so an unmount (single-spa per-sub-project
    // placement) does not lose the last commands. The realm survives client-side
    // navigation, so this async write completes even after the element is gone.
    this.flushActiveSessionOnDisconnect();
    this.recordingUnsub?.();
    this.commandsUnsub?.();
    this.interceptorsUnsub?.();
    this.pauseUnsub?.();
    this.selectorNotFoundUnsub?.();
    this.langUnsub?.();
    this.sessionUnsub?.();
    if (this.widgetPointerMove) window.removeEventListener('pointermove', this.widgetPointerMove as EventListener);
    if (this.widgetPointerUp) window.removeEventListener('pointerup', this.widgetPointerUp);
    if (this.widgetResize) window.removeEventListener('resize', this.widgetResize);
    this.httpMonitor?.uninstall();
    this.recording.destroy();
    // The service's AbortController is now spent (DOM listeners are dead) and the
    // patched history methods are restored. Flag a rebuild so a reconnect of the
    // SAME element gets a FRESH service + monitor (the buffer is recovered from
    // IndexedDB by initSessionContinuity, spec 006). We do NOT null the reference
    // here — the Subjects stay functional, so any in-flight async (e.g. a deferred
    // save calling clearCommands) won't hit `undefined`.
    this._needsRecordingRebuild = true;
  }

  // HttpMonitor reads extendedHttpCommands and fixtureMode synchronously inside
  // fetch/XHR interception handlers, so they must live in localStorage (sync).
  // IndexedDB is the persistent source of truth; this method mirrors it into
  // localStorage on every mount so the sync cache is always fresh.
  private async initHttpConfig(): Promise<void> {
    const config = await this.persistence.getConfig('extendedHttpCommands');
    if (config === null) {
      await this.persistence.setConfig({ extendedHttpCommands: 'true' });
      localStorage.setItem('extendedHttpCommands', 'true');
    } else {
      localStorage.setItem('extendedHttpCommands', (config['extendedHttpCommands'] as string) ?? 'true');
    }
    const fx = await this.persistence.getConfig('fixtureMode');
    localStorage.setItem('fixtureMode', (fx?.['fixtureMode'] as string) ?? 'false');
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
        // Stopping the recording ends the cross-app session: only an actively
        // recording session is ever persisted/resumed (spec 006, Q2).
        this.clearSessionPersistence();
        this.showSaveTestDialog();
      }
      this.controlFirstTimeData = false;
      this.render();
    });
    // Persist the live session incrementally so it survives a micro-frontend
    // crossing or a same-origin reload (spec 006).
    this.sessionUnsub = this.recording.onSessionChange((state) => this.persistActiveSession(state));
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
    // Re-render the widget chrome when the UI language changes so labels update live.
    this.langUnsub = this.translation.onLangChange(() => this.render());
  }

  private showSelectorPicker(target: HTMLElement): void {
    import('../../components/selector-picker/selector-picker').then(() => {
      const existing = document.querySelector('lib-e2e-selector-picker');
      if (existing) existing.remove();

      const picker = document.createElement('lib-e2e-selector-picker') as unknown as SelectorPickerEl;
      picker.targetElement = target;
      picker.recording = this.recording;
      picker.translation = this.translation;
      document.body.appendChild(picker as unknown as Node);
    });
  }

  private async initVisibility(): Promise<void> {
    if (this.hasAttribute('start-hidden')) {
      // Attribute overrides DB: presence → hidden, explicit "false" → visible
      this.isVisible = this.getAttribute('start-hidden') === 'false';
      this.style.display = this.isVisible ? '' : 'none';
      return;
    }
    const config = await this.persistence.getGeneralConfig();
    this.isVisible = config?.['startHidden'] !== 'true';
    this.style.display = this.isVisible ? '' : 'none';
  }

  private async initSelectorStrategy(): Promise<void> {
    const config = await this.persistence.getGeneralConfig();
    const strategy = config?.['selectorStrategy'] as string | undefined;
    if (strategy) this.recording.selectorStrategy = strategy as SelectorStrategy;
    this.smartSelectorEnabled = config?.['smartSelectorEnabled'] !== 'false';
    this.issueTrackerConfig = {
      enabled:  config?.['issueTrackerEnabled']  === 'true',
      provider: (config?.['issueTrackerProvider'] as IssueTrackerProvider) ?? DEFAULT_ISSUE_TRACKER_CONFIG.provider,
      baseUrl:  (config?.['issueTrackerBaseUrl']  as string) ?? '',
    };
  }

  // ── cross-app session continuity (spec 006) ───────────────────────────────

  /**
   * On mount, detect a persisted live recording session and either resume it
   * silently (recent) or prompt continue/discard (stale). No-op when there is
   * no actively-recording session.
   */
  private async initSessionContinuity(): Promise<void> {
    if (this._isDisabled) return;
    const session = await this.persistence.getActiveSession();
    if (!session || !session.isRecording) return;
    const ttlMin = await this.getResumeTtlMinutes();
    const ageMs = Date.now() - session.updatedAt;
    if (ageMs <= ttlMin * 60_000) {
      this.resumeSessionState(session);
    } else {
      this.promptResumeOrDiscard(session);
    }
  }

  private async getResumeTtlMinutes(): Promise<number> {
    const config = await this.persistence.getConfig(RESUME_TTL_CONFIG_KEY);
    const raw = config?.[RESUME_TTL_CONFIG_KEY];
    const n = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_RESUME_TTL_MINUTES;
  }

  /** Rehydrates the recorder from a persisted session (no bootstrap re-emitted). */
  private resumeSessionState(session: ActiveSessionState): void {
    this.recording.restoreSession(session);
    this.cypressCommands = session.commands;
    this.interceptors = session.interceptors;
    this.controlFirstTimeData = false;
    this.render();
  }

  private async promptResumeOrDiscard(session: ActiveSessionState): Promise<void> {
    const t = this.translation.translate.bind(this.translation);
    const result = await Swal.fire({
      title: t('RECORDER.SESSION_RESUME_TITLE'),
      html:
        `<div style="padding:8px 4px;color:#8b949e;font-size:13px;line-height:1.6">` +
        `<p>${t('RECORDER.SESSION_RESUME_TEXT')}</p>` +
        `<p style="margin-top:6px;color:#c9d1d9"><b>${session.commands.length}</b> ${t('RECORDER.SESSION_RESUME_COUNT')}</p>` +
        `</div>`,
      showCancelButton: true,
      confirmButtonText: t('RECORDER.SESSION_CONTINUE_BTN'),
      cancelButtonText: t('RECORDER.SESSION_DISCARD_BTN'),
      color: '#e6edf3',
    });
    if (result && (result as { isConfirmed?: boolean }).isConfirmed) {
      this.resumeSessionState(session);
    } else {
      this.discardSession();
    }
  }

  /** Debounced persistence of the live session; clears it the moment recording stops. */
  private persistActiveSession(state: ActiveSessionState): void {
    if (this._isDisabled) return;
    if (!state.isRecording) {
      this.clearSessionPersistence();
      return;
    }
    this.writeSessionBreadcrumb(state);
    if (this.sessionSaveTimer) clearTimeout(this.sessionSaveTimer);
    this.sessionSaveTimer = setTimeout(() => {
      const snap = this.recording.getSessionSnapshot();
      if (snap.isRecording) this.persistence.saveActiveSession(snap).catch(() => { /* storage errors are non-fatal */ });
    }, 300);
  }

  private writeSessionBreadcrumb(state: ActiveSessionState): void {
    try {
      localStorage.setItem(ACTIVE_SESSION_BREADCRUMB_KEY, JSON.stringify({
        sessionId: state.sessionId,
        isRecording: state.isRecording,
        updatedAt: state.updatedAt,
      }));
    } catch { /* ignore storage errors */ }
  }

  private flushActiveSessionOnDisconnect(): void {
    const snap = this.recording.getSessionSnapshot();
    if (!snap.isRecording) return;
    if (this.sessionSaveTimer) clearTimeout(this.sessionSaveTimer);
    this.writeSessionBreadcrumb(snap);
    this.persistence.saveActiveSession(snap).catch(() => { /* non-fatal */ });
  }

  private clearSessionPersistence(): void {
    if (this.sessionSaveTimer) { clearTimeout(this.sessionSaveTimer); this.sessionSaveTimer = undefined; }
    try { localStorage.removeItem(ACTIVE_SESSION_BREADCRUMB_KEY); } catch { /* ignore */ }
    this.persistence.clearActiveSession().catch(() => { /* non-fatal */ });
  }

  /** True when a synchronous breadcrumb marks an active recording session. */
  hasActiveSession(): boolean {
    try {
      const raw = localStorage.getItem(ACTIVE_SESSION_BREADCRUMB_KEY);
      if (!raw) return false;
      return !!(JSON.parse(raw) as { isRecording?: boolean }).isRecording;
    } catch { return false; }
  }

  /** Programmatically resume the persisted session, if any. */
  resumeSession(): void {
    this.persistence.getActiveSession().then((s) => { if (s) this.resumeSessionState(s); });
  }

  /** Discard the persisted live session (breadcrumb + DB record). */
  discardSession(): void {
    this.clearSessionPersistence();
  }

  // ── draggable widget (spec 007) ────────────────────────────────────────────

  /** Loads a previously saved widget position and applies it. */
  private async initWidgetPosition(): Promise<void> {
    const config = await this.persistence.getGeneralConfig();
    const pos = config?.['widgetPosition'] as Partial<Point> | null | undefined;
    if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
      this.togglePos = { x: pos.x, y: pos.y };
    }
    this.applyWidgetPosition();
  }

  /** Positions the `.widget` box from the (clamped) toggle centre and orients the arc. */
  private applyWidgetPosition(): void {
    const widget = this.shadow.querySelector('.widget') as HTMLElement | null;
    if (!widget) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const centre = this.togglePos ?? defaultTogglePosition(vw, vh);
    const clamped = clampTogglePosition(centre.x, centre.y, vw, vh);
    this.expandDir = resolveExpandDirection(clamped.x, clamped.y, vw, vh);
    const topLeft = boxTopLeftFor(clamped, this.expandDir);
    widget.style.left = `${topLeft.x}px`;
    widget.style.top = `${topLeft.y}px`;
    widget.style.right = 'auto';
    widget.style.bottom = 'auto';
    widget.setAttribute('data-expand', this.expandDir);
  }

  private beginWidgetDrag(e: MouseEvent): void {
    // Clear any stale suppression from a previous drag that ended off the toggle
    // (no click fired there), so this fresh press can't swallow a genuine click.
    this.suppressNextToggleClick = false;
    const origin = this.togglePos ?? defaultTogglePosition(window.innerWidth, window.innerHeight);
    this.dragState = { startX: e.clientX, startY: e.clientY, origX: origin.x, origY: origin.y, moved: false };
  }

  private onWidgetPointerMove(e: MouseEvent): void {
    if (!this.dragState) return;
    const dx = e.clientX - this.dragState.startX;
    const dy = e.clientY - this.dragState.startY;
    if (!this.dragState.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    this.dragState.moved = true;
    this.togglePos = { x: this.dragState.origX + dx, y: this.dragState.origY + dy };
    this.applyWidgetPosition();
  }

  private onWidgetPointerUp(): void {
    if (!this.dragState) return;
    const moved = this.dragState.moved;
    this.dragState = undefined;
    if (!moved || !this.togglePos) return;
    // It was a drag, not a click: suppress the click that fires next and persist.
    this.suppressNextToggleClick = true;
    const clamped = clampTogglePosition(this.togglePos.x, this.togglePos.y, window.innerWidth, window.innerHeight);
    this.togglePos = clamped;
    this.persistence.setConfig({ widgetPosition: clamped }).catch(() => { /* non-fatal */ });
  }

  /** Resets the widget to its default corner and clears the saved position. */
  resetWidgetPosition(): void {
    this.togglePos = null;
    this.persistence.setConfig({ widgetPosition: null }).catch(() => { /* non-fatal */ });
    this.applyWidgetPosition();
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
    if (key === 'e' && event.shiftKey) { event.preventDefault(); this.toggleVisibility(); return; }
    if (!this.isVisible) return;
    if (key === 'r')      { event.preventDefault(); this.toggle(); }
    else if (key === 'p') { event.preventDefault(); this.togglePause(); }
    else if (key === '1') { event.preventDefault(); this.showSavedTestsDialog(); }
    else if (key === '2') { event.preventDefault(); this.showCommandsDialog(); }
    else if (key === '3') { event.preventDefault(); this.showSettingsDialog(); }
    else if (key === 'h' && event.shiftKey) { event.preventDefault(); this.showHelpDialog(); }
  }

  toggleVisibility(): void {
    this.isVisible = !this.isVisible;
    this.style.display = this.isVisible ? '' : 'none';
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
    const t = this.translation.translate.bind(this.translation);
    Swal.fire({
      title: t('RECORDER.FS_TITLE'),
      html: '<div id="fs-setup-content"></div>',
      showCloseButton: true,
      showConfirmButton: false,
      didOpen: () => {
        makeSwalDraggable();
        setSwal2DataCyAttribute();
        const container = document.getElementById('fs-setup-content');
        if (!container) return;
        mountFilesystemSetupContent(
          container,
          t,
          async () => {
            await this.persistence.setConfigKey('allowReadWriteFiles', 'false');
            Swal.close();
          },
          async () => {
            try {
              await this.persistence.requestDirectoryPermissions();
              Swal.close();
              showToast(t('RECORDER.FS_SUCCESS_TOAST'));
            } catch (e: unknown) {
              if ((e as DOMException)?.name !== 'AbortError') {
                showToast(t('RECORDER.FS_ERROR_TOAST'), false);
              }
              // AbortError = user cancelled the picker, leave dialog open
            }
          },
        );
      },
    });
  }

  // ── dialogs ──────────────────────────────────────────────────────────────

  showCommandsDialog(): void {
    this.openSwalDialog(
      'isCommandsDialogOpen',
      'commands-modal-content',
      {
        title: this.translation.translate('MAIN_FRAME.DIALOG_COMMANDS'),
        html: '<div id="commands-modal-content" style="min-height:250px;padding:0"></div>',
        showCloseButton: true, allowOutsideClick: false, backdrop: false, width: 640,
      },
      (container) => {
        const child = mountComponentInSwal<PrevisualizerEl>('lib-e2e-test-previsualizer', container, {
          translation: this.translation,
          commands: this.cypressCommands,
          interceptors: this.interceptors,
          editable: true,
        }, [
          { name: 'deletecommand', handler: (e) => this.recording.removeCommand(e.detail) },
          { name: 'movecommand', handler: (e) => this.recording.moveCommand(e.detail.from, e.detail.to) },
          { name: 'deleteinterceptor', handler: (e) => this.recording.removeInterceptor(e.detail) },
        ]);
        this._previsualizerRef = child;
        injectAssertionBuilder(container, this.translation.translate.bind(this.translation), (cmd) => this.recording.appendCommand(cmd));
      },
      {
        // Make the container click-through so the page underneath remains interactive
        onDidOpenPreamble: () => {
          const swalContainer = document.querySelector('.swal2-container') as HTMLElement | null;
          if (swalContainer) {
            swalContainer.style.pointerEvents = 'none';
            const popup = swalContainer.querySelector('.swal2-popup') as HTMLElement | null;
            if (popup) popup.style.pointerEvents = 'all';
          }
        },
        onWillClose: () => { this._previsualizerRef = null; },
      },
    );
  }

  showSavedTestsDialog(): void {
    this.openSwalDialog(
      'isSavedTestsDialogOpen',
      'saved-tests-modal-content',
      {
        title: this.translation.translate('MAIN_FRAME.DIALOG_SAVED_TESTS'),
        html: '<div id="saved-tests-modal-content" style="min-height:250px;padding:0"></div>',
        showCloseButton: true, width: 680,
      },
      (container) => {
        mountComponentInSwal<TestEditorEl>('lib-e2e-test-editor', container, {
          persistence: this.persistence,
          translation: this.translation,
          issueTrackerConfig: this.issueTrackerConfig,
        });
      },
    );
  }

  showSaveTestDialog(): void {
    this.openSwalDialog(
      'isSaveTestDialogOpen',
      'save-test-modal-content',
      {
        title: this.translation.translate('MAIN_FRAME.DIALOG_SAVE'),
        html: '<div id="save-test-modal-content" style="padding:0"></div>',
        showCloseButton: false, allowOutsideClick: false, allowEscapeKey: false,
      },
      (container) => {
        mountComponentInSwal<SaveTestEl>('lib-e2e-save-test', container, {
          translation: this.translation,
          issueTrackerConfig: this.issueTrackerConfig,
        }, [
          { name: 'savetest', handler: (e) => {
            const { description, notes, tags, ticketId } = e.detail ?? {};
            this.onSaveTest(description ?? null, tags ?? [], notes ?? '', ticketId ?? '');
            Swal.close();
          }},
          { name: 'saveandexport', handler: (e) => {
            const { description, notes, tags, ticketId } = e.detail ?? {};
            this.onSaveAndExportTest(description ?? null, tags ?? [], notes ?? '', ticketId ?? '');
            Swal.close();
          }},
        ]);
      },
      { skipResize: true },
    );
  }

  showSettingsDialog(): void {
    this.openSwalDialog(
      'isSettingsDialogOpen',
      'settings-modal-content',
      {
        title: this.translation.translate('MAIN_FRAME.SETTINGS'),
        html: '<div id="settings-modal-content" style="padding:0"></div>',
        showCloseButton: true, width: 520,
      },
      (container) => {
        mountComponentInSwal<ConfigEl>('lib-e2e-configuration', container, {
          persistence: this.persistence,
          translation: this.translation,
        }, [
          { name: 'smartselectorchange', handler: (e) => { this.smartSelectorEnabled = e.detail; } },
          { name: 'starthiddenchange', handler: (e) => {
            this.isVisible = !e.detail;
            this.style.display = this.isVisible ? '' : 'none';
          }},
          { name: 'resetwidgetposition', handler: () => this.resetWidgetPosition() },
          { name: 'issuetrackerchange', handler: (e) => { this.issueTrackerConfig = e.detail as IssueTrackerConfig; } },
        ]);
      },
    );
  }

  showHelpDialog(): void {
    this.openSwalDialog(
      'isHelpDialogOpen',
      'help-modal-content',
      {
        title: this.translation.translate('HELP.TITLE'),
        html: '<div id="help-modal-content" style="padding:0"></div>',
        showCloseButton: true, width: 560,
      },
      (container) => {
        mountComponentInSwal<HelpPanelEl>('lib-e2e-help-panel', container, {
          translation: this.translation,
        });
      },
    );
  }

  showAdvancedEditorDialog(testId?: number): void {
    this.toggleModal('isAdvancedEditorDialogOpen', () => {
      Swal.fire({
        title: this.translation.translate('MAIN_FRAME.SHOW_ADVANCED_EDITOR'),
        html: '<div id="advanced-editor-modal-content" style="flex:1;min-height:0;display:flex;flex-direction:column;padding:0"></div>',
        showCloseButton: true,
        showConfirmButton: false,
        allowOutsideClick: false,
        width: 780,
        color: '#e6edf3',
        didOpen: () => {
          makeSwalDraggable();
          setSwal2DataCyAttribute();
          ensurePopupDimensions(Swal.getPopup(), 600);
          const container = document.getElementById('advanced-editor-modal-content');
          if (!container) return;
          const child = mountComponentInSwal<AdvancedEditorEl>('lib-e2e-advanced-test-editor', container, {
            persistence: this.persistence,
            translation: this.translation,
            ...(testId !== undefined ? { testId } : {}),
          }, [
            { name: 'selectorstrategychange', handler: (e) => { this.recording.selectorStrategy = e.detail; } },
            { name: 'closemodal', handler: () => Swal.close() },
            { name: 'openfileeditor', handler: (e) => {
              Swal.close();
              setTimeout(() => this.showFileEditorDialog(
                e.detail.handle, e.detail.content, e.detail.fileName, e.detail.testId,
                e.detail.itBlock, e.detail.interceptorsBlock, e.detail.notes,
              ), 150);
            }},
          ]);
          void this.persistence.getLoginSetup().then(cfg => { child.loginSetupConfig = cfg; });
        },
        willClose: () => { this.isAdvancedEditorDialogOpen = false; },
      });
      setTimeout(() => {
        const popup = Swal.getPopup();
        if (popup) makeModalResizable(popup, { minWidth: 400, minHeight: 0 });
      }, 0);
    });
  }

  private showFileEditorDialog(
    handle: FileSystemFileHandle,
    content: string,
    fileName: string,
    testId?: number,
    itBlock = '',
    interceptorsBlock = '',
    notes = '',
  ): void {
    Swal.fire({
      title: this.translation.translate('RECORDER.FILE_EDITOR_TITLE'),
      html: '<div id="file-editor-modal-content" style="flex:1;min-height:0;display:flex;flex-direction:column;padding:0"></div>',
      showCloseButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
      width: 1100,
      color: '#e6edf3',
      didOpen: () => {
        makeSwalDraggable();
        setSwal2DataCyAttribute();
        // Give the code editor a tall default height (otherwise the popup collapses
        // to its ~210px min-height and the user has to resize it every time).
        ensurePopupDimensions(Swal.getPopup(), 640);
        const container = document.getElementById('file-editor-modal-content');
        if (!container) return;
        mountComponentInSwal<FilePreviewEl>('lib-e2e-file-preview', container, {
          translation: this.translation,
          fileContent: content,
          fileName,
          closeLabel: this.translation.translate('FILE_PREVIEW.BACK_TO_EDITOR'),
          itBlock,
          interceptorsBlock,
          notes,
        }, [
          { name: 'close', handler: () => {
            Swal.close();
            setTimeout(() => this.showAdvancedEditorDialog(testId), 150);
          }},
          { name: 'save', handler: async (e) => {
            try {
              const writable = await handle.createWritable();
              await writable.write(e.detail);
              await writable.close();
              showToast(this.translation.translate('RECORDER.FILE_SAVED_TOAST'));
            } catch {
              showToast(this.translation.translate('RECORDER.FILE_SAVE_ERROR_TOAST'), false);
            }
            Swal.close();
            setTimeout(() => this.showAdvancedEditorDialog(testId), 150);
          }},
        ]);
      },
    });
    this.resizePopup();
  }

  // ── save handlers ─────────────────────────────────────────────────────────

  private async onSaveTest(description: string | null, tags: string[] = [], notes = '', ticketId = ''): Promise<void> {
    if (!description) return;
    // Plain save → IndexedDB only, spy interceptors with inline validations.
    // No fixture files written regardless of fixture mode (spec 012).
    await this.persistence.insertTest(description, this.cypressCommands, this.interceptors, tags, notes, ticketId || undefined);

    const uploadedFiles = this.recording.getUploadedFilesSnapshot();
    if (uploadedFiles.length > 0) {
      const filenames = uploadedFiles.map(f => f.filename).join(', ');
      showToast(
        this.translation.translate('RECORDER.FILE_UPLOAD_MANUAL_TOAST').replace('{files}', filenames),
        false,
      );
    }

    this.recording.clearCommands();
    this.clearRecordingHistory();
    this.cypressCommands = [];
    this.interceptors = [];
  }

  private async onSaveAndExportTest(description: string | null, tags: string[] = [], notes = '', ticketId = ''): Promise<void> {
    if (!description) return;

    const fixtures = this.recording.getFixturesSnapshot();
    const isFixtureMode = this.httpMonitor?.isFixtureModeEnabled() ?? false;
    let finalInterceptors = this.interceptors;
    let finalCommands = this.cypressCommands;

    // Fixture mode + Save-and-Edit: attempt to write fixture files and convert
    // spy interceptors to fixture stubs.  Falls back to spy on no folder/permission.
    if (isFixtureMode && fixtures.length > 0) {
      try {
        const n = await this.persistence.writeFixtures(fixtures);
        finalInterceptors = toFixtureInterceptors(this.interceptors, fixtures);
        finalCommands = simplifyFixtureWaits(this.cypressCommands, fixtures);
        showToast(`${this.translation.translate('RECORDER.FIXTURES_WRITTEN_TOAST')} (${n})`);
      } catch {
        showToast(this.translation.translate('RECORDER.FIXTURES_NO_FOLDER_TOAST'), false);
      }
    }

    const uploadedFiles = this.recording.getUploadedFilesSnapshot();
    if (uploadedFiles.length > 0) {
      const filenames = uploadedFiles.map(f => f.filename).join(', ');
      const hasAccess = await this.persistence.hasDirectoryAccess();
      if (hasAccess) {
        try {
          for (const uf of uploadedFiles) {
            await this.persistence.writeUploadedFile(uf.filename, uf.bytes);
          }
          showToast(this.translation.translate('RECORDER.FILE_UPLOAD_COPIED_TOAST').replace('{files}', filenames));
        } catch {
          showToast(
            this.translation.translate('RECORDER.FILE_UPLOAD_COPY_ERROR_TOAST').replace('{files}', filenames),
            false,
          );
        }
      } else {
        showToast(
          this.translation.translate('RECORDER.FILE_UPLOAD_MANUAL_TOAST').replace('{files}', filenames),
          false,
        );
      }
    }

    const id = await this.persistence.insertTest(description, finalCommands, finalInterceptors, tags, notes, ticketId || undefined);
    this.recording.clearCommands();
    this.clearRecordingHistory();
    this.cypressCommands = [];
    this.interceptors = [];
    setTimeout(() => this.showAdvancedEditorDialog(id), 300);
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

  private openSwalDialog(
    flag: keyof this,
    contentId: string,
    swalOptions: SweetAlertOptions,
    onMount: (container: HTMLElement) => void,
    extra?: { onDidOpenPreamble?: () => void; onWillClose?: () => void; skipResize?: boolean },
  ): void {
    this.toggleModal(flag, () => {
      Swal.fire({
        showConfirmButton: false,
        color: '#e6edf3',
        ...swalOptions,
        didOpen: () => {
          makeSwalDraggable();
          setSwal2DataCyAttribute();
          extra?.onDidOpenPreamble?.();
          const container = document.getElementById(contentId);
          if (!container) return;
          onMount(container);
        },
        willClose: () => {
          (this as Record<string, unknown>)[flag as string] = false;
          extra?.onWillClose?.();
        },
      });
      if (!extra?.skipResize) this.resizePopup();
    });
  }

  private render(): void {
    const rec    = this.isRecording;
    const paused = this.isPaused;
    this.style.display = this.isVisible ? '' : 'none';
    this.shadow.innerHTML = `<style>${getRecorderStyles(rec, paused)}</style>${renderRecorderWidget(rec, paused, this.translation.translate.bind(this.translation))}`;
    const toggleBtn = this.shadow.querySelector('[data-action="toggle"]');
    toggleBtn?.addEventListener('click', () => {
      // A drag ends with a click event we must swallow so it doesn't toggle recording.
      if (this.suppressNextToggleClick) { this.suppressNextToggleClick = false; return; }
      this.toggle();
    });
    toggleBtn?.addEventListener('pointerdown', (e) => this.beginWidgetDrag(e as MouseEvent));
    this.shadow.querySelector('[data-action="pause"]')
      ?.addEventListener('click', () => this.togglePause());
    this.shadow.querySelector('[data-action="tests"]')
      ?.addEventListener('click', () => this.showSavedTestsDialog());
    this.shadow.querySelector('[data-action="commands"]')
      ?.addEventListener('click', () => this.showCommandsDialog());
    this.shadow.querySelector('[data-action="config"]')
      ?.addEventListener('click', () => this.showSettingsDialog());
    this.shadow.querySelector('[data-action="browse"]')
      ?.addEventListener('click', () => this.showAdvancedEditorDialog());
    this.shadow.querySelector('[data-action="help"]')
      ?.addEventListener('click', () => this.showHelpDialog());
    // Re-apply the dragged position/orientation after every re-render.
    this.applyWidgetPosition();
  }
}

if (!customElements.get('lib-e2e-recorder')) {
  customElements.define('lib-e2e-recorder', LibE2eRecorderElement);
}
