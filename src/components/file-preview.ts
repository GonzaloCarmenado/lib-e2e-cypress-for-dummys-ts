const STYLES = `
  :host { display: block; height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e6edf3; }
  * { box-sizing: border-box; }
  .container { display: flex; flex-direction: column; height: 100%; }
  .header {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px; border-bottom: 1px solid #21262d;
    background: #161b22;
  }
  .file-name { flex: 1; font-size: 12px; color: #8b949e;
               font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace; }
  .body { display: flex; flex: 1; overflow: hidden; min-height: 0; }
  .editor {
    flex: 1; min-width: 0; padding: 14px;
    background: #0d1117; color: #c9d1d9; border: none; outline: none;
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace; font-size: 12px;
    line-height: 1.7; resize: none;
    scrollbar-width: thin; scrollbar-color: #30363d transparent;
  }
  .editor::-webkit-scrollbar { width: 5px; }
  .editor::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
  .blocks-panel {
    width: 260px; flex-shrink: 0; border-left: 1px solid #21262d;
    background: #0d1117; padding: 10px 12px; overflow-y: auto;
    display: flex; flex-direction: column; gap: 10px;
    scrollbar-width: thin; scrollbar-color: #30363d transparent;
  }
  .blocks-panel::-webkit-scrollbar { width: 4px; }
  .blocks-panel::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; }
  .block-section { display: flex; flex-direction: column; gap: 4px; }
  .block-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; }
  .block-label { font-size: 10px; color: #484f58; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 600; }
  .btn-copy-sm {
    padding: 2px 8px; border: 1px solid #30363d; border-radius: 4px; cursor: pointer;
    font-size: 10px; font-weight: 500; background: #21262d; color: #8b949e;
    transition: background 0.12s, color 0.12s; white-space: nowrap;
  }
  .btn-copy-sm:hover { background: #30363d; color: #e6edf3; }
  .block-pre {
    margin: 0; padding: 6px 8px; background: #161b22;
    border-radius: 5px; border: 1px solid #21262d;
    font-size: 10px; color: #c9d1d9; line-height: 1.6;
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    max-height: 280px; overflow-y: auto; white-space: pre-wrap; word-break: break-all;
    scrollbar-width: thin; scrollbar-color: #30363d transparent;
  }
  .diff-panel {
    flex: 1; overflow-y: auto; background: #0d1117; border-left: 1px solid #21262d;
    padding: 8px 0; min-width: 0;
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace; font-size: 11px;
    line-height: 1.6;
    scrollbar-width: thin; scrollbar-color: #30363d transparent;
  }
  .diff-panel::-webkit-scrollbar { width: 5px; }
  .diff-panel::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
  .diff-line {
    display: flex; gap: 0; white-space: pre; padding: 0 12px;
  }
  .diff-line.added   { background: rgba(63,185,80,0.12); color: #3fb950; }
  .diff-line.removed { background: rgba(248,81,73,0.1);  color: #f85149; }
  .diff-line.same    { color: #484f58; }
  .diff-sign { width: 14px; flex-shrink: 0; user-select: none; }
  .diff-empty { color: #484f58; font-size: 12px; padding: 20px; text-align: center; }
  .footer {
    display: flex; gap: 8px; padding: 8px 12px;
    border-top: 1px solid #21262d; justify-content: flex-end;
    background: #161b22;
  }
  button {
    padding: 6px 14px; border: 1px solid #30363d; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-weight: 500; background: #21262d; color: #8b949e;
    transition: background 0.15s, color 0.12s;
  }
  button:hover { background: #30363d; color: #e6edf3; }
  .btn-save { background: #3fb950; border-color: #3fb950; color: #fff; }
  .btn-save:hover { background: #2ea043; border-color: #2ea043; }
  .btn-launch { background: transparent; border-color: #e3b341; color: #e3b341; }
  .btn-launch:hover { background: rgba(227,179,65,0.1); }
  .btn-diff-active { background: rgba(47,129,247,0.15); border-color: rgba(47,129,247,0.4); color: #2f81f7; }
`;

