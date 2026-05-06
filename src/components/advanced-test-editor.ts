import { PersistenceService } from '../services/persistence.service';
import { TranslationService } from '../services/translation.service';
import { AdvancedTestTransformationService } from '../services/advanced-test.transformation.service';

const STYLES = `
  :host { display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e6edf3; }
  * { box-sizing: border-box; }
  .layout { display: flex; height: 380px; }
  .sidebar {
    width: 220px; border-right: 1px solid #21262d; overflow-y: auto;
    padding: 8px; background: #0d1117; flex-shrink: 0;
    scrollbar-width: thin; scrollbar-color: #30363d transparent;
  }
  .sidebar::-webkit-scrollbar { width: 4px; }
  .sidebar::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; }
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #161b22; }
  .no-perm {
    padding: 28px; color: #484f58; font-size: 13px; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 12px; line-height: 1.6;
  }
  .tree-item {
    padding: 5px 8px; border-radius: 5px; cursor: pointer;
    font-size: 12px; color: #8b949e; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
    transition: background 0.12s, color 0.12s;
  }
  .tree-item:hover { background: #161b22; color: #c9d1d9; }
  .tree-item.selected { background: rgba(47,129,247,0.12); color: #2f81f7; }
  .tree-item.dir { color: #e3b341; font-weight: 600; }
  .content-area {
    flex: 1; padding: 12px 14px; overflow-y: auto;
    scrollbar-width: thin; scrollbar-color: #30363d transparent;
  }
  .content-area::-webkit-scrollbar { width: 4px; }
  .content-area::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; }
  .file-name { font-size: 11px; color: #484f58; margin-bottom: 8px; font-family: monospace; }
  pre {
    background: #0d1117; padding: 12px; border-radius: 8px;
    font-size: 11px; color: #c9d1d9; overflow-x: auto;
    white-space: pre-wrap; word-break: break-all; margin: 0;
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    line-height: 1.7; max-height: 280px; overflow-y: auto;
    border: 1px solid #21262d;
  }
  .footer {
    padding: 10px 14px; border-top: 1px solid #21262d;
    display: flex; gap: 8px; justify-content: flex-end; background: #161b22;
  }
  button {
    padding: 6px 16px; border: 1px solid #30363d; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-weight: 500; background: #21262d; color: #8b949e;
    transition: background 0.15s, color 0.12s;
  }
  button:hover { background: #30363d; color: #e6edf3; }
  button:disabled { opacity: 0.35; cursor: default; }
  .btn-save { background: #2f81f7; border-color: #2f81f7; color: #fff; }
  .btn-save:hover { background: #1f6feb; border-color: #1f6feb; color: #fff; }
  .btn-save:disabled { background: #21262d; border-color: #30363d; color: #8b949e; }
  .placeholder { color: #484f58; font-size: 13px; padding: 28px; text-align: center; }
  .block-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
  .btn-copy {
    padding: 3px 10px; border: 1px solid #30363d; border-radius: 5px; cursor: pointer;
    font-size: 10px; font-weight: 500; background: #21262d; color: #8b949e;
    transition: background 0.12s, color 0.12s; white-space: nowrap; flex-shrink: 0;
  }
  .btn-copy:hover { background: #30363d; color: #e6edf3; }
`;

export class AdvancedTestEditorElement extends HTMLElement {
  private shadow: ShadowRoot;
  private readonly transformationService = new AdvancedTestTransformationService();

  persistence!: PersistenceService;
  translation!: TranslationService;
  testId?: number;

