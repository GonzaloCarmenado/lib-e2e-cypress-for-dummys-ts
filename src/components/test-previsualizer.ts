const STYLES = `
  :host { display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #fff; }
  * { box-sizing: border-box; }
  .toolbar {
    display: flex; gap: 8px; padding: 10px 12px 6px;
    background: #181c24; border-bottom: 1px solid #2a3245;
  }
  button {
    padding: 4px 12px; border: none; border-radius: 5px; cursor: pointer;
    font-size: 11px; font-weight: 600; background: #2a3245; color: #adb5d0;
    transition: background 0.15s, color 0.15s;
  }
  button:hover { background: #1976d2; color: #fff; }
  button.active { background: #1976d2; color: #fff; }
  .section { padding: 8px 12px; }
  .section-title {
    font-size: 11px; font-weight: 700; color: #6c7a99; text-transform: uppercase;
    letter-spacing: 0.5px; margin-bottom: 6px;
  }
  .list {
    max-height: 220px; overflow-y: auto; background: #0d1117;
    border-radius: 6px; padding: 6px;
    scrollbar-width: thin; scrollbar-color: #1976d2 #1e2535;
  }
  .item {
    font-family: 'Fira Code', 'Cascadia Code', monospace; font-size: 11.5px;
    color: #c9d1d9; padding: 3px 4px; border-bottom: 1px solid #1e2535;
    word-break: break-all; line-height: 1.5;
  }
  .item:last-child { border-bottom: none; }
  .empty { color: #6c7a99; font-size: 12px; padding: 12px; text-align: center; }
`;

export class TestPrevisualizerElement extends HTMLElement {
  private shadow: ShadowRoot;
  private _commands: string[] = [];
  private _interceptors: string[] = [];
  private _showInterceptors = false;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void { this.render(); }

  get commands(): string[] { return this._commands; }
  set commands(v: string[]) { this._commands = v; this.render(); }

  get interceptors(): string[] { return this._interceptors; }
  set interceptors(v: string[]) { this._interceptors = v; this.render(); }

  get showInterceptors(): boolean { return this._showInterceptors; }

  toggleInterceptors(): void { this._showInterceptors = !this._showInterceptors; this.render(); }

  copyToClipboard(): void {
    const text = this._commands.join('\n');
    if (!text) return;
    navigator.clipboard?.writeText(text);
  }

  copyInterceptorsToClipboard(): void {
    const text = this._interceptors.join('\n');
    if (!text) return;
    navigator.clipboard?.writeText(text);
  }

  private render(): void {
    const cmdItems = this._commands.length
      ? this._commands.map((c) => `<div class="item">${escHtml(c)}</div>`).join('')
      : '<div class="empty">Sin comandos aún</div>';

    const icpSection = this._showInterceptors
      ? `<div class="section" data-section="interceptors">
          <div class="section-title">Interceptores</div>
          <div class="list">
            ${this._interceptors.length
              ? this._interceptors.map((i) => `<div class="item">${escHtml(i)}</div>`).join('')
              : '<div class="empty">Sin interceptores</div>'}
          </div>
          <button style="margin-top:6px" data-action="copy-icp">📋 Copiar interceptores</button>
        </div>`
      : '';

    this.shadow.innerHTML = `
      <style>${STYLES}</style>
      <div class="toolbar">
        <button data-action="copy">📋 Copiar comandos</button>
        <button data-action="toggle-icp" class="${this._showInterceptors ? 'active' : ''}">
          ${this._showInterceptors ? '▲ Ocultar interceptores' : '▼ Ver interceptores'} (${this._interceptors.length})
        </button>
      </div>
      <div class="section">
        <div class="section-title">Comandos (${this._commands.length})</div>
        <div class="list" data-ref="cmds">${cmdItems}</div>
      </div>
      ${icpSection}
    `;

    // Scroll to bottom
    const cmdsEl = this.shadow.querySelector<HTMLElement>('[data-ref="cmds"]');
    if (cmdsEl) cmdsEl.scrollTop = cmdsEl.scrollHeight;

    this.shadow.querySelector('[data-action="copy"]')
      ?.addEventListener('click', () => this.copyToClipboard());
    this.shadow.querySelector('[data-action="toggle-icp"]')
      ?.addEventListener('click', () => this.toggleInterceptors());
    this.shadow.querySelector('[data-action="copy-icp"]')
      ?.addEventListener('click', () => this.copyInterceptorsToClipboard());
  }
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

if (!customElements.get('test-previsualizer')) {
  customElements.define('test-previsualizer', TestPrevisualizerElement);
}
