import { translationService, type TranslationService } from '../../services/translation.service';
import { advancedTestTransformationService } from '../../services/advanced-test.transformation.service';
import { showToast } from '../../utils/toast.utils';
import { FILE_PREVIEW_STYLES } from './file-preview.styles';
import { renderFilePreview } from './file-preview.template';

export class FilePreviewElement extends HTMLElement {
  private shadow: ShadowRoot;
  private textarea: HTMLTextAreaElement | null = null;

  fileName: string | null = null;
  closeLabel = '';
  translation: TranslationService = translationService;
  itBlock = '';
  interceptorsBlock = '';
  notes = '';
  commands: string[] = [];
  interceptors: string[] = [];
  private _fileContent: string | null = null;
  private _originalContent: string | null = null;
  private _showDiff = false;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    if (!this.closeLabel) this.closeLabel = this.translation.translate('FILE_PREVIEW.CLOSE_BTN');
    this.render();
  }

  private t(key: string): string { return this.translation.translate(key); }

  get fileContent(): string | null { return this._fileContent; }
  set fileContent(v: string | null) {
    if (this._originalContent === null) this._originalContent = v;
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

  toggleDiff(): void {
    this._showDiff = !this._showDiff;
    this.render();
  }

  /**
   * Merges the it() and beforeEach() blocks into the current editor content
   * using the same logic as the automatic "Insert into file" action, so the
   * user does not have to copy/paste manually. Leaves the content untouched
   * (and warns) when the file has no valid describe() block to insert into.
   */
  insertBlocks(): void {
    const base = this.textarea?.value ?? this._fileContent ?? '';
    let content = base;
    if (this.interceptorsBlock) {
      const merged = advancedTestTransformationService.insertBeforeEach(content, this.interceptorsBlock);
      if (merged) content = merged;
    }
    if (this.itBlock) {
      const comment = this.notes ? advancedTestTransformationService.buildBlockComment(this.notes) + '\n' : '';
      const merged = advancedTestTransformationService.insertItBlock(content, comment + this.itBlock);
      if (merged) content = merged;
    }
    if (content === base) {
      showToast(this.t('FILE_PREVIEW.INSERT_ERROR'), false);
      return;
    }
    this._fileContent = content;
    this.render();
    showToast(this.t('FILE_PREVIEW.INSERT_DONE'));
  }

  private render(): void {
    this.shadow.innerHTML = `<style>${FILE_PREVIEW_STYLES}</style>${renderFilePreview({
      fileName: this.fileName,
      showDiff: this._showDiff,
      fileContent: this._fileContent,
      originalContent: this._originalContent,
      currentContent: this.textarea?.value ?? this._fileContent ?? '',
      itBlock: this.itBlock,
      interceptorsBlock: this.interceptorsBlock,
      closeLabel: this.closeLabel,
    }, this.t.bind(this))}`;

    this.textarea = this.shadow.getElementById('editor') as HTMLTextAreaElement | null;
    if (this.textarea) {
      const ta = this.textarea;
      this.textarea.addEventListener('input', () => {
        this._fileContent = ta.value;
      });
    }
    this.shadow.getElementById('btn-save')?.addEventListener('click', () => this.saveFile());
    this.shadow.getElementById('btn-close')?.addEventListener('click', () => this.onClose());
    this.shadow.getElementById('btn-launch')?.addEventListener('click', () => this.launchTest());
    this.shadow.getElementById('btn-copy')?.addEventListener('click', () => {
      this.copyToClipboard(this.textarea?.value ?? this._fileContent ?? '');
    });
    this.shadow.getElementById('btn-diff')?.addEventListener('click', () => this.toggleDiff());
    this.shadow.getElementById('btn-insert')?.addEventListener('click', () => this.insertBlocks());
    this.shadow.getElementById('btn-copy-it')?.addEventListener('click', () => {
      this.copyToClipboard(this.itBlock);
    });
    this.shadow.getElementById('btn-copy-icp')?.addEventListener('click', () => {
      this.copyToClipboard(this.interceptorsBlock);
    });
  }
}

if (!customElements.get('file-preview')) {
  customElements.define('file-preview', FilePreviewElement);
}
