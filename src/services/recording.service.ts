import { INPUT_TYPES } from '../models/input-types.model';
import { Subject } from '../utils/subject';
import { FORBIDDEN_ID_PREFIXES } from '../utils/selector-quality.utils';

const OWN_SELECTOR = '[data-cy="lib-e2e-cypress-for-dummys"]';

export type SelectorStrategy = 'data-cy' | 'data-testid' | 'aria-label' | 'id';

export class RecordingService {
  private readonly commands$ = new Subject<string[]>([]);
  private readonly interceptors$ = new Subject<string[]>([]);
  private readonly isRecording$ = new Subject<boolean>(false);
  private readonly isPaused$ = new Subject<boolean>(false);
  private readonly selectorNotFound$ = new Subject<{ target: HTMLElement; action: 'click' } | null>(null);
  private readonly inputDebounceTimers = new Map<HTMLElement, ReturnType<typeof setTimeout>>();
  private readonly abort = new AbortController();

  selectorStrategy: SelectorStrategy = 'data-cy';

  // Stored originals for history patching cleanup
  private readonly origPushState = history.pushState.bind(history);
  private readonly origReplaceState = history.replaceState.bind(history);

  constructor() {
    this.listenToClicks();
    this.listenToInput();
    this.listenToSelect();
    this.listenToRouteChanges();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  startRecording(): void {
    this.isPaused$.next(false);
    this.isRecording$.next(true);
    this.addCommand(`cy.viewport(1900, 1200)`);
    this.addCommand(`cy.visit('${window.location.pathname}')`);
    this.addCommand(`cy.get('[data-cy="lib-e2e-cypress-for-dummys"]').invoke('hide');`);
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
    if (this.isPaused$.getValue()) return;
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
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

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
        const selector = this.getReliableSelector(container);
        const value = target.value.replace(/'/g, "\\'");
        this.addGenericCommand({
          selector,
          action: (s) => `cy.get('${s}').clear().type('${value}')`,
        });
        this.inputDebounceTimers.delete(target);
      }, 1000)
    );
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
