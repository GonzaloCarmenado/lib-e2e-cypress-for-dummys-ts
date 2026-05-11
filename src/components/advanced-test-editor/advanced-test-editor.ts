import { PersistenceService } from '../../services/persistence.service';
import { TranslationService } from '../../services/translation.service';
import { AdvancedTestTransformationService } from '../../services/advanced-test.transformation.service';
import { ADVANCED_TEST_EDITOR_STYLES } from './advanced-test-editor.styles';
import { renderNoPermission, renderAdvancedEditor, findFileHandleRecursive } from './advanced-test-editor.template';
import type { DirectoryNode, FileNode } from '../../services/advanced-test.transformation.service';

export class AdvancedTestEditorElement extends HTMLElement {
  private shadow: ShadowRoot;
  private readonly transformationService = new AdvancedTestTransformationService();

  persistence!: PersistenceService;
  translation!: TranslationService;
  testId?: number;

  e2eTree: Array<DirectoryNode | FileNode> = [];
  selectedFile: unknown = null;
  saveButtonEnabled = false;
  selectedFileHandle: FileSystemFileHandle | null = null;
  selectedFileContent: string | null = null;
  testItBlock = '';
  interceptorsBlock = '';
  isPreviewMode = false;
  previewFileName: string | null = null;
  previewFileContent: string | null = null;
  private hasPermission = false;
  private needsReauth = false;
  private _dirHandle: FileSystemDirectoryHandle | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    if (!this.persistence) this.persistence = new PersistenceService();
    if (!this.translation) this.translation = new TranslationService();
    this.init();
  }

  private t(key: string): string { return this.translation.translate(key); }

  private async init(): Promise<void> {
    const config = await this.persistence.getGeneralConfig();
    const allowed = config?.['allowReadWriteFiles'] === 'true';

    if (!allowed) {
      this.hasPermission = false;
      if (this.testId !== undefined) await this.loadCypressCommandsForTest(this.testId);
      this.render();
      return;
    }

    const handle = config?.['cypressDirectoryHandle'] as FileSystemDirectoryHandle | null;
    if (!handle) {
      this.hasPermission = false;
      if (this.testId !== undefined) await this.loadCypressCommandsForTest(this.testId);
      this.render();
      return;
    }

    // queryPermission does NOT require a user gesture
    const perm = await (handle as unknown as FileSystemHandleWithPermission).queryPermission({ mode: 'readwrite' });
    this._dirHandle = handle;
    this.hasPermission = perm === 'granted';
    this.needsReauth  = perm === 'prompt';

    if (this.testId !== undefined) await this.loadCypressCommandsForTest(this.testId);
    if (this.hasPermission) await this.getFoldersData();
    this.render();
  }

  async getFoldersData(): Promise<void> {
    if (!this.hasPermission || !this._dirHandle) return;
    try {
      for await (const entry of this._dirHandle.values()) {
        if (entry.kind === 'directory' && entry.name === 'e2e') {
          const tree = await this.transformationService.scanDirectory(entry as FileSystemDirectoryHandle);
          this.e2eTree = tree.children ?? [];
          this.render();
          return;
        }
      }
    } catch { /* silently skip permission errors */ }
  }

  async saveCommandsToFile(): Promise<void> {
    if (!this.selectedFileHandle || !this.selectedFileContent || !this.testItBlock) return;
    let content = this.selectedFileContent;
    if (this.interceptorsBlock) {
      content = this.transformationService.insertBeforeEach(content, this.interceptorsBlock);
    }
    content = this.transformationService.insertItBlock(content, this.testItBlock);
    if (!content) return;
    const writable = await this.selectedFileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    this.dispatchEvent(new CustomEvent('closemodal', { bubbles: true, composed: true }));
  }

  async onFileClick(file: unknown): Promise<void> {
    if (!this.transformationService.isFile(file)) return;
    this.selectedFile = file;
    this.saveButtonEnabled = true;

    if (!this._dirHandle) return;
    const handle = await findFileHandleRecursive(this._dirHandle, (file as { name: string }).name);
    if (!handle) return;
    this.selectedFileHandle = handle;
    const fileObj = await handle.getFile();
    this.selectedFileContent = await fileObj.text();
    this.render();
  }

  markFileAsSelected(file: unknown): void {
    this.selectedFile = file;
  }

  async loadCypressCommandsForTest(testId: number): Promise<void> {
    const test = await this.persistence.getTestById(testId);
    if (test) {
      this.testItBlock = test.itBlock ?? '';
      this.interceptorsBlock = test.interceptorsBlock ?? '';
    } else {
      this.testItBlock = '';
      this.interceptorsBlock = '';
    }
    this.render();
  }

  copyToClipboard(text: string): void {
    navigator.clipboard?.writeText(text);
  }

  openEditManually(): void {
    if (!this.selectedFileHandle || !this.selectedFileContent) return;
    this.dispatchEvent(new CustomEvent('openfileeditor', {
      detail: {
        handle: this.selectedFileHandle,
        content: this.selectedFileContent,
        fileName: (this.selectedFile as { name?: string } | null)?.name ?? '',
        testId: this.testId,
        itBlock: this.testItBlock,
        interceptorsBlock: this.interceptorsBlock,
      },
      bubbles: true,
      composed: true,
    }));
  }

  closePreview(): void {
    this.isPreviewMode = false;
    this.previewFileName = null;
    this.previewFileContent = null;
    if (this.testId !== undefined) {
      this.dispatchEvent(new CustomEvent('closemodal', { bubbles: true, composed: true }));
    }
    this.render();
  }

  private render(): void {
    if (!this.hasPermission) {
      this.shadow.innerHTML = `<style>${ADVANCED_TEST_EDITOR_STYLES}</style>${renderNoPermission(this.needsReauth, this.t.bind(this))}`;

      this.shadow.getElementById('btn-reauth')?.addEventListener('click', async () => {
        if (!this._dirHandle) return;
        const perm = await (this._dirHandle as unknown as FileSystemHandleWithPermission).requestPermission({ mode: 'readwrite' });
        if (perm === 'granted') {
          this.hasPermission = true;
          this.needsReauth   = false;
          await this.getFoldersData();
          this.render();
        }
      });
      return;
    }

    this.shadow.innerHTML = `<style>${ADVANCED_TEST_EDITOR_STYLES}</style>${renderAdvancedEditor({
      e2eTree: this.e2eTree,
      selectedFile: this.selectedFile,
      selectedFileContent: this.selectedFileContent,
      testItBlock: this.testItBlock,
      interceptorsBlock: this.interceptorsBlock,
      saveButtonEnabled: this.saveButtonEnabled,
    }, this.t.bind(this))}`;

    this.shadow.querySelectorAll('[data-file]').forEach((el) => {
      el.addEventListener('click', () => {
        const data = (el as HTMLElement).dataset['file'];
        if (data) this.onFileClick(JSON.parse(data));
      });
    });
    this.shadow.getElementById('btn-save')
      ?.addEventListener('click', () => this.saveCommandsToFile());
    this.shadow.getElementById('btn-edit')
      ?.addEventListener('click', () => this.openEditManually());
    this.shadow.getElementById('btn-copy-it')
      ?.addEventListener('click', () => this.copyToClipboard(this.testItBlock));
    this.shadow.getElementById('btn-copy-interceptors')
      ?.addEventListener('click', () => this.copyToClipboard(this.interceptorsBlock));
    this.shadow.getElementById('btn-close')
      ?.addEventListener('click', () => this.closePreview());
  }
}

if (!customElements.get('advanced-test-editor')) {
  customElements.define('advanced-test-editor', AdvancedTestEditorElement);
}
