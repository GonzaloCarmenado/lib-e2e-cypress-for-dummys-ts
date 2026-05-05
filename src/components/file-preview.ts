const STYLES = `
  :host { display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #fff; }
  * { box-sizing: border-box; }
  .container { display: flex; flex-direction: column; height: 100%; }
  .header {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px; border-bottom: 1px solid #2a3245;
    background: #1e2535;
  }
  .file-name { flex: 1; font-size: 12px; color: #c9d1d9; font-family: monospace; }
  .editor {
    flex: 1; width: 100%; min-height: 320px; padding: 12px;
    background: #0d1117; color: #c9d1d9; border: none; outline: none;
    font-family: 'Fira Code', 'Cascadia Code', monospace; font-size: 12px;
    line-height: 1.6; resize: vertical;
    scrollbar-width: thin; scrollbar-color: #1976d2 #1e2535;
  }
  .footer {
    display: flex; gap: 8px; padding: 8px 12px;
    border-top: 1px solid #2a3245; justify-content: flex-end;
  }
  button {
    padding: 6px 14px; border: none; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-weight: 600; background: #2a3245; color: #adb5d0;
    transition: background 0.15s;
  }
  button:hover { background: #1976d2; color: #fff; }
  .btn-save:hover { background: #388e3c; }
  .btn-launch:hover { background: #f57c00; }
`;

export class FilePreviewElement extends HTMLElement {
  private shadow: ShadowRoot;
  private textarea: HTMLTextAreaElement | null = null;

  fileName: string | null = null;
  private _fileContent: string | null = null;
  commands: string[] = [];
  interceptors: string[] = [];
  itBlock = '';

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
    this.shadow.innerHTML = `
      <style>${STYLES}</style>
      <div class="container">
        <div class="header">
          <span class="file-name">📄 ${this.fileName ? escHtml(this.fileName) : 'Sin archivo'}</span>
          <button id="btn-copy" title="Copiar contenido">📋</button>
        </div>
        <textarea class="editor" id="editor" spellcheck="false">${escHtml(this._fileContent ?? '')}</textarea>
        <div class="footer">
          <button id="btn-launch" class="btn-launch">▶ Lanzar test</button>
          <button id="btn-save" class="btn-save">💾 Guardar</button>
          <button id="btn-close">✕ Cerrar</button>
        </div>
      </div>`;

    this.textarea = this.shadow.getElementById('editor') as HTMLTextAreaElement;
    this.shadow.getElementById('btn-save')!.addEventListener('click', () => this.saveFile());
    this.shadow.getElementById('btn-close')!.addEventListener('click', () => this.onClose());
    this.shadow.getElementById('btn-launch')!.addEventListener('click', () => this.launchTest());
    this.shadow.getElementById('btn-copy')!.addEventListener('click', () => {
      this.copyToClipboard(this.textarea?.value ?? '');
    });
  }
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

if (!customElements.get('file-preview')) {
  customElements.define('file-preview', FilePreviewElement);
}
