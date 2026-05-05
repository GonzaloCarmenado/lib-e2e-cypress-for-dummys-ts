import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../src/components/save-test';
import type { SaveTestElement } from '../../src/components/save-test';

describe('Phase 8.2 — SaveTestElement', () => {
  let el: SaveTestElement;

  beforeEach(() => {
    el = document.createElement('save-test') as SaveTestElement;
    document.body.appendChild(el);
  });

  afterEach(() => {
    el.remove();
  });

  it('registers as <save-test> custom element', () => {
    expect(customElements.get('save-test')).toBeDefined();
  });

  it('initial step is "ask"', () => {
    expect(el.step).toBe('ask');
  });

  it('initial description is empty string', () => {
    expect(el.description).toBe('');
  });

  it('askSave() changes step to "desc"', () => {
    el.askSave();
    expect(el.step).toBe('desc');
  });

  it('confirmSave() dispatches "savetest" event with trimmed description', () => {
    let received: string | null = undefined as any;
    el.addEventListener('savetest', (e: Event) => {
      received = (e as CustomEvent).detail;
    });
    el.description = '  my test  ';
    el.confirmSave();
    expect(received).toBe('my test');
  });

  it('confirmSave() dispatches "savetest" with empty string when description is blank', () => {
    let received: string | null = undefined as any;
    el.addEventListener('savetest', (e: Event) => {
      received = (e as CustomEvent).detail;
    });
    el.description = '';
    el.confirmSave();
    expect(received).toBe('');
  });

  it('cancel() dispatches "savetest" event with null detail', () => {
    let received: unknown = 'not-set';
    el.addEventListener('savetest', (e: Event) => {
      received = (e as CustomEvent).detail;
    });
    el.cancel();
    expect(received).toBeNull();
  });

  it('confirmSaveAndExport() dispatches "saveandexport" event with trimmed description', () => {
    let received: string | null = undefined as any;
    el.addEventListener('saveandexport', (e: Event) => {
      received = (e as CustomEvent).detail;
    });
    el.description = '  export test  ';
    el.confirmSaveAndExport();
    expect(received).toBe('export test');
  });

  it('restartComponent() resets step to "ask"', () => {
    el.askSave();
    el.description = 'something';
    el.restartComponent();
    expect(el.step).toBe('ask');
  });

  it('restartComponent() resets description to empty string', () => {
    el.description = 'something';
    el.restartComponent();
    expect(el.description).toBe('');
  });
});
