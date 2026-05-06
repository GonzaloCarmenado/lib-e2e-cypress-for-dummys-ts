import { translationService, TranslationService } from '../services/translation.service';

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
    display: flex; align-items: flex-start; gap: 6px;
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace; font-size: 11px;
    color: #c9d1d9; padding: 4px 8px; border-radius: 4px;
    word-break: break-all; line-height: 1.65;
    border-left: 2px solid transparent;
    transition: background 0.1s, border-color 0.1s;
  }
  .item:hover { background: #161b22; border-left-color: #2f81f7; }
  .cmd-text { flex: 1; }
  .item-actions {
    display: flex; gap: 3px; flex-shrink: 0;
    opacity: 0; transition: opacity 0.15s;
  }
  .item:hover .item-actions { opacity: 1; }
  .btn-step {
    width: 20px; height: 20px; border: none; border-radius: 3px; cursor: pointer;
    font-size: 12px; background: transparent; color: #484f58;
    transition: background 0.12s, color 0.12s;
    display: flex; align-items: center; justify-content: center;
    padding: 0; line-height: 1;
  }
  .btn-step:hover { background: #30363d; color: #e6edf3; }
  .btn-step-del:hover { background: rgba(248,81,73,0.15); color: #f85149; }
  .empty { color: #484f58; font-size: 12px; padding: 20px 8px; text-align: center; }
`

export class TestPrevisualizerElement extends HTMLElement {
  private shadow: ShadowRoot
  private _commands: string[] = []
  private _interceptors: string[] = []
  private _showInterceptors = false
  editable = false
  translation: TranslationService = translationService

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

  private t(key: string): string { return this.translation.translate(key) }

  private dispatchDelete(index: number): void {
    this.dispatchEvent(new CustomEvent('deletecommand', { detail: index, bubbles: true, composed: true }))
  }

  private dispatchMove(from: number, to: number): void {
    this.dispatchEvent(new CustomEvent('movecommand', { detail: { from, to }, bubbles: true, composed: true }))
  }

  private dispatchDeleteInterceptor(index: number): void {
    this.dispatchEvent(new CustomEvent('deleteinterceptor', { detail: index, bubbles: true, composed: true }))
  }

  private render(): void {
    const editControls = (idx: number, total: number) => this.editable ? `
      <span class="item-actions">
        <button class="btn-step" data-move-up="${idx}" title="${this.t('TEST_PREVISUALIZER.UP_TITLE')}" ${idx === 0 ? 'disabled style="opacity:.3"' : ''}>↑</button>
        <button class="btn-step" data-move-dn="${idx}" title="${this.t('TEST_PREVISUALIZER.DOWN_TITLE')}" ${idx === total - 1 ? 'disabled style="opacity:.3"' : ''}>↓</button>
        <button class="btn-step btn-step-del" data-del="${idx}" title="${this.t('TEST_PREVISUALIZER.DEL_TITLE')}">✕</button>
      </span>` : ''

    const cmdItems = this._commands.length
      ? this._commands.map((c, i) => `
          <div class="item">
            <span class="cmd-text">${escHtml(c)}</span>
            ${editControls(i, this._commands.length)}
          </div>`).join("")
      : `<div class="empty">${this.t('TEST_PREVISUALIZER.NO_CMDS_YET')}</div>`

    const icpEditControls = (idx: number) => this.editable
      ? `<span class="item-actions"><button class="btn-step btn-step-del" data-del-icp="${idx}" title="${this.t('TEST_PREVISUALIZER.DEL_TITLE')}">✕</button></span>`
      : ''

    const icpSection = this._showInterceptors
      ? `<div class="section" data-section="interceptors">
          <div class="section-title">${this.t('TEST_PREVISUALIZER.INTERCEPTORS')}</div>
          <div class="list">
            ${
              this._interceptors.length
                ? this._interceptors.map((i, idx) => `
                    <div class="item">
                      <span class="cmd-text">${escHtml(i)}</span>
                      ${icpEditControls(idx)}
                    </div>`).join("")
                : `<div class="empty">${this.t('TEST_PREVISUALIZER.NO_ICP_SHORT')}</div>`
            }
          </div>
          <button style="margin-top:6px" data-action="copy-icp">${this.t('TEST_PREVISUALIZER.COPY_ICP_BTN')}</button>
        </div>`
      : ""

    this.shadow.innerHTML = `
      <style>${STYLES}</style>
      <div class="toolbar">
        <button data-action="copy">${this.t('TEST_PREVISUALIZER.COPY_CMDS_BTN')}</button>
        <button data-action="toggle-icp" class="${this._showInterceptors ? "active" : ""}">
          ${this._showInterceptors ? this.t('TEST_PREVISUALIZER.HIDE_INTERCEPTORS') : this.t('TEST_PREVISUALIZER.SHOW_INTERCEPTORS')} (${this._interceptors.length})
        </button>
      </div>
      <div class="section">
        <div class="section-title">${this.t('TEST_PREVISUALIZER.SECTION_COMMANDS')} (${this._commands.length})</div>
        <div class="list" data-ref="cmds">${cmdItems}</div>
      </div>
      ${icpSection}
    `

    const cmdsEl = this.shadow.querySelector<HTMLElement>('[data-ref="cmds"]')
    if (cmdsEl) cmdsEl.scrollTop = cmdsEl.scrollHeight

    this.shadow.querySelector('[data-action="copy"]')?.addEventListener("click", () => this.copyToClipboard())
    this.shadow.querySelector('[data-action="toggle-icp"]')?.addEventListener("click", () => this.toggleInterceptors())
    this.shadow.querySelector('[data-action="copy-icp"]')?.addEventListener("click", () => this.copyInterceptorsToClipboard())

    if (this.editable) {
      this.shadow.querySelectorAll('[data-del]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation()
          this.dispatchDelete(Number((btn as HTMLElement).dataset['del']))
        })
      })
      this.shadow.querySelectorAll('[data-move-up]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation()
          const idx = Number((btn as HTMLElement).dataset['moveUp'])
          this.dispatchMove(idx, idx - 1)
        })
      })
      this.shadow.querySelectorAll('[data-move-dn]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation()
          const idx = Number((btn as HTMLElement).dataset['moveDn'])
          this.dispatchMove(idx, idx + 1)
        })
      })
      this.shadow.querySelectorAll('[data-del-icp]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation()
          this.dispatchDeleteInterceptor(Number((btn as HTMLElement).dataset['delIcp']))
        })
      })
    }
  }
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

if (!customElements.get("test-previsualizer")) {
  customElements.define("test-previsualizer", TestPrevisualizerElement)
}
