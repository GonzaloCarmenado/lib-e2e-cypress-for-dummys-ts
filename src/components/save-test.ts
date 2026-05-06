import { translationService, TranslationService } from '../services/translation.service';

const STYLES = `
  :host { display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e6edf3; }
  * { box-sizing: border-box; }
  .container { padding: 24px 28px; text-align: center; }
  p { margin: 0 0 20px; font-size: 14px; color: #8b949e; line-height: 1.5; }
  .btn-row { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 16px; }
  button {
    padding: 7px 16px; border: 1px solid #30363d; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-weight: 500; transition: filter 0.15s, transform 0.1s;
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
  .tag-label {
    font-size: 11px; color: #484f58; text-align: left; margin-bottom: 5px; display: block;
  }
  .tag-input-row { display: flex; gap: 6px; margin-bottom: 8px; }
  .tag-input-row input[type="text"] {
    font-size: 12px; padding: 6px 10px; margin: 0;
  }
  .btn-tag-add {
    padding: 6px 12px; font-size: 12px; background: #21262d; color: #8b949e;
    border: 1px solid #30363d; border-radius: 6px; cursor: pointer;
    transition: background 0.15s, color 0.12s; white-space: nowrap; flex-shrink: 0;
  }
  .btn-tag-add:hover { background: #30363d; color: #e6edf3; filter: none; }
  .chips { display: flex; flex-wrap: wrap; gap: 5px; min-height: 24px; text-align: left; }
  .chip {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(47,129,247,0.15); color: #2f81f7;
    border: 1px solid rgba(47,129,247,0.3); border-radius: 20px;
    padding: 2px 10px 2px 10px; font-size: 11px; font-weight: 500;
  }
  .chip-del {
    cursor: pointer; color: #8b949e; font-size: 12px; line-height: 1;
    transition: color 0.12s; padding: 0; background: none; border: none;
  }
  .chip-del:hover { color: #f85149; filter: none; }
`;

export class SaveTestElement extends HTMLElement {
  private shadow: ShadowRoot;
  private _step: 'ask' | 'desc' = 'ask';
  description = '';
  tags: string[] = [];
  translation: TranslationService = translationService;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void { this.render(); }

  get step(): 'ask' | 'desc' { return this._step; }

  askSave(): void { this._step = 'desc'; this.render(); }

  confirmSave(): void { this.dispatch('savetest', { description: this.description.trim(), tags: [...this.tags] }); }

  confirmSaveAndExport(): void { this.dispatch('saveandexport', { description: this.description.trim(), tags: [...this.tags] }); }

  cancel(): void { this.dispatch('savetest', { description: null, tags: [] }); }

  restartComponent(): void { this._step = 'ask'; this.description = ''; this.tags = []; this.render(); }

  addTag(tag: string): void {
    const t = tag.trim().replace(/[,;]/g, '');
    if (t && !this.tags.includes(t)) {
      this.tags = [...this.tags, t];
      this.render();
    }
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter((t) => t !== tag);
    this.render();
  }

  private t(key: string): string { return this.translation.translate(key); }

  private dispatch(type: string, detail: { description: string | null; tags: string[] }): void {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  private render(): void {
    if (this._step === 'ask') {
      this.shadow.innerHTML = `
        <style>${STYLES}</style>
        <div class="container">
          <p>${this.t('SAVE_TEST.ASK')}</p>
          <div class="btn-row">
            <button class="btn-primary" id="btn-yes">${this.t('SAVE_TEST.YES_CONTINUE')}</button>
            <button class="btn-danger"  id="btn-no">${this.t('SAVE_TEST.NO_DISCARD')}</button>
          </div>
        </div>`;
      this.shadow.getElementById('btn-yes')!.addEventListener('click', () => this.askSave());
      this.shadow.getElementById('btn-no')!.addEventListener('click', () => this.cancel());
    } else {
      const chipsHtml = this.tags.map((t) =>
        `<span class="chip">${escHtml(t)}<button class="chip-del" data-tag="${escAttr(t)}" title="${this.t('SAVE_TEST.REMOVE_TAG_TITLE')}">✕</button></span>`
      ).join('');

      this.shadow.innerHTML = `
        <style>${STYLES}</style>
        <div class="container">
          <p>${this.t('SAVE_TEST.DESC_LABEL')} (<code>it()</code>):</p>
          <input id="desc-input" type="text" placeholder="${this.t('SAVE_TEST.DESC_PLACEHOLDER')}"
                 value="${escAttr(this.description)}" autocomplete="off" />
          <span class="tag-label">${this.t('SAVE_TEST.TAGS_LABEL')}</span>
          <div class="tag-input-row">
            <input id="tag-input" type="text" placeholder="${this.t('SAVE_TEST.TAGS_PLACEHOLDER')}" autocomplete="off" />
            <button class="btn-tag-add" id="btn-add-tag">${this.t('SAVE_TEST.ADD_TAG')}</button>
          </div>
          <div class="chips" id="chips-container">${chipsHtml || `<span style="color:#484f58;font-size:11px">${this.t('SAVE_TEST.NO_TAGS')}</span>`}</div>
          <div class="btn-row">
            <button class="btn-primary" id="btn-confirm">${this.t('SAVE_TEST.SAVE_BTN')}</button>
            <button class="btn-success" id="btn-export">${this.t('SAVE_TEST.SAVE_AND_EDIT')}</button>
            <button class="btn-danger"  id="btn-cancel">${this.t('SAVE_TEST.CANCEL')}</button>
          </div>
        </div>`;

      const descInput = this.shadow.getElementById('desc-input') as HTMLInputElement;
      const tagInput  = this.shadow.getElementById('tag-input')  as HTMLInputElement;

      descInput.addEventListener('input', () => { this.description = descInput.value; });

      const tryAddTag = () => {
        this.addTag(tagInput.value);
        tagInput.value = '';
      };
      this.shadow.getElementById('btn-add-tag')!.addEventListener('click', tryAddTag);
      tagInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); tryAddTag(); }
      });

      this.shadow.querySelectorAll<HTMLButtonElement>('.chip-del').forEach((btn) => {
        btn.addEventListener('click', () => this.removeTag(btn.dataset['tag'] ?? ''));
      });

      this.shadow.getElementById('btn-confirm')!.addEventListener('click', () => this.confirmSave());
      this.shadow.getElementById('btn-export')!.addEventListener('click', () => this.confirmSaveAndExport());
      this.shadow.getElementById('btn-cancel')!.addEventListener('click', () => this.cancel());
      setTimeout(() => descInput.focus(), 60);
    }
  }
}

function escAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

if (!customElements.get('save-test')) {
  customElements.define('save-test', SaveTestElement);
}
