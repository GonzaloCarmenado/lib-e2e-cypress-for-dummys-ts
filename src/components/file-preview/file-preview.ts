import { advancedTestTransformationService } from '../../services/advanced-test.transformation.service';
import { showToast } from '../../utils/toast.utils';
import { isLocalHost } from '../../utils/host.utils';
import { FILE_PREVIEW_STYLES } from './file-preview.styles';
import { renderFilePreview, type RunState } from './file-preview.template';
import { BaseElement } from '../base.element';

/**
 * `<lib-e2e-file-preview>` custom element — displays a Cypress spec file's
 * content with an inline editor, a diff view, and an optional "Run test"
 * button that calls a local Cypress runner endpoint.
 */
export class FilePreviewElement extends BaseElement {
  private textarea: HTMLTextAreaElement | null = null;

  fileName: string | null = null;
  closeLabel = '';
  itBlock = '';
  interceptorsBlock = '';
  notes = '';
  commands: string[] = [];
  interceptors: string[] = [];
  /** Endpoint of the local Cypress runner. Configurable; defaults to the bundled runner's port. */
  runnerUrl = 'http://localhost:8123/run-test';
  /** Whether the app is served locally — gates the launch button. Overridable for tests. */
  isLocal = isLocalHost(window.location.hostname);
  private _fileContent: string | null = null;
  private _originalContent: string | null = null;
  private _showDiff = false;
  private _runState: RunState = 'idle';
  private _runOutput = '';

  connectedCallback(): void {
    if (!this.closeLabel) this.closeLabel = this.translation.translate('FILE_PREVIEW.CLOSE_BTN');
    this.render();
  }

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

  /**
   * Runs the current spec headless via the local runner and shows the result.
   * No-op off localhost. Never throws — connection failures surface as an
   * "error" state + toast instead of an unhandled rejection.
   */
  async launchTest(specPath?: string): Promise<void> {
    if (!this.isLocal) return;
    const path = specPath ?? this.fileName ?? '';
    if (!path) return;

    this._runState = 'running';
    this._runOutput = '';
    this.render();

    try {
      const response = await fetch(this.runnerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specPath: path }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json() as { success?: boolean; output?: string };
      this._runOutput = result.output ?? '';
      this._runState = result.success ? 'passed' : 'failed';
    } catch {
      this._runState = 'error';
      this._runOutput = '';
      showToast(this.t('FILE_PREVIEW.LAUNCH_NO_RUNNER'), false);
    }
    this.render();
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
      isLocal: this.isLocal,
      runState: this._runState,
      runOutput: this._runOutput,
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

if (!customElements.get('lib-e2e-file-preview')) {
  customElements.define('lib-e2e-file-preview', FilePreviewElement);
}
