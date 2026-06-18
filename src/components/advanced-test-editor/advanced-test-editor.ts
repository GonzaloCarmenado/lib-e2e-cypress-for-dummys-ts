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
  testNotes = '';
  isPreviewMode = false;
  previewFileName: string | null = null;
  previewFileContent: string | null = null;
  isCreatingFile = false;
  isCreatingFolder = false;
  collapsedDirs: Set<string> = new Set();
  sidebarWidth = 220;
  private hasPermission = false;
  private needsReauth = false;
  private _dirHandle: FileSystemDirectoryHandle | null = null;
  private _e2eHandle: FileSystemDirectoryHandle | null = null;

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
          this._e2eHandle = entry as FileSystemDirectoryHandle;
          const tree = await this.transformationService.scanDirectory(this._e2eHandle);
          this.e2eTree = tree.children ?? [];
          this.render();
          return;
        }
      }
    } catch { /* silently skip permission errors */ }
  }

  async createNewFile(rawName: string): Promise<void> {
    if (!this._e2eHandle) return;
    const name = rawName.trim().replace(/\.cy\.ts$/, '');
    if (!name) return;
    const fileName = `${name}.cy.ts`;
    const template = `describe('${name}', () => {\n\n  it('should ', () => {\n\n  });\n\n});\n`;
    try {
      const fileHandle = await this._e2eHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(template);
      await writable.close();
    } catch { /* silently ignore if file already exists or permission denied */ }
    this.isCreatingFile = false;
    await this.getFoldersData();
  }

  async createNewFolder(rawName: string): Promise<void> {
    if (!this._e2eHandle) return;
    const name = rawName.trim().replace(/[/\\]/g, '');
    if (!name) return;
    try {
      await this._e2eHandle.getDirectoryHandle(name, { create: true });
    } catch { /* silently ignore if folder already exists or permission denied */ }
    this.isCreatingFolder = false;
    await this.getFoldersData();
  }

  async refreshTree(): Promise<void> {
    await this.getFoldersData();
  }

  async saveCommandsToFile(): Promise<void> {
    if (!this.selectedFileHandle || !this.selectedFileContent || !this.testItBlock) return;
    let content = this.selectedFileContent;
    if (this.interceptorsBlock) {
      content = this.transformationService.insertBeforeEach(content, this.interceptorsBlock);
    }
    const comment = this.testNotes ? this.transformationService.buildBlockComment(this.testNotes) + '\n' : '';
    content = this.transformationService.insertItBlock(content, comment + this.testItBlock);
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
      this.testNotes = test.notes ?? '';
    } else {
      this.testItBlock = '';
      this.interceptorsBlock = '';
      this.testNotes = '';
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
        notes: this.testNotes,
      },
      bubbles: true,
      composed: true,
    }));
  }

  toggleDir(path: string): void {
    if (this.collapsedDirs.has(path)) {
      this.collapsedDirs.delete(path);
    } else {
      this.collapsedDirs.add(path);
    }
    this.render();
  }

  private setupResizeHandle(): void {
    const handle = this.shadow.getElementById('resize-handle');
    const sidebar = this.shadow.querySelector('.sidebar') as HTMLElement | null;
    if (!handle || !sidebar) return;

    let startX = 0;
    let startWidth = 0;

    const onMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      const newWidth = Math.max(140, Math.min(500, startWidth + delta));
      this.sidebarWidth = newWidth;
      sidebar.style.width = `${newWidth}px`;
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      handle.classList.remove('dragging');
    };

    handle.addEventListener('mousedown', (e: MouseEvent) => {
      startX = e.clientX;
      startWidth = sidebar.offsetWidth;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      handle.classList.add('dragging');
      e.preventDefault();
    });
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
      testNotes: this.testNotes,
      saveButtonEnabled: this.saveButtonEnabled,
      isCreatingFile: this.isCreatingFile,
      isCreatingFolder: this.isCreatingFolder,
      collapsedDirs: this.collapsedDirs,
      sidebarWidth: this.sidebarWidth,
    }, this.t.bind(this))}`;

    this.shadow.querySelectorAll('[data-file]').forEach((el) => {
      el.addEventListener('click', () => {
        const data = (el as HTMLElement).dataset['file'];
        if (data) this.onFileClick(JSON.parse(data));
      });
    });
    this.shadow.querySelectorAll('[data-dir-path]').forEach((el) => {
      el.addEventListener('click', () => {
        const path = (el as HTMLElement).dataset['dirPath'];
        if (path) this.toggleDir(path);
      });
    });
    this.setupResizeHandle();
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
    this.shadow.getElementById('btn-new-file')
      ?.addEventListener('click', () => {
        this.isCreatingFile = !this.isCreatingFile;
        this.isCreatingFolder = false;
        this.render();
        if (this.isCreatingFile) this.shadow.getElementById('input-new-file')?.focus();
      });
    this.shadow.getElementById('btn-new-folder')
      ?.addEventListener('click', () => {
        this.isCreatingFolder = !this.isCreatingFolder;
        this.isCreatingFile = false;
        this.render();
        if (this.isCreatingFolder) this.shadow.getElementById('input-new-folder')?.focus();
      });
    this.shadow.getElementById('btn-refresh')
      ?.addEventListener('click', () => this.refreshTree());
    this.shadow.getElementById('btn-new-file-confirm')
      ?.addEventListener('click', () => {
        const input = this.shadow.getElementById('input-new-file') as HTMLInputElement | null;
        this.createNewFile(input?.value ?? '');
      });
    this.shadow.getElementById('btn-new-file-cancel')
      ?.addEventListener('click', () => {
        this.isCreatingFile = false;
        this.render();
      });
    const input = this.shadow.getElementById('input-new-file') as HTMLInputElement | null;
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.createNewFile(input.value);
      } else if (e.key === 'Escape') {
        this.isCreatingFile = false;
        this.render();
      }
    });
    this.shadow.getElementById('btn-new-folder-confirm')
      ?.addEventListener('click', () => {
        const folderInput = this.shadow.getElementById('input-new-folder') as HTMLInputElement | null;
        this.createNewFolder(folderInput?.value ?? '');
      });
    this.shadow.getElementById('btn-new-folder-cancel')
      ?.addEventListener('click', () => {
        this.isCreatingFolder = false;
        this.render();
      });
    const folderInput = this.shadow.getElementById('input-new-folder') as HTMLInputElement | null;
    folderInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.createNewFolder(folderInput.value);
      } else if (e.key === 'Escape') {
        this.isCreatingFolder = false;
        this.render();
      }
    });
  }
}

if (!customElements.get('advanced-test-editor')) {
  customElements.define('advanced-test-editor', AdvancedTestEditorElement);
}
