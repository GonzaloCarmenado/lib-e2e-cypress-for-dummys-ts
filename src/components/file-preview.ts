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
`;

export class FilePreviewElement extends HTMLElement {
  private shadow: ShadowRoot;
  private textarea: HTMLTextAreaElement | null = null;

  fileName: string | null = null;
  closeLabel = '✕ Cerrar';
  itBlock = '';
  interceptorsBlock = '';
  private _fileContent: string | null = null;
  commands: string[] = [];
  interceptors: string[] = [];

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void { this.render(); }

  get fileContent(): string | null { return this._fileContent; }
  set fileContent(v: string | null) {
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

  private render(): void {
    const blocksPanelHtml = (this.itBlock || this.interceptorsBlock) ? `
      <div class="blocks-panel">
        ${this.itBlock ? `
        <div class="block-section">
          <div class="block-row">
            <span class="block-label">🧪 it()</span>
            <button id="btn-copy-it" class="btn-copy-sm">📋 Copiar</button>
          </div>
          <pre class="block-pre">${escHtml(this.itBlock.slice(0, 2000))}</pre>
        </div>` : ''}
        ${this.interceptorsBlock ? `
        <div class="block-section">
          <div class="block-row">
            <span class="block-label">🔀 beforeEach()</span>
            <button id="btn-copy-icp" class="btn-copy-sm">📋 Copiar</button>
          </div>
          <pre class="block-pre" style="color:#3fb950">${escHtml(this.interceptorsBlock.slice(0, 2000))}</pre>
        </div>` : ''}
      </div>` : '';

    this.shadow.innerHTML = `
      <style>${STYLES}</style>
      <div class="container">
        <div class="header">
          <span class="file-name">📄 ${this.fileName ? escHtml(this.fileName) : 'Sin archivo'}</span>
          <button id="btn-copy" title="Copiar contenido del editor">📋</button>
        </div>
        <div class="body">
          <textarea class="editor" id="editor" spellcheck="false">${escHtml(this._fileContent ?? '')}</textarea>
          ${blocksPanelHtml}
        </div>
        <div class="footer">
          <button id="btn-launch" class="btn-launch">▶ Lanzar test</button>
          <button id="btn-save" class="btn-save">💾 Guardar</button>
          <button id="btn-close">${escHtml(this.closeLabel)}</button>
        </div>
      </div>`;

    this.textarea = this.shadow.getElementById('editor') as HTMLTextAreaElement;
    this.shadow.getElementById('btn-save')!.addEventListener('click', () => this.saveFile());
    this.shadow.getElementById('btn-close')!.addEventListener('click', () => this.onClose());
    this.shadow.getElementById('btn-launch')!.addEventListener('click', () => this.launchTest());
    this.shadow.getElementById('btn-copy')!.addEventListener('click', () => {
      this.copyToClipboard(this.textarea?.value ?? '');
    });
    this.shadow.getElementById('btn-copy-it')?.addEventListener('click', () => {
      this.copyToClipboard(this.itBlock);
    });
    this.shadow.getElementById('btn-copy-icp')?.addEventListener('click', () => {
      this.copyToClipboard(this.interceptorsBlock);
    });
  }
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

if (!customElements.get('file-preview')) {
  customElements.define('file-preview', FilePreviewElement);
}
