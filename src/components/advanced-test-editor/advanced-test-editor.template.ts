import { escHtml } from '../../utils/html.utils';

export interface AdvancedEditorState {
  e2eTree: unknown[];
  selectedFile: unknown;
  selectedFileContent: string | null;
  testItBlock: string;
  interceptorsBlock: string;
  saveButtonEnabled: boolean;
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
  const { e2eTree, selectedFile, selectedFileContent, testItBlock, interceptorsBlock, saveButtonEnabled } = state;

  const treeHtml = e2eTree.length
    ? renderTree(e2eTree, selectedFile)
    : `<div class="tree-item" style="color:#6c7a99">${t('ADVANCED_EDITOR.NO_FILES')}</div>`;

  const contentHtml = selectedFileContent
    ? `<div class="file-name">📄 ${escHtml((selectedFile as any)?.name ?? '')}</div>
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

  return `
    <div class="layout">
      <div class="sidebar">${treeHtml}</div>
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

export function renderTree(nodes: unknown[], selected: unknown, indent = 0): string {
  return (nodes as any[]).map((n) => {
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

export async function findFileHandleRecursive(
  dir: FileSystemDirectoryHandle,
  name: string,
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
