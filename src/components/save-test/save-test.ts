import { translationService, type TranslationService } from '../../services/translation.service';
import { SAVE_TEST_STYLES } from './save-test.styles';
import { renderSaveTestAsk, renderSaveTestDesc } from './save-test.template';

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
      this.shadow.innerHTML = `<style>${SAVE_TEST_STYLES}</style>${renderSaveTestAsk(this.t.bind(this))}`;
      this.shadow.getElementById('btn-yes')!.addEventListener('click', () => this.askSave());
      this.shadow.getElementById('btn-no')!.addEventListener('click', () => this.cancel());
    } else {
      this.shadow.innerHTML = `<style>${SAVE_TEST_STYLES}</style>${renderSaveTestDesc(this.description, this.tags, this.t.bind(this))}`;

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

if (!customElements.get('save-test')) {
  customElements.define('save-test', SaveTestElement);
}
