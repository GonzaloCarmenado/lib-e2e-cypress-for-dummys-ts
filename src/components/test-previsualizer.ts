const STYLES = `
  :host { display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e6edf3; }
  * { box-sizing: border-box; }
  .toolbar {
    display: flex; gap: 6px; padding: 10px 12px;
    background: #161b22; border-bottom: 1px solid #21262d;
  }
  button {
    padding: 5px 12px; border: none; border-radius: 6px; cursor: pointer;
    font-size: 11px; font-weight: 500; background: #21262d; color: #8b949e;
    transition: background 0.15s, color 0.12s; letter-spacing: 0.1px;
  }
  button:hover { background: #30363d; color: #e6edf3; }
  button.active { background: #2f81f7; color: #fff; }
  .section { padding: 10px 12px; }
  .section-title {
    font-size: 10px; font-weight: 600; color: #484f58; text-transform: uppercase;
    letter-spacing: 0.8px; margin-bottom: 7px;
  }
  .list {
    max-height: 220px; overflow-y: auto; background: #0d1117;
    border-radius: 8px; padding: 6px 8px;
    border: 1px solid #21262d;
    scrollbar-width: thin; scrollbar-color: #30363d transparent;
  }
  .list::-webkit-scrollbar { width: 4px; }
  .list::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; }
  .item {
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace; font-size: 11px;
    color: #c9d1d9; padding: 4px 8px; border-radius: 4px;
    word-break: break-all; line-height: 1.65;
    border-left: 2px solid transparent;
    transition: background 0.1s, border-color 0.1s;
  }
  .item:hover { background: #161b22; border-left-color: #2f81f7; }
  .empty { color: #484f58; font-size: 12px; padding: 20px 8px; text-align: center; }
`

export class TestPrevisualizerElement extends HTMLElement {
  private shadow: ShadowRoot
  private _commands: string[] = []
  private _interceptors: string[] = []
  private _showInterceptors = false

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: "open" })
  }

  connectedCallback(): void {
    this.render()
  }

  get commands(): string[] {
    return this._commands
  }
  set commands(v: string[]) {
    this._commands = v
    this.render()
  }

  get interceptors(): string[] {
    return this._interceptors
  }
  set interceptors(v: string[]) {
    this._interceptors = v
    this.render()
  }

  get showInterceptors(): boolean {
    return this._showInterceptors
  }

  toggleInterceptors(): void {
    this._showInterceptors = !this._showInterceptors
    this.render()
  }

  copyToClipboard(): void {
    const text = this._commands.join("\n")
    if (!text) return
    navigator.clipboard?.writeText(text)
  }

  copyInterceptorsToClipboard(): void {
    const text = this._interceptors.join("\n")
    if (!text) return
    navigator.clipboard?.writeText(text)
  }

  private render(): void {
    const cmdItems = this._commands.length
      ? this._commands.map((c) => `<div class="item">${escHtml(c)}</div>`).join("")
      : '<div class="empty">Sin comandos aún</div>'

    const icpSection = this._showInterceptors
      ? `<div class="section" data-section="interceptors">
          <div class="section-title">Interceptores</div>
          <div class="list">
            ${
              this._interceptors.length
                ? this._interceptors.map((i) => `<div class="item">${escHtml(i)}</div>`).join("")
                : '<div class="empty">Sin interceptores</div>'
            }
          </div>
          <button style="margin-top:6px" data-action="copy-icp">📋 Copiar interceptores</button>
        </div>`
      : ""

    this.shadow.innerHTML = `
      <style>${STYLES}</style>
      <div class="toolbar">
        <button data-action="copy">📋 Copiar comandos</button>
        <button data-action="toggle-icp" class="${this._showInterceptors ? "active" : ""}">
          ${this._showInterceptors ? "▲ Ocultar interceptores" : "▼ Ver interceptores"} (${this._interceptors.length})
        </button>
      </div>
      <div class="section">
        <div class="section-title">Comandos (${this._commands.length})</div>
        <div class="list" data-ref="cmds">${cmdItems}</div>
      </div>
      ${icpSection}
    `

    // Scroll to bottom
    const cmdsEl = this.shadow.querySelector<HTMLElement>('[data-ref="cmds"]')
    if (cmdsEl) cmdsEl.scrollTop = cmdsEl.scrollHeight

    this.shadow.querySelector('[data-action="copy"]')?.addEventListener("click", () => this.copyToClipboard())
    this.shadow.querySelector('[data-action="toggle-icp"]')?.addEventListener("click", () => this.toggleInterceptors())
    this.shadow
      .querySelector('[data-action="copy-icp"]')
      ?.addEventListener("click", () => this.copyInterceptorsToClipboard())
  }
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

if (!customElements.get("test-previsualizer")) {
  customElements.define("test-previsualizer", TestPrevisualizerElement)
}
