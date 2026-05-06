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

  it('initial tags is empty array', () => {
    expect(el.tags).toEqual([]);
  });

  it('askSave() changes step to "desc"', () => {
    el.askSave();
    expect(el.step).toBe('desc');
  });

  it('confirmSave() dispatches "savetest" event with trimmed description and tags', () => {
    let received: any;
    el.addEventListener('savetest', (e: Event) => { received = (e as CustomEvent).detail; });
    el.description = '  my test  ';
    el.confirmSave();
    expect(received.description).toBe('my test');
    expect(received.tags).toEqual([]);
  });

  it('confirmSave() includes tags in event detail', () => {
    let received: any;
    el.addEventListener('savetest', (e: Event) => { received = (e as CustomEvent).detail; });
    el.description = 'test';
    el.addTag('smoke');
    el.addTag('login');
    el.confirmSave();
    expect(received.tags).toEqual(['smoke', 'login']);
  });

  it('confirmSave() dispatches "savetest" with empty description when blank', () => {
    let received: any;
    el.addEventListener('savetest', (e: Event) => { received = (e as CustomEvent).detail; });
    el.description = '';
    el.confirmSave();
    expect(received.description).toBe('');
  });

  it('cancel() dispatches "savetest" event with null description', () => {
    let received: any;
    el.addEventListener('savetest', (e: Event) => { received = (e as CustomEvent).detail; });
    el.cancel();
    expect(received.description).toBeNull();
    expect(received.tags).toEqual([]);
  });

  it('confirmSaveAndExport() dispatches "saveandexport" event with trimmed description', () => {
    let received: any;
    el.addEventListener('saveandexport', (e: Event) => { received = (e as CustomEvent).detail; });
    el.description = '  export test  ';
    el.confirmSaveAndExport();
    expect(received.description).toBe('export test');
  });

  it('addTag() adds a tag and deduplicates', () => {
    el.addTag('smoke');
    el.addTag('smoke');
    expect(el.tags).toEqual(['smoke']);
  });

  it('addTag() trims and ignores commas/semicolons', () => {
    el.addTag(' login, ');
    expect(el.tags).toEqual(['login']);
  });

  it('removeTag() removes the specified tag', () => {
    el.addTag('smoke');
    el.addTag('login');
    el.removeTag('smoke');
    expect(el.tags).toEqual(['login']);
  });

  it('restartComponent() resets step to "ask"', () => {
    el.askSave();
    el.description = 'something';
    el.restartComponent();
    expect(el.step).toBe('ask');
  });

  it('restartComponent() resets description and tags', () => {
    el.description = 'something';
    el.addTag('smoke');
    el.restartComponent();
    expect(el.description).toBe('');
    expect(el.tags).toEqual([]);
  });
});