  e2eTree: unknown[] = [];
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
    const perm = await (handle as any).queryPermission({ mode: 'readwrite' });
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
      for await (const entry of (this._dirHandle as any).values()) {
        if ((entry as any).kind === 'directory' && (entry as any).name === 'e2e') {
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
    const handle = await findFileHandleRecursive(this._dirHandle, (file as any).name);
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
        fileName: (this.selectedFile as any)?.name ?? '',
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
      const reauthBtn = this.needsReauth
        ? `<button id="btn-reauth"
             style="margin-top:14px;padding:7px 16px;border:none;border-radius:6px;cursor:pointer;
                    font-size:12px;font-weight:500;background:#2f81f7;color:#fff">
             ${this.t('ADVANCED_EDITOR.REAUTH_BTN')}
           </button>`
        : '';
      this.shadow.innerHTML = `
        <style>${STYLES}</style>
        <div class="no-perm">
          <div>${this.needsReauth ? this.t('ADVANCED_EDITOR.PERMISSION_EXPIRED') : this.t('ADVANCED_EDITOR.NO_ACCESS')}</div>
          <div style="font-size:11px">${this.needsReauth
            ? this.t('ADVANCED_EDITOR.PERMISSION_EXPIRED_HINT')
            : this.t('ADVANCED_EDITOR.NO_ACCESS_HINT')}</div>
          ${reauthBtn}
        </div>`;

      this.shadow.getElementById('btn-reauth')?.addEventListener('click', async () => {
        if (!this._dirHandle) return;
        const perm = await (this._dirHandle as any).requestPermission({ mode: 'readwrite' });
        if (perm === 'granted') {
          this.hasPermission = true;
          this.needsReauth   = false;
          await this.getFoldersData();
          this.render();
        }
      });
      return;
    }

    const treeHtml = this.e2eTree.length
      ? renderTree(this.e2eTree, this.selectedFile)
      : `<div class="tree-item" style="color:#6c7a99">${this.t('ADVANCED_EDITOR.NO_FILES')}</div>`;

    const contentHtml = this.selectedFileContent
      ? `<div class="file-name">📄 ${escHtml((this.selectedFile as any)?.name ?? '')}</div>
         <pre>${escHtml(this.selectedFileContent.slice(0, 4000))}${this.selectedFileContent.length > 4000 ? '\n...' : ''}</pre>`
      : `<div class="placeholder">${this.t('ADVANCED_EDITOR.SELECT_FILE')}</div>`;

    const itHtml = this.testItBlock
      ? `<div style="margin-top:10px">
           <div class="file-name block-header">
             <span>${this.t('ADVANCED_EDITOR.IT_LABEL')}</span>
             <button id="btn-copy-it" class="btn-copy">${this.t('ADVANCED_EDITOR.COPY_IT_BTN')}</button>
           </div>
           <pre style="max-height:120px;font-size:10.5px">${escHtml(this.testItBlock.slice(0, 500))}</pre>
         </div>` : '';

    const interceptorsHtml = this.interceptorsBlock
      ? `<div style="margin-top:10px">
           <div class="file-name block-header">
             <span>${this.t('ADVANCED_EDITOR.BEFORE_EACH_LABEL')}</span>
             <button id="btn-copy-interceptors" class="btn-copy">${this.t('ADVANCED_EDITOR.COPY_ICP_BTN')}</button>
           </div>
           <pre style="max-height:120px;font-size:10.5px;color:#3fb950">${escHtml(this.interceptorsBlock.slice(0, 500))}</pre>
         </div>` : '';

    this.shadow.innerHTML = `
      <style>${STYLES}</style>
      <div class="layout">
        <div class="sidebar">${treeHtml}</div>
        <div class="main">
          <div class="content-area">${contentHtml}${itHtml}${interceptorsHtml}</div>
          <div class="footer">
            <button id="btn-save" class="btn-save"
              ${!this.saveButtonEnabled || !this.testItBlock ? 'disabled' : ''}>
              ${this.t('ADVANCED_EDITOR.INSERT_BTN')}
            </button>
            <button id="btn-edit" ${!this.saveButtonEnabled ? 'disabled' : ''}>
              ${this.t('ADVANCED_EDITOR.EDIT_MANUAL_BTN')}
            </button>
            <button id="btn-close">${this.t('ADVANCED_EDITOR.CLOSE_BTN')}</button>
          </div>
        </div>
      </div>`;

    this.shadow.querySelectorAll('[data-file]').forEach((el) => {
      el.addEventListener('click', () => this.onFileClick(JSON.parse((el as HTMLElement).dataset['file']!)));
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

function renderTree(nodes: unknown[], selected: unknown, indent = 0): string {
  return nodes.map((n: any) => {
    const isFile = n.kind === 'file';
    const isSel = selected === n || (selected as any)?.name === n.name;
    const cls = `tree-item${isFile ? '' : ' dir'}${isSel ? ' selected' : ''}`;
    const pad = `padding-left:${8 + indent * 14}px`;
    if (!isFile && n.children?.length) {
      return `<div class="${cls}" style="${pad}">📁 ${escHtml(n.name)}</div>
              ${renderTree(n.children, selected, indent + 1)}`;
    }
    const data = JSON.stringify({ kind: n.kind, name: n.name }).replace(/"/g, '&quot;');
    return `<div class="${cls}" style="${pad}" data-file="${data}">📄 ${escHtml(n.name)}</div>`;
  }).join('');
}

async function findFileHandleRecursive(
  dir: FileSystemDirectoryHandle,
  name: string
): Promise<FileSystemFileHandle | null> {
  for await (const entry of (dir as any).values()) {
    if (entry.kind === 'file' && entry.name === name) return entry as FileSystemFileHandle;
    if (entry.kind === 'directory') {
      const found = await findFileHandleRecursive(entry as FileSystemDirectoryHandle, name);
      if (found) return found;
    }
  }
  return null;
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

if (!customElements.get('advanced-test-editor')) {
  customElements.define('advanced-test-editor', AdvancedTestEditorElement);
}
