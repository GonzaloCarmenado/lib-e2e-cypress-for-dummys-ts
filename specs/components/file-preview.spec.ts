import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../../src/components/file-preview';
import type { FilePreviewElement } from '../../src/components/file-preview';

describe('Phase 8.6 — FilePreviewElement', () => {
  let el: FilePreviewElement;

  beforeEach(() => {
    el = document.createElement('file-preview') as FilePreviewElement;
    document.body.appendChild(el);
  });

  afterEach(() => {
    el.remove();
    vi.restoreAllMocks();
  });

  it('registers as <file-preview> custom element', () => {
    expect(customElements.get('file-preview')).toBeDefined();
  });

  it('renders fileContent in the editor area', () => {
    el.fileContent = "cy.visit('/')";
    expect(el.shadowRoot!.querySelector('textarea')?.value).toBe("cy.visit('/')");
  });

  it('updating fileContent updates the textarea', () => {
    el.fileContent = 'first content';
    el.fileContent = 'updated content';
    expect(el.shadowRoot!.querySelector('textarea')?.value).toBe('updated content');
  });

  it('saveFile() dispatches "save" CustomEvent with current editor content', () => {
    el.fileContent = 'const x = 1;';
    let detail: string | null = null;
    el.addEventListener('save', (e) => { detail = (e as CustomEvent).detail; });
    el.saveFile();
    expect(detail).toBe('const x = 1;');
  });

  it('onClose() dispatches "close" CustomEvent', () => {
    let fired = false;
    el.addEventListener('close', () => { fired = true; });
    el.onClose();
    expect(fired).toBe(true);
  });

  it('launchTest() sends POST to localhost:8123/run-test', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue({ ok: true }) });
    vi.stubGlobal('fetch', mockFetch);
    el.fileName = 'test.cy.ts';
    await el.launchTest();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8123/run-test',
      expect.objectContaining({ method: 'POST' })
    );
    vi.unstubAllGlobals();
  });

  it('launchTest() uses provided specPath when given', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue({ ok: true }) });
    vi.stubGlobal('fetch', mockFetch);
    await el.launchTest('cypress/e2e/custom.cy.ts');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.specPath).toBe('cypress/e2e/custom.cy.ts');
    vi.unstubAllGlobals();
  });

  it('copyToClipboard calls navigator.clipboard.writeText', () => {
    const writeMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeMock },
      configurable: true,
    });
    el.copyToClipboard('hello');
    expect(writeMock).toHaveBeenCalledWith('hello');
  });

  it('fileName defaults to null', () => {
    expect(el.fileName).toBeNull();
  });

  it('fileContent defaults to null', () => {
    const fresh = document.createElement('file-preview') as FilePreviewElement;
    expect(fresh.fileContent).toBeNull();
    fresh.remove();
  });

  it('closeLabel defaults to the translated close string', () => {
    expect(el.closeLabel).toBe('✕ Close');
  });

  it('default closeLabel renders in the close button', () => {
    const btn = el.shadowRoot!.querySelector('#btn-close');
    expect(btn?.textContent?.trim()).toBe('✕ Close');
  });

  it('closeLabel set before mount renders custom text in close button', () => {
    const fresh = document.createElement('file-preview') as FilePreviewElement;
    fresh.closeLabel = '← Volver al editor';
    document.body.appendChild(fresh);
    const btn = fresh.shadowRoot!.querySelector('#btn-close');
    expect(btn?.textContent?.trim()).toBe('← Volver al editor');
    fresh.remove();
  });

  it('blocks panel is hidden when both itBlock and interceptorsBlock are empty', () => {
    expect(el.shadowRoot!.querySelector('.blocks-panel')).toBeNull();
  });

  it('blocks panel appears when itBlock is set before mount', () => {
    const fresh = document.createElement('file-preview') as FilePreviewElement;
    fresh.itBlock = "it('test', () => { cy.visit('/'); });";
    document.body.appendChild(fresh);
    expect(fresh.shadowRoot!.querySelector('.blocks-panel')).not.toBeNull();
    expect(fresh.shadowRoot!.querySelector('#btn-copy-it')).not.toBeNull();
    fresh.remove();
  });

  it('blocks panel appears when only interceptorsBlock is set', () => {
    const fresh = document.createElement('file-preview') as FilePreviewElement;
    fresh.interceptorsBlock = "beforeEach(() => { cy.intercept('GET', '*'); });";
    document.body.appendChild(fresh);
    expect(fresh.shadowRoot!.querySelector('.blocks-panel')).not.toBeNull();
    expect(fresh.shadowRoot!.querySelector('#btn-copy-icp')).not.toBeNull();
    fresh.remove();
  });

  it('interceptorsBlock copy button appears when both blocks are set', () => {
    const fresh = document.createElement('file-preview') as FilePreviewElement;
    fresh.itBlock = "it('test', () => {});";
    fresh.interceptorsBlock = "beforeEach(() => { cy.intercept('GET', '*'); });";
    document.body.appendChild(fresh);
    expect(fresh.shadowRoot!.querySelector('#btn-copy-it')).not.toBeNull();
    expect(fresh.shadowRoot!.querySelector('#btn-copy-icp')).not.toBeNull();
    fresh.remove();
  });

  it('interceptorsBlock copy button is absent when only itBlock is set', () => {
    const fresh = document.createElement('file-preview') as FilePreviewElement;
    fresh.itBlock = "it('test', () => {});";
    document.body.appendChild(fresh);
    expect(fresh.shadowRoot!.querySelector('#btn-copy-icp')).toBeNull();
    fresh.remove();
  });

  it('it() copy button is absent when only interceptorsBlock is set', () => {
    const fresh = document.createElement('file-preview') as FilePreviewElement;
    fresh.interceptorsBlock = "beforeEach(() => {});";
    document.body.appendChild(fresh);
    expect(fresh.shadowRoot!.querySelector('#btn-copy-it')).toBeNull();
    fresh.remove();
  });

  it('interceptorsBlock defaults to empty string', () => {
    expect(el.interceptorsBlock).toBe('');
  });

  // ── diff view ────────────────────────────────────────────────────────────

  it('diff button is absent when content has not changed', () => {
    el.fileContent = 'const x = 1;';
    expect(el.shadowRoot!.querySelector('#btn-diff')).toBeNull();
  });

  it('diff button appears after content is modified', () => {
    el.fileContent = 'line one';
    el.fileContent = 'line two';
    // fileContent setter doesn't re-render when textarea exists; force a render via toggleDiff
    el.toggleDiff();
    expect(el.shadowRoot!.querySelector('#btn-diff')).not.toBeNull();
  });

  it('diff panel is not shown by default', () => {
    el.fileContent = 'original';
    el.fileContent = 'modified';
    expect(el.shadowRoot!.querySelector('#diff-panel')).toBeNull();
    expect(el.shadowRoot!.querySelector('textarea')).not.toBeNull();
  });

  it('toggleDiff() replaces textarea with diff panel', () => {
    el.fileContent = 'original';
    el.fileContent = 'modified';
    el.toggleDiff();
    expect(el.shadowRoot!.querySelector('#diff-panel')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('textarea')).toBeNull();
  });

  it('toggleDiff() called twice restores textarea', () => {
    el.fileContent = 'original';
    el.fileContent = 'modified';
    el.toggleDiff();
    el.toggleDiff();
    expect(el.shadowRoot!.querySelector('textarea')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('#diff-panel')).toBeNull();
  });

  it('diff panel contains added lines with class "added"', () => {
    el.fileContent = 'line one';
    el.fileContent = 'line one\nnew line';
    el.toggleDiff();
    const added = el.shadowRoot!.querySelectorAll('.diff-line.added');
    expect(added.length).toBeGreaterThan(0);
  });

  it('diff panel contains removed lines with class "removed"', () => {
    el.fileContent = 'line one\nline two';
    el.fileContent = 'line one';
    el.toggleDiff();
    const removed = el.shadowRoot!.querySelectorAll('.diff-line.removed');
    expect(removed.length).toBeGreaterThan(0);
  });

  it('originalContent is locked after first fileContent assignment', () => {
    el.fileContent = 'first';   // _originalContent = 'first'
    el.fileContent = 'second';  // updates textarea only, no render
    el.fileContent = 'third';   // updates textarea only, no render
    el.toggleDiff();            // force render: hasChanges = ('first' !== 'third') → btn-diff present
    expect(el.shadowRoot!.querySelector('#btn-diff')).not.toBeNull();
    // In diff mode textarea is null, so next fileContent set calls render()
    el.fileContent = 'first';   // _fileContent = 'first', render() called, hasChanges = false
    expect(el.shadowRoot!.querySelector('#btn-diff')).toBeNull();
  });

  it('diff button has btn-diff-active class when diff is shown', () => {
    el.fileContent = 'original';
    el.fileContent = 'modified';
    el.toggleDiff();
    const btn = el.shadowRoot!.querySelector('#btn-diff');
    expect(btn?.classList.contains('btn-diff-active')).toBe(true);
  });

  it('diff button loses btn-diff-active class after second toggle', () => {
    el.fileContent = 'original';
    el.fileContent = 'modified';
    el.toggleDiff();
    el.toggleDiff();
    const btn = el.shadowRoot!.querySelector('#btn-diff');
    expect(btn?.classList.contains('btn-diff-active')).toBe(false);
  });
});
