const STYLES = `
  :host { display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #fff; }
  * { box-sizing: border-box; }
  .container { padding: 20px 24px; text-align: center; }
  p { margin: 0 0 18px; font-size: 14px; color: #c9d1d9; }
  .btn-row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 12px; }
  button {
    padding: 9px 22px; border: none; border-radius: 7px; cursor: pointer;
    font-size: 13px; font-weight: 600; transition: opacity 0.15s;
  }
  button:hover { opacity: 0.88; }
  .btn-primary { background: #1976d2; color: #fff; }
  .btn-success { background: #388e3c; color: #fff; }
  .btn-danger  { background: #d32f2f; color: #fff; }
  input[type="text"] {
    width: 100%; padding: 10px 14px; border: 1px solid #2a3245;
    border-radius: 7px; background: #0d1117; color: #fff;
    font-size: 14px; outline: none; margin-bottom: 4px;
    transition: border-color 0.15s;
  }
  input[type="text"]:focus { border-color: #1976d2; }
  input[type="text"]::placeholder { color: #6c7a99; }
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
