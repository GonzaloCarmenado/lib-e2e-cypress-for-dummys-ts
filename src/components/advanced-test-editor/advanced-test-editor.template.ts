import { escHtml, escAttr } from '../../utils/html.utils';
import type { DirectoryNode, FileNode } from '../../services/advanced-test.transformation.service';

export interface AdvancedEditorState {
  e2eTree: Array<DirectoryNode | FileNode>;
  selectedFile: unknown;
  selectedFileContent: string | null;
  testItBlock: string;
  interceptorsBlock: string;
  saveButtonEnabled: boolean;
  isCreatingFile: boolean;
  collapsedDirs: Set<string>;
  sidebarWidth: number;
}

export function renderNoPermission(needsReauth: boolean, t: (key: string) => string): string {
  const reauthBtn = needsReauth
    ? `<button id="btn-reauth"
         style="margin-top:14px;padding:7px 16px;border:none;border-radius:6px;cursor:pointer;
                font-size:12px;font-weight:500;background:#2f81f7;color:#fff">
         ${t('ADVANCED_EDITOR.REAUTH_BTN')}
       </button>`
    : '';

  return `
    <div class="no-perm">
      <div>${needsReauth ? t('ADVANCED_EDITOR.PERMISSION_EXPIRED') : t('ADVANCED_EDITOR.NO_ACCESS')}</div>
      <div style="font-size:11px">${needsReauth
        ? t('ADVANCED_EDITOR.PERMISSION_EXPIRED_HINT')
        : t('ADVANCED_EDITOR.NO_ACCESS_HINT')}</div>
      ${reauthBtn}
    </div>`;
}

export function renderAdvancedEditor(state: AdvancedEditorState, t: (key: string) => string): string {
  const { e2eTree, selectedFile, selectedFileContent, testItBlock, interceptorsBlock, saveButtonEnabled, isCreatingFile, collapsedDirs, sidebarWidth } = state;

  const treeHtml = e2eTree.length
    ? renderTree(e2eTree, selectedFile, collapsedDirs)
    : `<div class="tree-item" style="color:#6c7a99">${t('ADVANCED_EDITOR.NO_FILES')}</div>`;

  const contentHtml = selectedFileContent
    ? `<div class="file-name">📄 ${escHtml((selectedFile as { name?: string } | null)?.name ?? '')}</div>
       <pre>${escHtml(selectedFileContent.slice(0, 4000))}${selectedFileContent.length > 4000 ? '\n...' : ''}</pre>`
    : `<div class="placeholder">${t('ADVANCED_EDITOR.SELECT_FILE')}</div>`;

  const itHtml = testItBlock
    ? `<div style="margin-top:10px">
         <div class="file-name block-header">
           <span>${t('ADVANCED_EDITOR.IT_LABEL')}</span>
           <button id="btn-copy-it" class="btn-copy">${t('ADVANCED_EDITOR.COPY_IT_BTN')}</button>
         </div>
         <pre style="max-height:120px;font-size:10.5px">${escHtml(testItBlock.slice(0, 500))}</pre>
       </div>` : '';

  const interceptorsHtml = interceptorsBlock
    ? `<div style="margin-top:10px">
         <div class="file-name block-header">
           <span>${t('ADVANCED_EDITOR.BEFORE_EACH_LABEL')}</span>
           <button id="btn-copy-interceptors" class="btn-copy">${t('ADVANCED_EDITOR.COPY_ICP_BTN')}</button>
         </div>
         <pre style="max-height:120px;font-size:10.5px;color:#3fb950">${escHtml(interceptorsBlock.slice(0, 500))}</pre>
       </div>` : '';

  const newFileForm = isCreatingFile
    ? `<div class="new-file-form">
         <input id="input-new-file" type="text" placeholder="${escHtml(t('ADVANCED_EDITOR.NEW_FILE_PLACEHOLDER'))}" autocomplete="off" />
         <span class="ext">.cy.ts</span>
         <div class="new-file-actions">
           <button id="btn-new-file-confirm" class="btn-confirm">${t('ADVANCED_EDITOR.NEW_FILE_CONFIRM')}</button>
           <button id="btn-new-file-cancel" class="btn-cancel-form">${t('ADVANCED_EDITOR.NEW_FILE_CANCEL')}</button>
         </div>
       </div>`
    : '';

  const toolbar = `
    <div class="sidebar-toolbar">
      <button id="btn-new-file" class="btn-toolbar btn-new">${t('ADVANCED_EDITOR.NEW_FILE_BTN')}</button>
      <button id="btn-refresh" class="btn-toolbar">${t('ADVANCED_EDITOR.REFRESH_BTN')}</button>
    </div>`;

  return `
    <div class="layout">
      <div class="sidebar" style="width:${sidebarWidth}px">
        ${toolbar}
        ${newFileForm}
        <div class="tree-scroll">${treeHtml}</div>
      </div>
      <div id="resize-handle" class="resize-handle"></div>
      <div class="main">
        <div class="content-area">${contentHtml}${itHtml}${interceptorsHtml}</div>
        <div class="footer">
          <button id="btn-save" class="btn-save"
            ${!saveButtonEnabled || !testItBlock ? 'disabled' : ''}>
            ${t('ADVANCED_EDITOR.INSERT_BTN')}
          </button>
          <button id="btn-edit" ${!saveButtonEnabled ? 'disabled' : ''}>
            ${t('ADVANCED_EDITOR.EDIT_MANUAL_BTN')}
          </button>
          <button id="btn-close">${t('ADVANCED_EDITOR.CLOSE_BTN')}</button>
        </div>
      </div>
    </div>`;
}

export function renderTree(
  nodes: Array<DirectoryNode | FileNode>,
  selected: unknown,
  collapsedDirs: Set<string>,
  indent = 0,
  parentPath = '',
): string {
  return nodes.map((n) => {
    const currentPath = parentPath ? `${parentPath}/${n.name}` : n.name;
    const isFile = n.kind === 'file';
    const pad = `padding-left:${6 + indent * 14}px`;

    if (!isFile) {
      const dir = n as DirectoryNode;
      const hasChildren = (dir.children?.length ?? 0) > 0;
      const isCollapsed = collapsedDirs.has(currentPath);
      const arrow = hasChildren ? (isCollapsed ? '▶' : '▼') : '·';
      const dirHtml = `<div class="tree-item dir" style="${pad}" data-dir-path="${escAttr(currentPath)}">
        <span class="dir-arrow">${arrow}</span>📁 ${escHtml(n.name)}
      </div>`;
      if (!hasChildren || isCollapsed) return dirHtml;
      return dirHtml + renderTree(dir.children, selected, collapsedDirs, indent + 1, currentPath);
    }

    const isSel = (selected as { name?: string } | null)?.name === n.name;
    const cls = `tree-item${isSel ? ' selected' : ''}`;
    const data = JSON.stringify({ kind: n.kind, name: n.name }).replace(/"/g, '&quot;');
    return `<div class="${cls}" style="${pad}" data-file="${data}">📄 ${escHtml(n.name)}</div>`;
  }).join('');
}

export async function findFileHandleRecursive(
  dir: FileSystemDirectoryHandle,
  name: string,
): Promise<FileSystemFileHandle | null> {
  for await (const entry of dir.values()) {
    if (entry.kind === 'file' && entry.name === name) return entry as FileSystemFileHandle;
    if (entry.kind === 'directory') {
      const found = await findFileHandleRecursive(entry as FileSystemDirectoryHandle, name);
      if (found) return found;
    }
  }
  return null;
}
