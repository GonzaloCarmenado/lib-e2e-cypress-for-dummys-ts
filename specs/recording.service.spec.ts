import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RecordingService } from '../src/services/recording.service';

// ─── helpers ────────────────────────────────────────────────────────────────

function makeElement(
  tag: string,
  attrs: Record<string, string> = {}
): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.appendChild(el);
  return el;
}

function click(el: HTMLElement): void {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

function input(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function change(el: HTMLSelectElement, value: string): void {
  el.value = value;
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

// ─── suite ──────────────────────────────────────────────────────────────────

describe('Phase 4 — RecordingService', () => {
  let service: RecordingService;

  beforeEach(() => {
    document.body.innerHTML = '';
    service = new RecordingService();
  });

  afterEach(() => {
    service.destroy();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ── startRecording / stopRecording ──────────────────────────────────────

  describe('startRecording', () => {
    it('adds viewport command as first command', () => {
      service.startRecording();
      expect(service.getCommandsSnapshot()[0]).toMatch(/cy\.viewport\(/);
    });

    it('adds cy.visit with current pathname', () => {
      service.startRecording();
      expect(service.getCommandsSnapshot()[1]).toMatch(/cy\.visit\('/);
    });

    it('adds hide command for the lib element', () => {
      service.startRecording();
      expect(service.getCommandsSnapshot()[2]).toContain('invoke(\'hide\')');
    });

    it('adds exactly 3 initial commands', () => {
      service.startRecording();
      expect(service.getCommandsSnapshot()).toHaveLength(3);
    });
  });

  describe('stopRecording', () => {
    it('prevents further commands from being added', () => {
      service.startRecording();
      service.stopRecording();
      service.addCommand('cy.get(".foo").click()');
      // only the 3 initial commands, nothing extra
      expect(service.getCommandsSnapshot()).toHaveLength(3);
    });
  });

  describe('toggleRecording', () => {
    it('starts recording when currently stopped', () => {
      service.toggleRecording();
      expect(service.getCommandsSnapshot()).toHaveLength(3);
    });

    it('stops recording when currently started', () => {
      service.startRecording();
      const snapshot = service.getCommandsSnapshot().length;
      service.toggleRecording(); // stop
      service.addCommand('extra');
      expect(service.getCommandsSnapshot()).toHaveLength(snapshot);
    });
  });

  // ── addCommand ───────────────────────────────────────────────────────────

  describe('addCommand', () => {
    it('adds a command when recording is active', () => {
      service.startRecording();
      service.addCommand('cy.get(".test").click()');
      expect(service.getCommandsSnapshot()).toContain('cy.get(".test").click()');
    });

    it('is a no-op when not recording', () => {
      service.addCommand('cy.get(".test").click()');
      expect(service.getCommandsSnapshot()).toHaveLength(0);
    });
  });

  // ── clearCommands / clearInterceptors ───────────────────────────────────

  describe('clearCommands', () => {
    it('empties the commands array', () => {
      service.startRecording();
      service.clearCommands();
      expect(service.getCommandsSnapshot()).toHaveLength(0);
    });

    it('also empties the interceptors array', () => {
      service.startRecording();
      service.registerInterceptor('GET', 'http://localhost/api/users', 'users');
      service.clearCommands();
      expect(service.getInterceptorsSnapshot()).toHaveLength(0);
    });
  });

  describe('clearInterceptors', () => {
    it('empties only the interceptors array', () => {
      service.startRecording();
      service.registerInterceptor('GET', 'http://localhost/api/users', 'users');
      service.clearInterceptors();
      expect(service.getInterceptorsSnapshot()).toHaveLength(0);
    });

    it('does not affect the commands array', () => {
      service.startRecording();
      const count = service.getCommandsSnapshot().length;
      service.clearInterceptors();
      expect(service.getCommandsSnapshot()).toHaveLength(count);
    });
  });

  // ── subscriptions ────────────────────────────────────────────────────────

  describe('onCommandsChange', () => {
    it('fires with updated commands when a command is added', () => {
      const received: string[][] = [];
      service.onCommandsChange((cmds) => received.push([...cmds]));
      service.startRecording();
      expect(received.length).toBeGreaterThan(0);
    });

    it('unsubscribe stops receiving updates', () => {
      const received: string[][] = [];
      const unsub = service.onCommandsChange((cmds) => received.push([...cmds]));
      unsub();
      service.startRecording();
      expect(received).toHaveLength(0);
    });
  });

  describe('onRecordingChange', () => {
    it('fires true when startRecording is called', () => {
      const states: boolean[] = [];
      service.onRecordingChange((s) => states.push(s));
      service.startRecording();
      expect(states).toContain(true);
    });

    it('fires false when stopRecording is called', () => {
      const states: boolean[] = [];
      service.startRecording();
      service.onRecordingChange((s) => states.push(s));
      service.stopRecording();
      expect(states).toContain(false);
    });
  });

  // ── registerInterceptor ──────────────────────────────────────────────────

  describe('registerInterceptor', () => {
    it('adds a cy.intercept command to the interceptors list', () => {
      service.startRecording();
      service.registerInterceptor('GET', 'http://localhost/api/users', 'users');
      expect(service.getInterceptorsSnapshot()[0]).toContain("cy.intercept('GET'");
      expect(service.getInterceptorsSnapshot()[0]).toContain(".as('users')");
    });

    it('does not add duplicate interceptors', () => {
      service.startRecording();
      service.registerInterceptor('GET', 'http://localhost/api/users', 'users');
      service.registerInterceptor('GET', 'http://localhost/api/users', 'users');
      expect(service.getInterceptorsSnapshot()).toHaveLength(1);
    });

    it('GET with query string uses wildcard pattern ending in /**', () => {
      service.startRecording();
      service.registerInterceptor('GET', 'http://localhost/api/users?page=1', 'users');
      expect(service.getInterceptorsSnapshot()[0]).toMatch(/\/\*\*'/);
    });

    it('POST uses plain wildcard path (no trailing /**)', () => {
      service.startRecording();
      service.registerInterceptor('POST', 'http://localhost/api/users', 'createUser');
      const cmd = service.getInterceptorsSnapshot()[0];
      expect(cmd).toContain('**/api/users');
      expect(cmd).not.toMatch(/\/\*\*['"]$/);
    });
  });

  // ── DOM click events ─────────────────────────────────────────────────────

  describe('DOM — click events', () => {
    beforeEach(() => service.startRecording());

    it('click on [data-cy] element generates cy.get().click()', () => {
      const btn = makeElement('button', { 'data-cy': 'submit-btn' });
      click(btn);
      expect(service.getCommandsSnapshot().at(-1)).toBe(
        "cy.get('[data-cy=\"submit-btn\"]').click()"
      );
    });

    it('click on element with valid id generates cy.get(#id).click()', () => {
      const btn = makeElement('button', { id: 'my-button' });
      click(btn);
      expect(service.getCommandsSnapshot().at(-1)).toBe("cy.get('#my-button').click()");
    });

    it('click on input element does NOT generate a click command', () => {
      const inp = makeElement('input', { 'data-cy': 'email-input', type: 'text' });
      const before = service.getCommandsSnapshot().length;
      click(inp);
      expect(service.getCommandsSnapshot().length).toBe(before);
    });

    it('click on select element does NOT generate a click command', () => {
      const sel = makeElement('select', { 'data-cy': 'my-select' });
      const before = service.getCommandsSnapshot().length;
      click(sel);
      expect(service.getCommandsSnapshot().length).toBe(before);
    });

    it('click on lib own element is ignored', () => {
      const lib = makeElement('div', { 'data-cy': 'lib-e2e-cypress-for-dummys' });
      const before = service.getCommandsSnapshot().length;
      click(lib);
      expect(service.getCommandsSnapshot().length).toBe(before);
    });

    it('click on element with framework-prefixed id (mat-) is ignored', () => {
      const btn = makeElement('button', { id: 'mat-button-1' });
      const before = service.getCommandsSnapshot().length;
      click(btn);
      expect(service.getCommandsSnapshot().length).toBe(before);
    });

    it('click on element without data-cy or id is ignored', () => {
      const btn = makeElement('button');
      const before = service.getCommandsSnapshot().length;
      click(btn);
      expect(service.getCommandsSnapshot().length).toBe(before);
    });
  });

  // ── DOM input events ─────────────────────────────────────────────────────

  describe('DOM — input events', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      service.startRecording();
    });

    it('input on text input generates cy.get().clear().type() after debounce', () => {
      const inp = makeElement('input', { 'data-cy': 'username', type: 'text' }) as HTMLInputElement;
      input(inp, 'admin');
      vi.advanceTimersByTime(1000);
      expect(service.getCommandsSnapshot().at(-1)).toBe(
        "cy.get('[data-cy=\"username\"]').clear().type('admin')"
      );
    });

    it('input on textarea generates cy.get().clear().type() after debounce', () => {
      const ta = makeElement('textarea', { 'data-cy': 'notes' }) as HTMLTextAreaElement;
      input(ta, 'some text');
      vi.advanceTimersByTime(1000);
      expect(service.getCommandsSnapshot().at(-1)).toBe(
        "cy.get('[data-cy=\"notes\"]').clear().type('some text')"
      );
    });

    it('rapid typing only generates one command (debounce)', () => {
      const inp = makeElement('input', { 'data-cy': 'search', type: 'text' }) as HTMLInputElement;
      const before = service.getCommandsSnapshot().length;
      input(inp, 'a');
      input(inp, 'ab');
      input(inp, 'abc');
      vi.advanceTimersByTime(1000);
      expect(service.getCommandsSnapshot().length).toBe(before + 1);
    });

    it('escapes single quotes in the typed value', () => {
      const inp = makeElement('input', { 'data-cy': 'name', type: 'text' }) as HTMLInputElement;
      input(inp, "O'Brien");
      vi.advanceTimersByTime(1000);
      expect(service.getCommandsSnapshot().at(-1)).toContain("\\'");
    });
  });

  // ── DOM select change events ─────────────────────────────────────────────

  describe('DOM — select change events', () => {
    beforeEach(() => service.startRecording());

    it('select change generates cy.get().select()', () => {
      const sel = makeElement('select', { 'data-cy': 'role' }) as HTMLSelectElement;
      const opt = document.createElement('option');
      opt.value = 'admin';
      sel.appendChild(opt);
      change(sel, 'admin');
      expect(service.getCommandsSnapshot().at(-1)).toBe(
        "cy.get('[data-cy=\"role\"]').select('admin')"
      );
    });
  });

  // ── route change detection ───────────────────────────────────────────────

  describe('route change detection', () => {
    beforeEach(() => service.startRecording());

    it('history.pushState to new path adds cy.url().should() command', () => {
      history.pushState({}, '', '/new-path');
      expect(service.getCommandsSnapshot().at(-1)).toBe(
        "cy.url().should('include', '/new-path')"
      );
    });

    it('history.replaceState to new path adds cy.url().should() command', () => {
      history.pushState({}, '', '/base'); // ensure a different starting point
      history.replaceState({}, '', '/replaced');
      expect(service.getCommandsSnapshot().at(-1)).toBe(
        "cy.url().should('include', '/replaced')"
      );
    });

    it('pushState to the same URL does NOT add a command', () => {
      const before = service.getCommandsSnapshot().length;
      const current = window.location.pathname;
      history.pushState({}, '', current);
      expect(service.getCommandsSnapshot().length).toBe(before);
    });
  });

  // ── pause/resume ─────────────────────────────────────────────────────────

  describe('pause / resume', () => {
    beforeEach(() => service.startRecording());

    it('getPausedSnapshot() is false initially', () => {
      expect(service.getPausedSnapshot()).toBe(false);
    });

    it('pauseRecording() sets isPaused to true', () => {
      service.pauseRecording();
      expect(service.getPausedSnapshot()).toBe(true);
    });

    it('resumeRecording() sets isPaused to false', () => {
      service.pauseRecording();
      service.resumeRecording();
      expect(service.getPausedSnapshot()).toBe(false);
    });

    it('togglePause() toggles paused state', () => {
      service.togglePause();
      expect(service.getPausedSnapshot()).toBe(true);
      service.togglePause();
      expect(service.getPausedSnapshot()).toBe(false);
    });

    it('pauseRecording() does nothing when not recording', () => {
      service.stopRecording();
      service.pauseRecording();
      expect(service.getPausedSnapshot()).toBe(false);
    });

    it('addCommand() is ignored when paused', () => {
      const before = service.getCommandsSnapshot().length;
      service.pauseRecording();
      service.addCommand('cy.get(".foo").click()');
      expect(service.getCommandsSnapshot().length).toBe(before);
    });

    it('addCommand() works again after resuming', () => {
      service.pauseRecording();
      service.resumeRecording();
      const before = service.getCommandsSnapshot().length;
      service.addCommand('cy.get(".foo").click()');
      expect(service.getCommandsSnapshot().length).toBe(before + 1);
    });

    it('registerInterceptor() is ignored when paused', () => {
      service.pauseRecording();
      service.registerInterceptor('GET', 'http://localhost/api/test', 'test');
      expect(service.getInterceptorsSnapshot()).toHaveLength(0);
    });

    it('stopRecording() resets pause to false', () => {
      service.pauseRecording();
      service.stopRecording();
      expect(service.getPausedSnapshot()).toBe(false);
    });

    it('onPauseChange() callback fires when pause state changes', () => {
      const states: boolean[] = [];
      service.onPauseChange((p) => states.push(p));
      service.pauseRecording();
      service.resumeRecording();
      expect(states).toContain(true);
      expect(states).toContain(false);
    });
  });

  // ── appendCommand / removeCommand / moveCommand ──────────────────────────

  describe('appendCommand', () => {
    it('adds command regardless of recording state', () => {
      service.appendCommand('cy.get(".foo").click()');
      expect(service.getCommandsSnapshot()).toContain('cy.get(".foo").click()');
    });

    it('adds command even when not recording', () => {
      service.appendCommand('added-without-recording');
      expect(service.getCommandsSnapshot()).toContain('added-without-recording');
    });
  });

  describe('removeCommand', () => {
    beforeEach(() => service.startRecording());

    it('removes command at given index', () => {
      service.addCommand('cy.get(".a").click()');
      const len = service.getCommandsSnapshot().length;
      service.removeCommand(len - 1);
      expect(service.getCommandsSnapshot()).not.toContain('cy.get(".a").click()');
    });

    it('out-of-bounds index is a no-op', () => {
      const len = service.getCommandsSnapshot().length;
      service.removeCommand(99);
      expect(service.getCommandsSnapshot().length).toBe(len);
    });

    it('negative index is a no-op', () => {
      const len = service.getCommandsSnapshot().length;
      service.removeCommand(-1);
      expect(service.getCommandsSnapshot().length).toBe(len);
    });
  });

  describe('moveCommand', () => {
    it('moves a command from one position to another', () => {
      service.startRecording();
      service.addCommand('cmd-A');
      service.addCommand('cmd-B');
      const cmds = service.getCommandsSnapshot();
      const idxA = cmds.indexOf('cmd-A');
      const idxB = cmds.indexOf('cmd-B');
      service.moveCommand(idxA, idxB);
      const after = service.getCommandsSnapshot();
      expect(after.indexOf('cmd-A')).toBe(idxB);
    });

    it('same from/to is a no-op', () => {
      service.startRecording();
      service.addCommand('cmd-X');
      const before = [...service.getCommandsSnapshot()];
      const idx = before.indexOf('cmd-X');
      service.moveCommand(idx, idx);
      expect(service.getCommandsSnapshot()).toEqual(before);
    });

    it('out-of-bounds from is a no-op', () => {
      service.startRecording();
      const before = [...service.getCommandsSnapshot()];
      service.moveCommand(99, 0);
      expect(service.getCommandsSnapshot()).toEqual(before);
    });
  });

  describe('removeInterceptor', () => {
    beforeEach(() => service.startRecording());

    it('removes interceptor at given index', () => {
      service.registerInterceptor('GET', 'http://localhost/api/a', 'a');
      service.registerInterceptor('POST', 'http://localhost/api/b', 'b');
      service.removeInterceptor(0);
      expect(service.getInterceptorsSnapshot()).toHaveLength(1);
    });

    it('out-of-bounds index is a no-op', () => {
      service.registerInterceptor('GET', 'http://localhost/api/a', 'a');
      service.removeInterceptor(99);
      expect(service.getInterceptorsSnapshot()).toHaveLength(1);
    });
  });

  // ── selectorStrategy ────────────────────────────────────────────────────

  describe('selectorStrategy', () => {
    beforeEach(() => service.startRecording());

    it('default strategy is data-cy', () => {
      const btn = makeElement('button', { 'data-cy': 'my-btn', 'data-testid': 'alt', id: 'validId' });
      click(btn);
      expect(service.getCommandsSnapshot().at(-1)).toContain('[data-cy="my-btn"]');
    });

    it('data-testid strategy prefers data-testid over data-cy', () => {
      service.selectorStrategy = 'data-testid';
      const btn = makeElement('button', { 'data-cy': 'my-btn', 'data-testid': 'test-btn' });
      click(btn);
      expect(service.getCommandsSnapshot().at(-1)).toContain('[data-testid="test-btn"]');
    });

    it('data-testid strategy falls back to data-cy when no data-testid', () => {
      service.selectorStrategy = 'data-testid';
      const btn = makeElement('button', { 'data-cy': 'fallback-btn' });
      click(btn);
      expect(service.getCommandsSnapshot().at(-1)).toContain('[data-cy="fallback-btn"]');
    });

    it('aria-label strategy prefers aria-label', () => {
      service.selectorStrategy = 'aria-label';
      const btn = makeElement('button', { 'aria-label': 'Close dialog', 'data-cy': 'close-btn' });
      click(btn);
      expect(service.getCommandsSnapshot().at(-1)).toContain('[aria-label="Close dialog"]');
    });

    it('id strategy prefers id over data-cy', () => {
      service.selectorStrategy = 'id';
      const btn = makeElement('button', { id: 'myButton', 'data-cy': 'my-btn' });
      click(btn);
      expect(service.getCommandsSnapshot().at(-1)).toContain('#myButton');
    });
  });

  // ── body / html click filtering ─────────────────────────────────────────

  describe('body and html click filtering', () => {
    beforeEach(() => service.startRecording());

    it('click on document.body adds no command', () => {
      const before = service.getCommandsSnapshot().length;
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      expect(service.getCommandsSnapshot().length).toBe(before);
    });

    it('click on document.body does not emit selectorNotFound', () => {
      let fired = false;
      service.onSelectorNotFound(() => { fired = true; });
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      expect(fired).toBe(false);
    });

    it('click on document.documentElement (html) adds no command', () => {
      const before = service.getCommandsSnapshot().length;
      document.documentElement.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      expect(service.getCommandsSnapshot().length).toBe(before);
    });

    it('click on document.documentElement does not emit selectorNotFound', () => {
      let fired = false;
      service.onSelectorNotFound(() => { fired = true; });
      document.documentElement.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      expect(fired).toBe(false);
    });
  });

  // ── own-element filtering ────────────────────────────────────────────────

  describe('own-element filtering (data-cy="lib-e2e-cypress-for-dummys")', () => {
    beforeEach(() => service.startRecording());

    it('click inside own container adds no command', () => {
      const host = makeElement('div', { 'data-cy': 'lib-e2e-cypress-for-dummys' });
      const btn = document.createElement('button');
      btn.setAttribute('data-cy', 'inner-btn');
      host.appendChild(btn);
      const before = service.getCommandsSnapshot().length;
      click(btn);
      expect(service.getCommandsSnapshot().length).toBe(before);
      host.remove();
    });

    it('click directly on own container adds no command', () => {
      const host = makeElement('div', { 'data-cy': 'lib-e2e-cypress-for-dummys' });
      const before = service.getCommandsSnapshot().length;
      click(host);
      expect(service.getCommandsSnapshot().length).toBe(before);
      host.remove();
    });

    it('does not emit selectorNotFound for clicks inside own container', () => {
      const host = makeElement('div', { 'data-cy': 'lib-e2e-cypress-for-dummys' });
      const inner = document.createElement('span');
      host.appendChild(inner);
      let fired = false;
      service.onSelectorNotFound(() => { fired = true; });
      click(inner);
      expect(fired).toBe(false);
      host.remove();
    });

    it('input inside own container is not recorded', () => {
      vi.useFakeTimers();
      const host = makeElement('div', { 'data-cy': 'lib-e2e-cypress-for-dummys' });
      const inp = document.createElement('input') as HTMLInputElement;
      inp.setAttribute('id', 'recorder-input');
      inp.type = 'text';
      host.appendChild(inp);
      const before = service.getCommandsSnapshot().length;
      input(inp, 'hello');
      vi.advanceTimersByTime(1200);
      expect(service.getCommandsSnapshot().length).toBe(before);
      host.remove();
    });
  });

  // ── onSelectorNotFound ───────────────────────────────────────────────────

  describe('onSelectorNotFound', () => {
    beforeEach(() => service.startRecording());

    it('emits when clicking an element with no testable selector', () => {
      const plain = makeElement('div'); // no data-cy, no id, no class
      let fired = false;
      service.onSelectorNotFound(() => { fired = true; });
      click(plain);
      expect(fired).toBe(true);
    });

    it('emits with the clicked element as target', () => {
      const plain = makeElement('button'); // no testable attrs
      let capturedTarget: HTMLElement | null = null;
      service.onSelectorNotFound((t) => { capturedTarget = t; });
      click(plain);
      expect(capturedTarget).toBe(plain);
    });

    it('emits action "click"', () => {
      const plain = makeElement('div');
      let capturedAction: string | null = null;
      service.onSelectorNotFound((_t, action) => { capturedAction = action; });
      click(plain);
      expect(capturedAction).toBe('click');
    });

    it('does NOT emit when element has a valid selector (data-cy)', () => {
      const btn = makeElement('button', { 'data-cy': 'submit' });
      let fired = false;
      service.onSelectorNotFound(() => { fired = true; });
      click(btn);
      expect(fired).toBe(false);
    });

    it('does NOT emit when not recording', () => {
      service.stopRecording();
      const plain = makeElement('div');
      let fired = false;
      service.onSelectorNotFound(() => { fired = true; });
      click(plain);
      expect(fired).toBe(false);
    });

    it('does not add a comment command when emitting selectorNotFound', () => {
      const plain = makeElement('div');
      service.onSelectorNotFound(() => {});
      click(plain);
      const hasComment = service.getCommandsSnapshot().some((c) => c.startsWith('//'));
      expect(hasComment).toBe(false);
    });

    it('unsubscribes when the returned function is called', () => {
      const plain = makeElement('div');
      let count = 0;
      const unsub = service.onSelectorNotFound(() => { count++; });
      click(plain);
      unsub();
      click(plain);
      expect(count).toBe(1);
    });

    it('emits for mat-select with no valid selector', () => {
      const matSelect = document.createElement('mat-select');
      document.body.appendChild(matSelect);

      let fired = false;
      service.onSelectorNotFound(() => { fired = true; });
      click(matSelect);

      expect(fired).toBe(true);
      matSelect.remove();
    });

    it('does not add comment for mat-select when no selector (emits instead)', () => {
      const matSelect = document.createElement('mat-select');
      document.body.appendChild(matSelect);

      service.onSelectorNotFound(() => {});
      click(matSelect);

      const cmds = service.getCommandsSnapshot();
      expect(cmds.some((c) => c.startsWith('//') && c.includes('mat-select'))).toBe(false);
      matSelect.remove();
    });

    it('emits selectorNotFound for input with no valid selector', () => {
      const inp = makeElement('input', { type: 'text' }) as HTMLInputElement;

      let fired = false;
      service.onSelectorNotFound(() => { fired = true; });
      click(inp);

      expect(fired).toBe(true);
    });

    it('does not record a click command for input with no valid selector', () => {
      const inp = makeElement('input', { type: 'text' }) as HTMLInputElement;
      service.onSelectorNotFound(() => {});
      const before = service.getCommandsSnapshot().length;
      click(inp);
      expect(service.getCommandsSnapshot().length).toBe(before);
    });

    it('does not emit selectorNotFound for input that has data-cy', () => {
      const inp = makeElement('input', { type: 'text', 'data-cy': 'my-input' }) as HTMLInputElement;

      let fired = false;
      service.onSelectorNotFound(() => { fired = true; });
      click(inp);

      expect(fired).toBe(false);
    });

    it('emits selectorNotFound for textarea with no valid selector', () => {
      const ta = makeElement('textarea') as HTMLTextAreaElement;

      let fired = false;
      service.onSelectorNotFound(() => { fired = true; });
      click(ta);

      expect(fired).toBe(true);
    });
  });
});
