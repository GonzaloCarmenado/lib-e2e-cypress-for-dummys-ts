import { translationService, type TranslationService } from '../../services/translation.service';
import { isValidTicketId } from '../../utils/ticket.utils';
import type { IssueTrackerConfig } from '../../models/issue-tracker.model';
import { DEFAULT_ISSUE_TRACKER_CONFIG } from '../../models/issue-tracker.model';
import { SAVE_TEST_STYLES } from './save-test.styles';
import { renderSaveTestAsk, renderSaveTestDesc, renderSaveTestConfirmDiscard } from './save-test.template';

export class SaveTestElement extends HTMLElement {
  private shadow: ShadowRoot;
  private _step: 'ask' | 'desc' | 'confirm-discard' = 'ask';
  private _stepBeforeDiscard: 'ask' | 'desc' = 'ask';
  description = '';
  notes = '';
  tags: string[] = [];
  ticketId = '';
  issueTrackerConfig: IssueTrackerConfig = DEFAULT_ISSUE_TRACKER_CONFIG;
  translation: TranslationService = translationService;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void { this.render(); }

  get step(): 'ask' | 'desc' | 'confirm-discard' { return this._step; }

  askSave(): void { this._step = 'desc'; this.render(); }

  confirmSave(): void { this.dispatch('savetest', { description: this.description.trim(), notes: this.notes, tags: [...this.tags], ticketId: this.ticketId.trim() }); }

  confirmSaveAndExport(): void { this.dispatch('saveandexport', { description: this.description.trim(), notes: this.notes, tags: [...this.tags], ticketId: this.ticketId.trim() }); }

  cancel(): void {
    this._stepBeforeDiscard = this._step === 'confirm-discard' ? 'ask' : (this._step as 'ask' | 'desc');
    this._step = 'confirm-discard';
    this.render();
  }

  confirmDiscard(): void { this.dispatch('savetest', { description: null, notes: '', tags: [], ticketId: '' }); }

  backFromDiscard(): void { this._step = this._stepBeforeDiscard; this.render(); }

  restartComponent(): void { this._step = 'ask'; this.description = ''; this.notes = ''; this.tags = []; this.ticketId = ''; this.render(); }

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

  get ticketIdWarning(): boolean {
    if (!this.ticketId.trim() || !this.issueTrackerConfig.enabled) return false;
    return !isValidTicketId(this.ticketId, this.issueTrackerConfig.provider);
  }

  private dispatch(type: string, detail: { description: string | null; notes: string; tags: string[]; ticketId: string }): void {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  private render(): void {
    if (this._step === 'confirm-discard') {
      this.shadow.innerHTML = `<style>${SAVE_TEST_STYLES}</style>${renderSaveTestConfirmDiscard(this.t.bind(this))}`;
      this.shadow.getElementById('btn-confirm-discard')?.addEventListener('click', () => this.confirmDiscard());
      this.shadow.getElementById('btn-back-discard')?.addEventListener('click', () => this.backFromDiscard());
      return;
    }
    if (this._step === 'ask') {
      this.shadow.innerHTML = `<style>${SAVE_TEST_STYLES}</style>${renderSaveTestAsk(this.t.bind(this))}`;
      this.shadow.getElementById('btn-yes')?.addEventListener('click', () => this.askSave());
      this.shadow.getElementById('btn-no')?.addEventListener('click', () => this.cancel());
    } else {
      this.shadow.innerHTML = `<style>${SAVE_TEST_STYLES}</style>${renderSaveTestDesc(this.description, this.notes, this.tags, this.ticketId, this.issueTrackerConfig.enabled, this.ticketIdWarning, this.t.bind(this))}`;

      const descInput   = this.shadow.getElementById('desc-input')   as HTMLInputElement;
      const notesInput  = this.shadow.getElementById('notes-input')  as HTMLTextAreaElement;
      const tagInput    = this.shadow.getElementById('tag-input')    as HTMLInputElement;
      const ticketInput = this.shadow.getElementById('ticket-input') as HTMLInputElement | null;

      descInput.addEventListener('input', () => { this.description = descInput.value; });
      notesInput.addEventListener('input', () => { this.notes = notesInput.value; });
      ticketInput?.addEventListener('input', () => { this.ticketId = ticketInput.value; this.render(); });

      const tryAddTag = () => {
        this.addTag(tagInput.value);
        tagInput.value = '';
      };
      this.shadow.getElementById('btn-add-tag')?.addEventListener('click', tryAddTag);
      tagInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); tryAddTag(); }
      });

      this.shadow.querySelectorAll<HTMLButtonElement>('.chip-del').forEach((btn) => {
        btn.addEventListener('click', () => this.removeTag(btn.dataset['tag'] ?? ''));
      });

      this.shadow.getElementById('btn-confirm')?.addEventListener('click', () => this.confirmSave());
      this.shadow.getElementById('btn-export')?.addEventListener('click', () => this.confirmSaveAndExport());
      this.shadow.getElementById('btn-cancel')?.addEventListener('click', () => this.cancel());
      setTimeout(() => descInput.focus(), 60);
    }
  }
}

if (!customElements.get('lib-e2e-save-test')) {
  customElements.define('lib-e2e-save-test', SaveTestElement);
}
