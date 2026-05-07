import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../src/components/test-editor/test-editor';
import type { TestEditorElement } from '../../src/components/test-editor/test-editor';
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

  // ── tag filter ───────────────────────────────────────────────────────────

  it('allTags returns unique sorted tags from all tests', async () => {
    await persistence.insertTest('a', [], [], ['smoke', 'login']);
    await persistence.insertTest('b', [], [], ['smoke', 'regression']);
    await el.loadTests();
    expect(el.allTags).toEqual(['login', 'regression', 'smoke']);
  });

  it('visibleTests shows all tests when no activeTag', async () => {
    await persistence.insertTest('a', [], [], ['smoke']);
    await persistence.insertTest('b', [], [], ['login']);
    await el.loadTests();
    expect(el.visibleTests).toHaveLength(2);
  });

  it('visibleTests filters by activeTag', async () => {
    await persistence.insertTest('a', [], [], ['smoke']);
    await persistence.insertTest('b', [], [], ['login']);
    await el.loadTests();
    el.activeTag = 'smoke';
    expect(el.visibleTests).toHaveLength(1);
    expect(el.visibleTests[0].name).toBe('a');
  });

  it('tags are rendered in shadow DOM when test has tags', async () => {
    await persistence.insertTest('tagged test', [], [], ['smoke']);
    await el.loadTests();
    expect(el.shadowRoot!.textContent).toContain('smoke');
  });

  // ── select mode / describe grouping ──────────────────────────────────────

  it('selectMode is false initially', () => {
    expect(el.selectMode).toBe(false);
  });

  it('toggleSelectMode() activates select mode', () => {
    el.toggleSelectMode();
    expect(el.selectMode).toBe(true);
  });

  it('toggleSelectMode() a second time deactivates and clears selection', async () => {
    await persistence.insertTest('test A');
    await el.loadTests();
    el.toggleSelectMode();
    el.toggleSelectTest(el.tests[0].id);
    el.toggleSelectMode();
    expect(el.selectMode).toBe(false);
    expect(el.selectedIds.size).toBe(0);
  });

  it('toggleSelectTest() adds id to selectedIds', async () => {
    await persistence.insertTest('test A');
    await el.loadTests();
    el.toggleSelectTest(el.tests[0].id);
    expect(el.selectedIds.has(el.tests[0].id)).toBe(true);
  });

  it('toggleSelectTest() removes id when already selected', async () => {
    await persistence.insertTest('test A');
    await el.loadTests();
    const id = el.tests[0].id;
    el.toggleSelectTest(id);
    el.toggleSelectTest(id);
    expect(el.selectedIds.has(id)).toBe(false);
  });

  it('generateDescribe() writes describe block to clipboard', async () => {
    const writeMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: writeMock }, configurable: true });
    await persistence.insertTest('login flow', ["cy.get('[data-cy=\"btn\"]').click()"]);
    await el.loadTests();
    el.toggleSelectTest(el.tests[0].id);
    el.toggleExpand(0);
    el.describeName = 'My Suite';
    el.generateDescribe();
    expect(writeMock).toHaveBeenCalled();
    const generated = writeMock.mock.calls[0][0] as string;
    expect(generated).toContain("describe('My Suite'");
    expect(generated).toContain("it('login flow'");
  });
});
