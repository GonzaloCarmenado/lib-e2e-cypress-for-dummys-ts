import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../../src/components/test-previsualizer/test-previsualizer';
import type { TestPrevisualizerElement } from '../../src/components/test-previsualizer/test-previsualizer';

describe('Phase 8.1 — TestPrevisualizerElement', () => {
  let el: TestPrevisualizerElement;

  beforeEach(() => {
    el = document.createElement('lib-e2e-test-previsualizer') as TestPrevisualizerElement;
    document.body.appendChild(el);
  });

  afterEach(() => {
    el.remove();
  });

  it('registers as <test-previsualizer> custom element', () => {
    expect(customElements.get('lib-e2e-test-previsualizer')).toBeDefined();
  });

  it('has a shadow root after connecting', () => {
    expect(el.shadowRoot).not.toBeNull();
  });

  it('initial commands list is empty', () => {
    expect(el.commands).toEqual([]);
  });

  it('setting commands renders them in shadow DOM', () => {
    el.commands = ["cy.visit('/')"];
    expect(el.shadowRoot!.textContent).toContain("cy.visit('/')");
  });

  it('setting multiple commands renders all of them', () => {
    el.commands = ["cy.visit('/')", "cy.get('#btn').click()"];
    const text = el.shadowRoot!.textContent!;
    expect(text).toContain("cy.visit('/')");
    expect(text).toContain("cy.get('#btn').click()");
  });

  it('showInterceptors is false by default', () => {
    expect(el.showInterceptors).toBe(false);
  });

  it('toggleInterceptors flips showInterceptors to true', () => {
    el.toggleInterceptors();
    expect(el.showInterceptors).toBe(true);
  });

  it('toggleInterceptors called twice restores to false', () => {
    el.toggleInterceptors();
    el.toggleInterceptors();
    expect(el.showInterceptors).toBe(false);
  });

  it('interceptors are NOT rendered when showInterceptors is false', () => {
    el.interceptors = ['cy.intercept("GET", "**/api")'];
    const intercSection = el.shadowRoot!.querySelector('[data-section="interceptors"]');
    expect(intercSection).toBeNull();
  });

  it('interceptors ARE rendered after toggleInterceptors', () => {
    el.interceptors = ['cy.intercept("GET", "**/api")'];
    el.toggleInterceptors();
    expect(el.shadowRoot!.textContent).toContain('cy.intercept("GET", "**/api")');
  });

  it('copyToClipboard calls navigator.clipboard.writeText with commands joined by newline', () => {
    const writeMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeMock },
      configurable: true,
    });
    el.commands = ["cy.visit('/')", "cy.get('#btn').click()"];
    el.copyToClipboard();
    expect(writeMock).toHaveBeenCalledWith("cy.visit('/')\ncy.get('#btn').click()");
  });

  it('copyInterceptorsToClipboard calls clipboard with interceptors joined by newline', () => {
    const writeMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeMock },
      configurable: true,
    });
    el.interceptors = ["cy.intercept('GET', '**/api').as('api')"];
    el.copyInterceptorsToClipboard();
    expect(writeMock).toHaveBeenCalledWith("cy.intercept('GET', '**/api').as('api')");
  });

  it('copyToClipboard does nothing when commands list is empty', () => {
    const writeMock = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeMock },
      configurable: true,
    });
    el.commands = [];
    el.copyToClipboard();
    expect(writeMock).not.toHaveBeenCalled();
  });

  // ── editable mode ────────────────────────────────────────────────────────

  it('editable defaults to false', () => {
    expect(el.editable).toBe(false);
  });

  it('no delete buttons when editable is false', () => {
    el.commands = ["cy.get('[data-cy=\"btn\"]').click()"];
    const del = el.shadowRoot!.querySelector('[data-del]');
    expect(del).toBeNull();
  });

  it('delete buttons appear when editable is true', () => {
    el.editable = true;
    el.commands = ["cy.get('[data-cy=\"btn\"]').click()"];
    const del = el.shadowRoot!.querySelector('[data-del]');
    expect(del).not.toBeNull();
  });

  it('clicking delete button dispatches deletecommand event with correct index', () => {
    el.editable = true;
    el.commands = ['cmd-0', 'cmd-1'];
    let received: number | null = null;
    el.addEventListener('deletecommand', (e: Event) => {
      received = (e as CustomEvent).detail;
    });
    const delBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[data-del="1"]');
    delBtn?.click();
    expect(received).toBe(1);
  });

  it('clicking move-up button dispatches movecommand event with from/to', () => {
    el.editable = true;
    el.commands = ['cmd-0', 'cmd-1'];
    let received: { from: number; to: number } | null = null;
    el.addEventListener('movecommand', (e: Event) => {
      received = (e as CustomEvent).detail;
    });
    const upBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[data-move-up="1"]');
    upBtn?.click();
    expect(received).toEqual({ from: 1, to: 0 });
  });

  it('clicking move-down button dispatches movecommand event with from/to', () => {
    el.editable = true;
    el.commands = ['cmd-0', 'cmd-1'];
    let received: { from: number; to: number } | null = null;
    el.addEventListener('movecommand', (e: Event) => {
      received = (e as CustomEvent).detail;
    });
    const dnBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[data-move-dn="0"]');
    dnBtn?.click();
    expect(received).toEqual({ from: 0, to: 1 });
  });

  it('delete interceptor button dispatches deleteinterceptor event', () => {
    el.editable = true;
    el.interceptors = ['cy.intercept("GET", "**/api").as("api")'];
    el.toggleInterceptors();
    let received: number | null = null;
    el.addEventListener('deleteinterceptor', (e: Event) => {
      received = (e as CustomEvent).detail;
    });
    const delBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[data-del-icp="0"]');
    delBtn?.click();
    expect(received).toBe(0);
  });
});
