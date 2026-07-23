import { THEME, scrollbar } from '../../utils/theme';

export const ADVANCED_TEST_EDITOR_STYLES = `
  :host { display: flex; flex-direction: column; flex: 1; min-height: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${THEME.color.textPrimary}; overflow: hidden; }
  * { box-sizing: border-box; }
  .layout { display: flex; flex: 1; min-height: 0; }
  .sidebar {
    border-right: none; display: flex; flex-direction: column;
    background: ${THEME.color.bgInput}; flex-shrink: 0; min-width: 140px; max-width: 500px;
  }
  .tree-scroll {
    flex: 1; overflow-y: auto; padding: 6px 4px;
  }
  ${scrollbar('.tree-scroll')}
  .resize-handle {
    width: 4px; background: ${THEME.color.border}; cursor: col-resize; flex-shrink: 0;
    transition: background 0.15s;
  }
  .resize-handle:hover, .resize-handle.dragging { background: ${THEME.color.blue}; }
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: ${THEME.color.bgCard}; min-width: 0; }
  .no-perm {
    padding: 28px; color: ${THEME.color.textMuted}; font-size: 13px; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 12px; line-height: 1.6;
  }
  .tree-item {
    padding: 4px 6px; border-radius: 4px; cursor: pointer;
    font-size: 12px; color: ${THEME.color.textSecondary}; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
    transition: background 0.12s, color 0.12s;
    display: flex; align-items: center; gap: 4px; user-select: none;
  }
  .tree-item:hover { background: ${THEME.color.bgCard}; color: ${THEME.color.textBody}; }
  .tree-item.selected { background: rgba(47,129,247,0.12); color: ${THEME.color.blue}; }
  .tree-item.dir { color: ${THEME.color.yellowLight}; font-weight: 600; }
  .tree-item.dir:hover { background: rgba(227,179,65,0.08); color: #f0c040; }
  .dir-arrow { font-size: 8px; color: ${THEME.color.textMuted}; width: 10px; flex-shrink: 0; line-height: 1; }
  .tree-connector { display: block; width: 1px; background: ${THEME.color.border}; margin-left: 13px; height: 100%; }
  .content-area {
    flex: 1; padding: 12px 14px; overflow-y: auto;
  }
  ${scrollbar('.content-area')}
  .file-name { font-size: 11px; color: ${THEME.color.textMuted}; margin-bottom: 8px; font-family: monospace; }
  pre {
    background: ${THEME.color.bgInput}; padding: 12px; border-radius: 8px;
    font-size: 11px; color: ${THEME.color.textBody}; margin: 0;
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    line-height: 1.7; border: 1px solid ${THEME.color.border};
    white-space: pre; overflow-x: auto; overflow-y: auto;
  }
  ${scrollbar('pre')}
  .pre-block { font-size: 10.5px; }
  .pre-icp .sh-str { color: ${THEME.color.shStringAlt}; }
  .sh-kw  { color: ${THEME.color.shKeyword}; }
  .sh-bi  { color: ${THEME.color.shBuiltin}; }
  .sh-str { color: ${THEME.color.shString}; }
  .sh-cmt { color: ${THEME.color.textSecondary}; font-style: italic; }
  .sh-num { color: ${THEME.color.shNumber}; }
  .footer {
    padding: 10px 14px; border-top: 1px solid ${THEME.color.border};
    display: flex; gap: 8px; justify-content: flex-end; background: ${THEME.color.bgCard};
  }
  button {
    padding: 6px 16px; border: 1px solid ${THEME.color.borderHover}; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-weight: 500; background: ${THEME.color.border}; color: ${THEME.color.textSecondary};
    transition: background 0.15s, color 0.12s;
  }
  button:hover { background: ${THEME.color.borderHover}; color: ${THEME.color.textPrimary}; }
  button:disabled { opacity: 0.35; cursor: default; }
  .btn-save { background: ${THEME.color.blue}; border-color: ${THEME.color.blue}; color: #fff; }
  .btn-save:hover { background: ${THEME.color.blueDark}; border-color: ${THEME.color.blueDark}; color: #fff; }
  .btn-save:disabled { background: ${THEME.color.border}; border-color: ${THEME.color.borderHover}; color: ${THEME.color.textSecondary}; }
  .placeholder { color: ${THEME.color.textMuted}; font-size: 13px; padding: 28px; text-align: center; }
  .test-notes {
    margin: 0 0 10px; padding: 8px 12px;
    background: rgba(47,129,247,0.06); border-left: 3px solid rgba(47,129,247,0.4);
    border-radius: 0 6px 6px 0; font-size: 12px; color: ${THEME.color.textSecondary};
    line-height: 1.6; white-space: pre-wrap; word-break: break-word;
  }
  .block-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
  .btn-copy {
    padding: 3px 10px; border: 1px solid ${THEME.color.borderHover}; border-radius: 5px; cursor: pointer;
    font-size: 10px; font-weight: 500; background: ${THEME.color.border}; color: ${THEME.color.textSecondary};
    transition: background 0.12s, color 0.12s; white-space: nowrap; flex-shrink: 0;
  }
  .btn-copy:hover { background: ${THEME.color.borderHover}; color: ${THEME.color.textPrimary}; }
  .sidebar-toolbar {
    display: flex; flex-wrap: wrap; gap: 4px; padding: 6px 6px 4px;
    border-bottom: 1px solid ${THEME.color.border}; flex-shrink: 0; background: ${THEME.color.bgInput};
  }
  .btn-toolbar {
    flex: 1 1 calc(50% - 2px); padding: 4px 6px; border: 1px solid ${THEME.color.borderHover}; border-radius: 5px; cursor: pointer;
    font-size: 10px; font-weight: 500; background: ${THEME.color.bgCard}; color: ${THEME.color.textSecondary};
    transition: background 0.12s, color 0.12s; white-space: nowrap; overflow: hidden;
    text-overflow: ellipsis;
  }
  .btn-toolbar.btn-full { flex: 1 1 100%; }
  .btn-toolbar:hover { background: ${THEME.color.borderHover}; color: ${THEME.color.textPrimary}; }
  .btn-toolbar.btn-new { color: ${THEME.color.greenLight}; border-color: ${THEME.color.green}; }
  .btn-toolbar.btn-new:hover { background: ${THEME.color.green}; color: #fff; }
  .btn-toolbar.btn-new-folder { color: ${THEME.color.yellow}; border-color: ${THEME.color.yellowDark}; }
  .btn-toolbar.btn-new-folder:hover { background: ${THEME.color.yellowDark}; color: #fff; }
  .new-file-form {
    padding: 6px; border-bottom: 1px solid ${THEME.color.border}; display: flex; flex-direction: column; gap: 4px;
  }
  .new-file-form input {
    width: 100%; padding: 4px 7px; background: ${THEME.color.bgInput}; border: 1px solid ${THEME.color.borderHover};
    border-radius: 5px; color: ${THEME.color.textPrimary}; font-size: 11px; font-family: monospace;
    outline: none;
  }
  .new-file-form input:focus { border-color: ${THEME.color.blue}; }
  .new-file-form .ext { font-size: 9px; color: ${THEME.color.textMuted}; padding: 0 2px; }
  .new-file-actions { display: flex; gap: 4px; }
  .btn-confirm { flex: 1; padding: 3px 6px; border: 1px solid ${THEME.color.green}; border-radius: 5px; cursor: pointer; font-size: 10px; font-weight: 500; background: ${THEME.color.green}; color: #fff; transition: background 0.12s; }
  .btn-confirm:hover { background: ${THEME.color.greenHover}; }
  .btn-cancel-form { flex: 1; padding: 3px 6px; border: 1px solid ${THEME.color.borderHover}; border-radius: 5px; cursor: pointer; font-size: 10px; font-weight: 500; background: ${THEME.color.border}; color: ${THEME.color.textSecondary}; transition: background 0.12s; }
  .btn-cancel-form:hover { background: ${THEME.color.borderHover}; color: ${THEME.color.textPrimary}; }
`;
