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
});
