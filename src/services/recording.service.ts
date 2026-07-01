import { INPUT_TYPES } from '../models/input-types.model';
import type { ActiveSessionState } from '../models/active-session.model';
import { Subject } from '../utils/subject';
import { FORBIDDEN_ID_PREFIXES } from '../utils/selector-quality.utils';
import { inferAssertionCommand } from '../utils/assertion.utils';

const OWN_SELECTOR = '[data-cy="lib-e2e-cypress-for-dummys"]';

export type SelectorStrategy = 'data-cy' | 'data-testid' | 'aria-label' | 'id';

/** Generates a stable, collision-resistant session id (browser + jsdom safe). */
function createSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `sess-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export class RecordingService {
  private readonly commands$ = new Subject<string[]>([]);
  private readonly interceptors$ = new Subject<string[]>([]);
  private readonly isRecording$ = new Subject<boolean>(false);
  private readonly isPaused$ = new Subject<boolean>(false);
  private readonly selectorNotFound$ = new Subject<{ target: HTMLElement; action: 'click' } | null>(null);
  private readonly inputDebounceTimers = new Map<HTMLElement, ReturnType<typeof setTimeout>>();
  private readonly abort = new AbortController();

  selectorStrategy: SelectorStrategy = 'data-cy';

  /** Stable id of the current live session (null when none has started). */
  sessionId: string | null = null;
  private startedAt = 0;

  // Stored originals for history patching cleanup
  private readonly origPushState = history.pushState.bind(history);
  private readonly origReplaceState = history.replaceState.bind(history);

  constructor() {
    this.listenToAssertClicks();
    this.listenToClicks();
    this.listenToDoubleClicks();
    this.listenToContextMenu();
    this.listenToInput();
    this.listenToSelect();
    this.listenToKeys();
    this.listenToRouteChanges();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  startRecording(): void {
    this.sessionId = createSessionId();
    this.startedAt = Date.now();
    this.isPaused$.next(false);
    this.isRecording$.next(true);
    this.addCommand(`cy.viewport(1900, 1200)`);
    this.addCommand(`cy.visit('${window.location.pathname}')`);
    this.addCommand(`cy.get('[data-cy="lib-e2e-cypress-for-dummys"]').invoke('hide');`);
  }

  /**
   * Rehydrates a previously persisted session WITHOUT running the startRecording
   * bootstrap (no viewport/visit/hide). Used to continue a recording across a
   * micro-frontend crossing or a same-origin reload.
   * See docs/specs/006-cross-app-recording-continuity.md.
   */
  restoreSession(state: ActiveSessionState): void {
    this.sessionId = state.sessionId;
    this.startedAt = state.startedAt;
    this.selectorStrategy = state.selectorStrategy;
    this.commands$.next([...state.commands]);
    this.interceptors$.next([...state.interceptors]);
    this.isPaused$.next(state.isPaused);
    // isRecording last so subscribers observe a fully-populated buffer.
    this.isRecording$.next(state.isRecording);
  }

  /** Full snapshot of the live session for persistence. */
  getSessionSnapshot(): ActiveSessionState {
    return {
      sessionId: this.sessionId ?? createSessionId(),
      isRecording: this.isRecording$.getValue(),
      isPaused: this.isPaused$.getValue(),
      commands: this.commands$.getValue(),
      interceptors: this.interceptors$.getValue(),
      selectorStrategy: this.selectorStrategy,
      startedAt: this.startedAt,
      updatedAt: Date.now(),
    };
  }

  stopRecording(): void {
    this.isPaused$.next(false);
    this.isRecording$.next(false);
  }

  toggleRecording(): void {
    if (this.isRecording$.getValue()) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  pauseRecording(): void {
    if (!this.isRecording$.getValue()) return;
    this.isPaused$.next(true);
  }

  resumeRecording(): void {
    this.isPaused$.next(false);
  }

  togglePause(): void {
    if (this.isPaused$.getValue()) {
      this.resumeRecording();
    } else {
      this.pauseRecording();
    }
  }

  addCommand(cmd: string): void {
    if (!this.isRecording$.getValue() || this.isPaused$.getValue()) return;
    this.commands$.next([...this.commands$.getValue(), cmd]);
  }

  /** Appends a command regardless of recording/paused state (e.g. assertions added manually). */
  appendCommand(cmd: string): void {
    this.commands$.next([...this.commands$.getValue(), cmd]);
  }

  removeCommand(index: number): void {
    const cmds = this.commands$.getValue();
    if (index < 0 || index >= cmds.length) return;
    this.commands$.next([...cmds.slice(0, index), ...cmds.slice(index + 1)]);
  }

  moveCommand(from: number, to: number): void {
    const cmds = [...this.commands$.getValue()];
    if (from < 0 || to < 0 || from >= cmds.length || to >= cmds.length || from === to) return;
    const [item] = cmds.splice(from, 1);
    cmds.splice(to, 0, item);
    this.commands$.next(cmds);
  }

  removeInterceptor(index: number): void {
    const ints = this.interceptors$.getValue();
    if (index < 0 || index >= ints.length) return;
    this.interceptors$.next([...ints.slice(0, index), ...ints.slice(index + 1)]);
  }

  registerInterceptor(method: string, url: string, alias: string): void {
    // Only capture interceptors while actively recording — otherwise HTTP calls
    // the host app fires before recording starts (the monitor is installed on
    // mount) would leak orphan cy.intercept lines into the saved test.
    if (!this.isRecording$.getValue() || this.isPaused$.getValue()) return;
    const command = `cy.intercept('${method}', '${this.urlToWildcard(url, method)}').as('${alias}')`;
    const current = this.interceptors$.getValue();
    if (!current.includes(command)) {
      this.interceptors$.next([...current, command]);
    }
  }

  clearCommands(): void {
    this.commands$.next([]);
    this.interceptors$.next([]);
  }

  clearInterceptors(): void {
    this.interceptors$.next([]);
  }

  getCommandsSnapshot(): string[]  { return this.commands$.getValue(); }
  getInterceptorsSnapshot(): string[] { return this.interceptors$.getValue(); }
  getPausedSnapshot(): boolean     { return this.isPaused$.getValue(); }

  onCommandsChange(fn: (cmds: string[]) => void): () => void {
    return this.commands$.subscribe(fn);
  }

  onInterceptorsChange(fn: (ints: string[]) => void): () => void {
    return this.interceptors$.subscribe(fn);
  }

  onRecordingChange(fn: (isRecording: boolean) => void): () => void {
    return this.isRecording$.subscribe(fn);
  }

  onPauseChange(fn: (isPaused: boolean) => void): () => void {
    return this.isPaused$.subscribe(fn);
  }

  /**
   * Fires a full session snapshot whenever any persisted field changes
   * (commands, interceptors, recording or paused state). Drives the debounced
   * persistence of the live session. Returns a combined unsubscribe.
   */
  onSessionChange(fn: (state: ActiveSessionState) => void): () => void {
    const emit = (): void => fn(this.getSessionSnapshot());
    const unsubs = [
      this.commands$.subscribe(emit),
      this.interceptors$.subscribe(emit),
      this.isRecording$.subscribe(emit),
      this.isPaused$.subscribe(emit),
    ];
    return () => unsubs.forEach((u) => u());
  }

  onSelectorNotFound(fn: (target: HTMLElement, action: 'click') => void): () => void {
    return this.selectorNotFound$.subscribe((v) => {
      if (v) fn(v.target, v.action);
    });
  }

  destroy(): void {
    this.abort.abort();
    history.pushState = this.origPushState;
    history.replaceState = this.origReplaceState;
    this.inputDebounceTimers.forEach((t) => clearTimeout(t));
    this.inputDebounceTimers.clear();
  }

  // ── DOM listeners ─────────────────────────────────────────────────────────

  /**
   * Alt+click captures an ASSERTION for the element instead of a click, and
   * suppresses the element's real action. Runs in the capture phase so it fires
   * before the app's handlers and before the bubble-phase click listener below
   * (stopImmediatePropagation prevents a duplicate `.click()`). See spec 009.
   */
  private listenToAssertClicks(): void {
    document.addEventListener(
      'click',
      (e: Event) => {
        if (!this.isRecording$.getValue() || this.isPaused$.getValue()) return;
        if (!(e as MouseEvent).altKey) return;
        const target = e.target as HTMLElement;
        if (!target || this.isOwnElement(target)) return;
        const tag = target.tagName?.toLowerCase();
        if (tag === 'body' || tag === 'html') return;
        const container = target.closest<HTMLElement>('[data-cy], [data-testid], [aria-label], [id]');
        if (!container) return; // no reliable selector → leave it as a normal Alt+click
        const selector = this.getReliableSelector(container);
        if (!selector || this.isOwnSelector(selector)) return;
        // Assert-only: don't let the click perform its action or record a click.
        e.preventDefault();
        e.stopImmediatePropagation();
        const emit = (): void => this.addCommand(inferAssertionCommand(container, selector));
        // A checkbox/radio toggles its `checked` during the click's activation;
        // since we cancelled the action it is restored afterwards, so read the true
        // state on the next microtask rather than the transient toggled value.
        const type = (container.getAttribute('type') ?? '').toLowerCase();
        if (container.tagName.toLowerCase() === 'input' && (type === 'checkbox' || type === 'radio')) {
          queueMicrotask(emit);
        } else {
          emit();
        }
      },
      { capture: true, signal: this.abort.signal }
    );
  }

  private listenToClicks(): void {
    document.addEventListener(
      'click',
      (e: Event) => {
        if (!this.isRecording$.getValue()) return;
        const target = e.target as HTMLElement;
        if (!target || this.isOwnElement(target)) return;
        const tag = target.tagName?.toLowerCase();
        if (tag === 'body' || tag === 'html') return;
        this.handleClickEvent(target);
      },
      { signal: this.abort.signal }
    );
  }

  /** Centralised selector resolution for the pointer/key listeners (spec 010). */
  private resolveSelectorFor(target: HTMLElement | null): string | null {
    if (!target || this.isOwnElement(target)) return null;
    const tag = target.tagName?.toLowerCase();
    if (tag === 'body' || tag === 'html') return null;
    const container = target.closest<HTMLElement>('[data-cy], [data-testid], [aria-label], [id]');
    if (!container) return null;
    const selector = this.getReliableSelector(container);
    if (!selector || this.isOwnSelector(selector)) return null;
    return selector;
  }

  private listenToDoubleClicks(): void {
    document.addEventListener(
      'dblclick',
      (e: Event) => {
        if (!this.isRecording$.getValue() || this.isPaused$.getValue()) return;
        if ((e as MouseEvent).altKey) return;
        const selector = this.resolveSelectorFor(e.target as HTMLElement);
        if (!selector) return;
        // Collapse the up-to-2 single clicks the browser fired before the dblclick.
        const clickCmd = `cy.get('${selector}').click()`;
        let cmds = this.commands$.getValue();
        let removed = 0;
        while (removed < 2 && cmds.length > 0 && cmds[cmds.length - 1] === clickCmd) {
          cmds = cmds.slice(0, -1);
          removed++;
        }
        if (removed > 0) this.commands$.next(cmds);
        this.addCommand(`cy.get('${selector}').dblclick()`);
      },
      { signal: this.abort.signal }
    );
  }

  private listenToContextMenu(): void {
    document.addEventListener(
      'contextmenu',
      (e: Event) => {
        if (!this.isRecording$.getValue() || this.isPaused$.getValue()) return;
        const selector = this.resolveSelectorFor(e.target as HTMLElement);
        if (!selector) return;
        this.addCommand(`cy.get('${selector}').rightclick()`);
      },
      { signal: this.abort.signal }
    );
  }

  /** Enter → type('{enter}'), Escape → type('{esc}'), only inside a field. */
  private listenToKeys(): void {
    document.addEventListener(
      'keydown',
      (e: Event) => {
        if (!this.isRecording$.getValue() || this.isPaused$.getValue()) return;
        const key = (e as KeyboardEvent).key;
        if (key !== 'Enter' && key !== 'Escape') return;
        const target = e.target as HTMLElement;
        const tag = target?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') return;
        const selector = this.resolveSelectorFor(target);
        if (!selector) return;
        // Record the field's pending value before the key press.
        this.flushInputDebounce(target);
        const token = key === 'Enter' ? '{enter}' : '{esc}';
        this.addCommand(`cy.get('${selector}').type('${token}')`);
      },
      { signal: this.abort.signal }
    );
  }

  private listenToInput(): void {
    document.addEventListener(
      'input',
      (e: Event) => {
        if (!this.isRecording$.getValue()) return;
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        if (!target || this.isOwnElement(target)) return;
        this.handleInputEvent(target);
      },
      { signal: this.abort.signal }
    );
  }

  private listenToSelect(): void {
    document.addEventListener(
      'change',
      (e: Event) => {
        if (!this.isRecording$.getValue()) return;
        const target = e.target as HTMLSelectElement;
        if (!target || this.isOwnElement(target)) return;
        if (target.tagName.toLowerCase() === 'select') {
          this.handleSelectEvent(target);
        }
      },
      { signal: this.abort.signal }
    );
  }

  private listenToRouteChanges(): void {
    let lastUrl = window.location.pathname + window.location.search + window.location.hash;

    const addUrlCommand = (newUrl: string): void => {
      if (!this.isRecording$.getValue()) return;
      if (newUrl === lastUrl) return;
      this.addCommand(`cy.url().should('include', '${newUrl}')`);
      lastUrl = newUrl;
    };

    const wrapMethod = (type: 'pushState' | 'replaceState'): void => {
      const orig = history[type].bind(history);
      history[type] = (data: unknown, unused: string, url?: string | URL | null) => {
        const result = orig(data, unused, url);
        let newUrl = window.location.pathname + window.location.search + window.location.hash;
        if (typeof url === 'string' && url.length > 0) {
          const a = document.createElement('a');
          a.href = url;
          newUrl = a.pathname + a.search + a.hash;
        } else if (url instanceof URL) {
          newUrl = url.pathname + url.search + url.hash;
        }
        addUrlCommand(newUrl);
        return result;
      };
    };

    wrapMethod('pushState');
    wrapMethod('replaceState');

    window.addEventListener(
      'popstate',
      () => {
        const newUrl = window.location.pathname + window.location.search + window.location.hash;
        addUrlCommand(newUrl);
      },
      { signal: this.abort.signal }
    );
  }

  // ── Click helpers ─────────────────────────────────────────────────────────

  private handleClickEvent(target: HTMLElement): void {
    // Bubble up from non-interactive span/div inside button or mat-option
    if (!this.isInteractiveElement(target)) {
      const tag = target.tagName.toLowerCase();
      if (
        (tag === 'span' || tag === 'div') &&
        target.parentElement &&
        (target.parentElement.tagName.toLowerCase() === 'button' ||
          target.parentElement.tagName.toLowerCase() === 'mat-option') &&
        (target.parentElement.hasAttribute('data-cy') || target.parentElement.hasAttribute('id'))
      ) {
        target = target.parentElement;
      }
      const matSelect = target.closest('mat-select');
      if (matSelect) {
        const sel = this.getReliableSelector(matSelect as HTMLElement);
        if (sel) {
          this.addCommand(`cy.get('${sel}').click()`);
        } else {
          this.selectorNotFound$.next({ target: matSelect as HTMLElement, action: 'click' });
        }
        return;
      }
    }

    const tag = target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      const container = target.closest<HTMLElement>('[data-cy], [data-testid], [aria-label], [id]');
      if (!container) { this.selectorNotFound$.next({ target, action: 'click' }); return; }
      // Checkbox/radio → check()/uncheck(); other input clicks stay a no-op (the
      // value is captured via the `input` event). Runs in the bubble phase, so
      // `checked` already reflects the post-click state (spec 010).
      if (tag === 'input') {
        const input = target as HTMLInputElement;
        const type = (input.getAttribute('type') ?? '').toLowerCase();
        if (type === 'checkbox' || type === 'radio') {
          const selector = this.getReliableSelector(container);
          if (selector && !this.isOwnSelector(selector)) {
            const action = type === 'radio' || input.checked ? 'check' : 'uncheck';
            this.addCommand(`cy.get('${selector}').${action}()`);
          }
        }
      }
      return;
    }

    const container = target.closest<HTMLElement>('[data-cy], [data-testid], [aria-label], [id]');
    if (!container) {
      this.selectorNotFound$.next({ target, action: 'click' });
      return;
    }

    const selector = this.getReliableSelector(container);
    if (selector === OWN_SELECTOR) return;

    if (tag === 'mat-option') {
      this.handleMatOptionClick(target, selector);
      return;
    }

    this.addGenericCommand({
      selector,
      action: (s) => `cy.get('${s}').click()`,
    });
  }

  private handleMatOptionClick(target: HTMLElement, selector: string | null): void {
    const matSelect = target.closest('mat-select');
    let dataCy: string | null = null;
    if (matSelect) dataCy = matSelect.closest('[data-cy]')?.getAttribute('data-cy') ?? null;
    if (!dataCy) dataCy = target.closest('[data-cy]')?.getAttribute('data-cy') ?? null;
    if (dataCy) {
      this.addCommand(`cy.get('[data-cy="${dataCy}"]').click()`);
      return;
    }
    if (selector) {
      this.addCommand(`cy.get('${selector}').eq(0).click()`);
    } else {
      this.selectorNotFound$.next({ target, action: 'click' });
    }
  }

  // ── Input helpers ─────────────────────────────────────────────────────────

  private handleInputEvent(target: HTMLInputElement | HTMLTextAreaElement): void {
    const tag = target.tagName.toLowerCase();
    const isText = tag === 'textarea' || (tag === 'input' && (INPUT_TYPES as readonly string[]).includes(target.type));
    if (!isText) return;

    const container = target.closest<HTMLElement>('[data-cy], [data-testid], [aria-label], [id]');
    if (!container) return;

    if (this.inputDebounceTimers.has(target)) {
      clearTimeout(this.inputDebounceTimers.get(target));
    }
    this.inputDebounceTimers.set(
      target,
      setTimeout(() => {
        this.inputDebounceTimers.delete(target);
        this.recordInputValue(target);
      }, 1000)
    );
  }

  /** Records a text field's current value as a `clear().type()` command. */
  private recordInputValue(target: HTMLInputElement | HTMLTextAreaElement): void {
    const container = target.closest<HTMLElement>('[data-cy], [data-testid], [aria-label], [id]');
    if (!container) return;
    const selector = this.getReliableSelector(container);
    const value = target.value.replace(/'/g, "\\'");
    this.addGenericCommand({
      selector,
      action: (s) => `cy.get('${s}').clear().type('${value}')`,
    });
  }

  /** Flushes any pending debounced value for an element, recording it now. */
  private flushInputDebounce(target: HTMLElement): void {
    const timer = this.inputDebounceTimers.get(target);
    if (timer === undefined) return;
    clearTimeout(timer);
    this.inputDebounceTimers.delete(target);
    this.recordInputValue(target as HTMLInputElement | HTMLTextAreaElement);
  }

  // ── Select helpers ────────────────────────────────────────────────────────

  private handleSelectEvent(target: HTMLSelectElement): void {
    const container = target.closest<HTMLElement>('[data-cy], [data-testid], [aria-label], [id]');
    if (!container) return;
    const selector = this.getReliableSelector(container);
    const value = target.value.replace(/'/g, "\\'");
    this.addGenericCommand({
      selector,
      action: (s) => `cy.get('${s}').select('${value}')`,
    });
  }

  // ── Shared helpers ────────────────────────────────────────────────────────

  private addGenericCommand(opts: {
    selector: string | null;
    action: (s: string) => string;
  }): void {
    if (!opts.selector || this.isOwnSelector(opts.selector)) return;
    this.addCommand(opts.action(opts.selector));
  }

  private getReliableSelector(el: HTMLElement): string | null {
    const strategy = this.selectorStrategy;
    const dataCy     = el.getAttribute('data-cy');
    const dataTestid = el.getAttribute('data-testid');
    const ariaLabel  = el.getAttribute('aria-label');
    const dataDotCy  = el.getAttribute('data.cy');

    const rawId = el.id;
    const validId = rawId &&
      rawId.length < 25 &&
      /^[a-zA-Z][\w-]*$/.test(rawId) &&
      !FORBIDDEN_ID_PREFIXES.some((p) => rawId.startsWith(p)) &&
      !/^\d+$/.test(rawId) ? rawId : null;

    switch (strategy) {
      case 'data-testid':
        if (dataTestid) return `[data-testid="${dataTestid}"]`;
        if (dataCy)     return `[data-cy="${dataCy}"]`;
        return validId  ? `#${validId}` : null;
      case 'aria-label':
        if (ariaLabel)  return `[aria-label="${ariaLabel}"]`;
        if (dataCy)     return `[data-cy="${dataCy}"]`;
        return validId  ? `#${validId}` : null;
      case 'id':
        if (validId)    return `#${validId}`;
        if (dataCy)     return `[data-cy="${dataCy}"]`;
        return dataTestid ? `[data-testid="${dataTestid}"]` : null;
      default: // 'data-cy'
        if (dataCy)     return `[data-cy="${dataCy}"]`;
        if (dataDotCy)  return `[data.cy="${dataDotCy}"]`;
        return validId  ? `#${validId}` : null;
    }
  }

  private isInteractiveElement(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName.toLowerCase();
    return ['select', 'option', 'input', 'textarea', 'button'].includes(tag);
  }

  private isOwnSelector(selector: string | null): boolean {
    return selector === OWN_SELECTOR;
  }

  private isOwnElement(target: HTMLElement): boolean {
    return !!target.closest('[data-cy="lib-e2e-cypress-for-dummys"]');
  }

  private urlToWildcard(url: string, method: string): string {
    const u = new URL(url, 'http://localhost');
    if (method.toUpperCase() === 'GET' && u.search) {
      return `**${u.pathname}/**`;
    }
    return `**${u.pathname}`;
  }
}
