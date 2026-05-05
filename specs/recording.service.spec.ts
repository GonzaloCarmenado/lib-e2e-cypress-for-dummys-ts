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

    it("escapes single quotes in the typed value", () => {
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
});