import { translationService, TranslationService } from '../services/translation.service';

export class FilePreviewElement extends HTMLElement {
  private shadow: ShadowRoot;
  private textarea: HTMLTextAreaElement | null = null;

  fileName: string | null = null;
  closeLabel = '';
  translation: TranslationService = translationService;
  itBlock = '';
  interceptorsBlock = '';
  commands: string[] = [];
  interceptors: string[] = [];
  private _fileContent: string | null = null;
  private _originalContent: string | null = null;
  private _showDiff = false;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    if (!this.closeLabel) this.closeLabel = this.translation.translate('FILE_PREVIEW.CLOSE_BTN');
    this.render();
  }

  private t(key: string): string { return this.translation.translate(key); }

  get fileContent(): string | null { return this._fileContent; }
  set fileContent(v: string | null) {
    if (this._originalContent === null) this._originalContent = v;
    this._fileContent = v;
    if (this.textarea) this.textarea.value = v ?? '';
    else this.render();
  }

  saveFile(): void {
    const content = this.textarea?.value ?? this._fileContent ?? '';
    this.dispatchEvent(new CustomEvent('save', { detail: content, bubbles: true, composed: true }));
  }

  onClose(): void {
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }

  async launchTest(specPath?: string): Promise<void> {
    const path = specPath ?? (this.fileName ? `cypress/e2e/${this.fileName}` : '');
    if (!path) return;
    const response = await fetch('http://localhost:8123/run-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specPath: path }),
    });
    await response.json();
  }

  copyToClipboard(text: string): void {
    navigator.clipboard?.writeText(text);
  }

  toggleDiff(): void {
    this._showDiff = !this._showDiff;
    this.render();
  }

  private buildDiffHtml(): string {
    const orig = this._originalContent ?? '';
    const curr = this.textarea?.value ?? this._fileContent ?? '';
    if (orig === curr) return `<div class="diff-empty">${this.t('FILE_PREVIEW.NO_CHANGES')}</div>`;

    const diff = computeDiff(orig, curr);
    if (!diff.length) return `<div class="diff-empty">${this.t('FILE_PREVIEW.NO_CHANGES_SHORT')}</div>`;

    // Collapse long same-line runs: show max 3 context lines between hunks
    const CONTEXT = 2;
    const compressed: typeof diff = [];
    let sameRun = 0;
    for (let i = 0; i < diff.length; i++) {
      if (diff[i].type === 'same') {
        sameRun++;
        if (sameRun <= CONTEXT) compressed.push(diff[i]);
        else if (i + 1 < diff.length && diff[i + 1].type !== 'same') {
          // last CONTEXT lines before a change
          if (sameRun > CONTEXT * 2) compressed.push({ type: 'same', line: '…' });
          compressed.push(diff[i]);
        }
      } else {
        sameRun = 0;
        compressed.push(diff[i]);
      }
    }

    return compressed.map(({ type, line }) => {
      const sign = type === 'added' ? '+' : type === 'removed' ? '−' : ' ';
      return `<div class="diff-line ${type}"><span class="diff-sign">${sign}</span><span>${escHtml(line)}</span></div>`;
    }).join('');
  }

  private render(): void {
    const blocksPanelHtml = (this.itBlock || this.interceptorsBlock) ? `
      <div class="blocks-panel">
        ${this.itBlock ? `
        <div class="block-section">
          <div class="block-row">
            <span class="block-label">${this.t('FILE_PREVIEW.BLOCK_IT')}</span>
            <button id="btn-copy-it" class="btn-copy-sm">${this.t('FILE_PREVIEW.COPY_BTN')}</button>
          </div>
          <pre class="block-pre">${escHtml(this.itBlock.slice(0, 2000))}</pre>
        </div>` : ''}
        ${this.interceptorsBlock ? `
        <div class="block-section">
          <div class="block-row">
            <span class="block-label">${this.t('FILE_PREVIEW.BLOCK_BEFORE_EACH')}</span>
            <button id="btn-copy-icp" class="btn-copy-sm">${this.t('FILE_PREVIEW.COPY_BTN')}</button>
          </div>
          <pre class="block-pre" style="color:#3fb950">${escHtml(this.interceptorsBlock.slice(0, 2000))}</pre>
        </div>` : ''}
      </div>` : '';

    const hasChanges = this._originalContent !== null && this._originalContent !== (this._fileContent ?? '');

    this.shadow.innerHTML = `
      <style>${STYLES}</style>
      <div class="container">
        <div class="header">
          <span class="file-name">📄 ${this.fileName ? escHtml(this.fileName) : this.t('FILE_PREVIEW.NO_FILE')}</span>
          <button id="btn-copy" title="${this.t('FILE_PREVIEW.COPY_TITLE')}">📋</button>
        </div>
        <div class="body">
          ${this._showDiff
            ? `<div class="diff-panel" id="diff-panel">${this.buildDiffHtml()}</div>`
            : `<textarea class="editor" id="editor" spellcheck="false">${escHtml(this._fileContent ?? '')}</textarea>`}
          ${blocksPanelHtml}
        </div>
        <div class="footer">
          <button id="btn-launch" class="btn-launch">${this.t('FILE_PREVIEW.LAUNCH_BTN')}</button>
          ${hasChanges ? `<button id="btn-diff" class="${this._showDiff ? 'btn-diff-active' : ''}">${this.t('FILE_PREVIEW.DIFF_BTN')}</button>` : ''}
          <button id="btn-save" class="btn-save">${this.t('FILE_PREVIEW.SAVE_BTN')}</button>
          <button id="btn-close">${escHtml(this.closeLabel || this.t('FILE_PREVIEW.CLOSE_BTN'))}</button>
        </div>
      </div>`;

    this.textarea = this.shadow.getElementById('editor') as HTMLTextAreaElement | null;
    if (this.textarea) {
      this.textarea.addEventListener('input', () => {
        this._fileContent = this.textarea!.value;
      });
    }
    this.shadow.getElementById('btn-save')!.addEventListener('click', () => this.saveFile());
    this.shadow.getElementById('btn-close')!.addEventListener('click', () => this.onClose());
    this.shadow.getElementById('btn-launch')!.addEventListener('click', () => this.launchTest());
    this.shadow.getElementById('btn-copy')!.addEventListener('click', () => {
      this.copyToClipboard(this.textarea?.value ?? this._fileContent ?? '');
    });
    this.shadow.getElementById('btn-diff')?.addEventListener('click', () => this.toggleDiff());
    this.shadow.getElementById('btn-copy-it')?.addEventListener('click', () => {
      this.copyToClipboard(this.itBlock);
    });
    this.shadow.getElementById('btn-copy-icp')?.addEventListener('click', () => {
      this.copyToClipboard(this.interceptorsBlock);
    });
  }
}

// ── Diff algorithm (LCS line-based) ──────────────────────────────────────────

type DiffEntry = { type: 'same' | 'added' | 'removed'; line: string };

function computeDiff(original: string, modified: string): DiffEntry[] {
  const MAX_LINES = 600;
  const a = original.split('\n').slice(0, MAX_LINES);
  const b = modified.split('\n').slice(0, MAX_LINES);
  const m = a.length, n = b.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Backtrack
  const result: DiffEntry[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({ type: 'same', line: a[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', line: b[j - 1] });
      j--;
    } else {
      result.unshift({ type: 'removed', line: a[i - 1] });
      i--;
    }
  }
  return result;
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

if (!customElements.get('file-preview')) {
  customElements.define('file-preview', FilePreviewElement);
}
