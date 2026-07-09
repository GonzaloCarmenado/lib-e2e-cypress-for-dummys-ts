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
    el = document.createElement('lib-e2e-test-editor') as TestEditorElement;
    el.persistence = persistence;
    document.body.appendChild(el);
  });

  afterEach(() => {
    el.remove();
  });

  it('registers as <test-editor> custom element', () => {
    expect(customElements.get('lib-e2e-test-editor')).toBeDefined();
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

  it('clicking a row in select mode toggles its selection instead of expanding', async () => {
    const id = await persistence.insertTest('selectable');
    await el.loadTests();
    el.toggleSelectMode();
    const row = el.shadowRoot!.querySelector('[data-action="expand"]') as HTMLElement;
    row.click();
    expect(el.selectedIds.has(id)).toBe(true);
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

  it('generateDescribe() includes beforeEach when selected test has interceptors', async () => {
    const writeMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: writeMock }, configurable: true });
    await persistence.insertTest('icp test', ["cy.get('#btn').click()"], ["cy.intercept('GET', '**/api')"]);
    await el.loadTests();
    el.toggleExpand(0);
    el.toggleSelectTest(el.tests[0].id);
    el.describeName = 'Suite';
    el.generateDescribe();
    const generated = writeMock.mock.calls[0][0] as string;
    expect(generated).toContain('beforeEach');
  });

  // ── DOM event listener coverage ───────────────────────────────────────────

  it('[data-filter-tag] click sets activeTag', async () => {
    await persistence.insertTest('tagged', [], [], ['smoke']);
    await el.loadTests();
    const tagBtn = el.shadowRoot!.querySelector('[data-filter-tag]') as HTMLElement;
    tagBtn.click();
    expect(el.activeTag).toBe('smoke');
  });

  it('[data-filter-tag] click twice clears activeTag', async () => {
    await persistence.insertTest('tagged', [], [], ['smoke']);
    await el.loadTests();
    (el.shadowRoot!.querySelector('[data-filter-tag]') as HTMLElement).click();
    // After first click render() fires — re-query the button
    (el.shadowRoot!.querySelector('[data-filter-tag]') as HTMLElement).click();
    expect(el.activeTag).toBeNull();
  });

  it('[data-select] checkbox click toggles selection', async () => {
    await persistence.insertTest('test A');
    await el.loadTests();
    el.toggleSelectMode();
    const checkbox = el.shadowRoot!.querySelector('[data-select]') as HTMLElement;
    checkbox.click();
    expect(el.selectedIds.has(el.tests[0].id)).toBe(true);
  });

  it('[data-action="expand"] click in selectMode calls toggleSelectTest', async () => {
    await persistence.insertTest('test A');
    await el.loadTests();
    el.toggleSelectMode();
    const expandEl = el.shadowRoot!.querySelector('[data-action="expand"]') as HTMLElement;
    expandEl.click();
    expect(el.selectedIds.has(el.tests[0].id)).toBe(true);
  });

  it('[data-action="delete"] click removes the test', async () => {
    await persistence.insertTest('to delete');
    await el.loadTests();
    const deleteBtn = el.shadowRoot!.querySelector('[data-action="delete"]') as HTMLElement;
    deleteBtn.click();
    await vi.waitFor(() => expect(el.tests).toHaveLength(0));
  });

  it('[data-action="copy-cmds"] click calls clipboard.writeText', async () => {
    const writeMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: writeMock }, configurable: true });
    await persistence.insertTest('test', ["cy.get('#btn').click()"]);
    await el.loadTests();
    el.toggleExpand(0);
    const copyBtn = el.shadowRoot!.querySelector('[data-action="copy-cmds"]') as HTMLElement;
    copyBtn.click();
    expect(writeMock).toHaveBeenCalled();
  });

  it('[data-action="copy-icps"] click calls clipboard.writeText', async () => {
    const writeMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: writeMock }, configurable: true });
    await persistence.insertTest('test', ["cy.get('#btn').click()"], ["cy.intercept('GET', '**/api')"]);
    await el.loadTests();
    el.toggleExpand(0);
    const copyBtn = el.shadowRoot!.querySelector('[data-action="copy-icps"]') as HTMLElement;
    copyBtn.click();
    expect(writeMock).toHaveBeenCalled();
  });

  it('input on #describe-name updates describeName', async () => {
    await persistence.insertTest('test A');
    await el.loadTests();
    el.toggleSelectMode();
    el.toggleSelectTest(el.tests[0].id);
    const descInput = el.shadowRoot!.getElementById('describe-name') as HTMLInputElement;
    descInput.value = 'My Suite';
    descInput.dispatchEvent(new Event('input'));
    expect(el.describeName).toBe('My Suite');
  });

  it('expanded row shows .test-notes paragraph when test has notes', async () => {
    await persistence.insertTest('noted test', [], [], [], 'Validates the login flow.');
    await el.loadTests();
    el.toggleExpand(0);
    (el as any).render();
    const notesEl = el.shadowRoot!.querySelector('.test-notes');
    expect(notesEl).not.toBeNull();
    expect(notesEl!.textContent).toContain('Validates the login flow.');
  });

  it('expanded row does not show .test-notes when test has no notes', async () => {
    await persistence.insertTest('no notes test');
    await el.loadTests();
    el.toggleExpand(0);
    (el as any).render();
    expect(el.shadowRoot!.querySelector('.test-notes')).toBeNull();
  });

  it('#btn-gen-describe click generates describe block', async () => {
    const writeMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: writeMock }, configurable: true });
    await persistence.insertTest('test A');
    await el.loadTests();
    el.toggleSelectMode();
    el.toggleSelectTest(el.tests[0].id);
    const btn = el.shadowRoot!.getElementById('btn-gen-describe') as HTMLButtonElement;
    btn.click();
    expect(writeMock).toHaveBeenCalled();
  });
});
