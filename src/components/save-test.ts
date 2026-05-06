const STYLES = `
  :host { display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e6edf3; }
  * { box-sizing: border-box; }
  .container { padding: 24px 28px; text-align: center; }
  p { margin: 0 0 20px; font-size: 14px; color: #8b949e; line-height: 1.5; }
  .btn-row { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 16px; }
  button {
    padding: 8px 20px; border: none; border-radius: 8px; cursor: pointer;
    font-size: 13px; font-weight: 500; transition: filter 0.15s, transform 0.1s;
    letter-spacing: 0.1px;
  }
  button:hover { filter: brightness(1.1); }
  button:active { transform: scale(0.97); }
  .btn-primary { background: #2f81f7; color: #fff; }
  .btn-success { background: #3fb950; color: #fff; }
  .btn-danger  { background: transparent; color: #f85149; border: 1px solid rgba(248,81,73,0.5); }
  .btn-danger:hover { background: rgba(248,81,73,0.08); filter: none; }
  input[type="text"] {
    width: 100%; padding: 10px 14px; border: 1px solid #30363d;
    border-radius: 8px; background: #0d1117; color: #e6edf3;
    font-size: 14px; outline: none; margin-bottom: 4px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  input[type="text"]:focus { border-color: #2f81f7; box-shadow: 0 0 0 3px rgba(47,129,247,0.15); }
  input[type="text"]::placeholder { color: #484f58; }
`;

export class SaveTestElement extends HTMLElement {
  private shadow: ShadowRoot;
  private _step: 'ask' | 'desc' = 'ask';
  description = '';

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void { this.render(); }

  get step(): 'ask' | 'desc' { return this._step; }

  askSave(): void { this._step = 'desc'; this.render(); }

  confirmSave(): void { this.dispatch('savetest', this.description.trim()); }

  confirmSaveAndExport(): void { this.dispatch('saveandexport', this.description.trim()); }

  cancel(): void { this.dispatch('savetest', null); }

  restartComponent(): void { this._step = 'ask'; this.description = ''; this.render(); }

  private dispatch(type: string, detail: string | null): void {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  private render(): void {
    if (this._step === 'ask') {
      this.shadow.innerHTML = `
        <style>${STYLES}</style>
        <div class="container">
          <p>¿Guardar el test grabado?</p>
          <div class="btn-row">
            <button class="btn-primary" id="btn-yes">Sí, continuar</button>
            <button class="btn-danger"  id="btn-no">No, descartar</button>
          </div>
        </div>`;
      this.shadow.getElementById('btn-yes')!.addEventListener('click', () => this.askSave());
      this.shadow.getElementById('btn-no')!.addEventListener('click', () => this.cancel());
    } else {
      this.shadow.innerHTML = `
        <style>${STYLES}</style>
        <div class="container">
          <p>Describe el test (se usará como nombre del <code>it()</code>):</p>
          <input id="desc-input" type="text" placeholder="Ej: Login correcto con credenciales válidas"
                 value="${escAttr(this.description)}" autocomplete="off" />
          <div class="btn-row">
            <button class="btn-primary" id="btn-confirm">💾 Guardar</button>
            <button class="btn-success" id="btn-export">📝 Guardar y editar</button>
            <button class="btn-danger"  id="btn-cancel">Cancelar</button>
          </div>
        </div>`;
      const input = this.shadow.getElementById('desc-input') as HTMLInputElement;
      input.addEventListener('input', () => { this.description = input.value; });
      this.shadow.getElementById('btn-confirm')!.addEventListener('click', () => this.confirmSave());
      this.shadow.getElementById('btn-export')!.addEventListener('click', () => this.confirmSaveAndExport());
      this.shadow.getElementById('btn-cancel')!.addEventListener('click', () => this.cancel());
      setTimeout(() => input.focus(), 60);
    }
  }
}

function escAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

if (!customElements.get('save-test')) {
  customElements.define('save-test', SaveTestElement);
}
