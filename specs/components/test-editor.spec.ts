import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../src/components/test-editor';
import type { TestEditorElement } from '../../src/components/test-editor';
import { PersistenceService } from '../../src/services/persistence.service';

let dbCounter = 0;

describe('Phase 8.3 — TestEditorElement', () => {
  let el: TestEditorElement;
  let persistence: PersistenceService;

  beforeEach(async () => {
    persistence = new PersistenceService(`test_editor_db_${++dbCounter}`);
    el = document.createElement('test-editor') as TestEditorElement;
    el.persistence = persistence;
    document.body.appendChild(el);
  });

  afterEach(() => {
    el.remove();
  });

  it('registers as <test-editor> custom element', () => {
    expect(customElements.get('test-editor')).toBeDefined();
  });

  it('initial tests list is empty', () => {
    expect(el.tests).toEqual([]);
  });

  it('loadTests() populates the tests array', async () => {
    await persistence.insertTest('my test');
    await el.loadTests();
    expect(el.tests).toHaveLength(1);
    expect(el.tests[0].name).toBe('my test');
  });

  it('loadTests() renders tests in shadow DOM', async () => {
    await persistence.insertTest('rendered test');
    await el.loadTests();
    expect(el.shadowRoot!.textContent).toContain('rendered test');
  });

  it('deleteTest(id) removes the test from the list', async () => {
    const id = await persistence.insertTest('to delete');
    await el.loadTests();
    expect(el.tests).toHaveLength(1);
    await el.deleteTest(id);
    expect(el.tests).toHaveLength(0);
  });

  it('expandedIndex is null initially', () => {
    expect(el.expandedIndex).toBeNull();
  });

  it('toggleExpand(0) sets expandedIndex to 0', async () => {
    await persistence.insertTest('test A');
    await el.loadTests();
    el.toggleExpand(0);
    expect(el.expandedIndex).toBe(0);
  });

  it('toggleExpand(0) called twice collapses back to null', async () => {
    await persistence.insertTest('test A');
    await el.loadTests();
    el.toggleExpand(0);
    el.toggleExpand(0);
    expect(el.expandedIndex).toBeNull();
  });

  it('hasInterceptors returns false when no interceptors loaded', async () => {
    const id = await persistence.insertTest('no interceptors');
    await el.loadTests();
    el.toggleExpand(0);
    expect(el.hasInterceptors(id)).toBe(false);
  });

  it('hasInterceptors returns true when test has interceptors', async () => {
    const id = await persistence.insertTest('with interceptors', [], ["cy.intercept('GET', '**/api')"]);
    await el.loadTests();
    el.toggleExpand(0);
    expect(el.hasInterceptors(id)).toBe(true);
  });
});
