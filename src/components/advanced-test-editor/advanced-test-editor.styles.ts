export const ADVANCED_TEST_EDITOR_STYLES = `
  :host { display: flex; flex-direction: column; flex: 1; min-height: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e6edf3; overflow: hidden; }
  * { box-sizing: border-box; }
  .layout { display: flex; flex: 1; min-height: 0; }
  .sidebar {
    border-right: none; display: flex; flex-direction: column;
    background: #0d1117; flex-shrink: 0; min-width: 140px; max-width: 500px;
  }
  .tree-scroll {
    flex: 1; overflow-y: auto; padding: 6px 4px;
    scrollbar-width: thin; scrollbar-color: #30363d transparent;
  }
  .tree-scroll::-webkit-scrollbar { width: 4px; }
  .tree-scroll::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; }
  .resize-handle {
    width: 4px; background: #21262d; cursor: col-resize; flex-shrink: 0;
    transition: background 0.15s;
  }
  .resize-handle:hover, .resize-handle.dragging { background: #2f81f7; }
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #161b22; min-width: 0; }
  .no-perm {
    padding: 28px; color: #484f58; font-size: 13px; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 12px; line-height: 1.6;
  }
  .tree-item {
    padding: 4px 6px; border-radius: 4px; cursor: pointer;
    font-size: 12px; color: #8b949e; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
    transition: background 0.12s, color 0.12s;
    display: flex; align-items: center; gap: 4px; user-select: none;
  }
  .tree-item:hover { background: #161b22; color: #c9d1d9; }
  .tree-item.selected { background: rgba(47,129,247,0.12); color: #2f81f7; }
  .tree-item.dir { color: #e3b341; font-weight: 600; }
  .tree-item.dir:hover { background: rgba(227,179,65,0.08); color: #f0c040; }
  .dir-arrow { font-size: 8px; color: #484f58; width: 10px; flex-shrink: 0; line-height: 1; }
  .tree-connector { display: block; width: 1px; background: #21262d; margin-left: 13px; height: 100%; }
  .content-area {
    flex: 1; padding: 12px 14px; overflow-y: auto;
    scrollbar-width: thin; scrollbar-color: #30363d transparent;
  }
  .content-area::-webkit-scrollbar { width: 4px; }
  .content-area::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; }
  .file-name { font-size: 11px; color: #484f58; margin-bottom: 8px; font-family: monospace; }
  pre {
    background: #0d1117; padding: 12px; border-radius: 8px;
    font-size: 11px; color: #c9d1d9; margin: 0;
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    line-height: 1.7; border: 1px solid #21262d;
    white-space: pre; overflow-x: auto; overflow-y: auto;
    scrollbar-width: thin; scrollbar-color: #30363d transparent;
  }
  pre::-webkit-scrollbar { width: 4px; height: 4px; }
  pre::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; }
  .pre-block { font-size: 10.5px; }
  .pre-icp .sh-str { color: #85e89d; }
  .sh-kw  { color: #ff7b72; }
  .sh-bi  { color: #d2a8ff; }
  .sh-str { color: #a5d6ff; }
  .sh-cmt { color: #8b949e; font-style: italic; }
  .sh-num { color: #79c0ff; }
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
  .test-notes {
    margin: 0 0 10px; padding: 8px 12px;
    background: rgba(47,129,247,0.06); border-left: 3px solid rgba(47,129,247,0.4);
    border-radius: 0 6px 6px 0; font-size: 12px; color: #8b949e;
    line-height: 1.6; white-space: pre-wrap; word-break: break-word;
  }
  .block-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
  .btn-copy {
    padding: 3px 10px; border: 1px solid #30363d; border-radius: 5px; cursor: pointer;
    font-size: 10px; font-weight: 500; background: #21262d; color: #8b949e;
    transition: background 0.12s, color 0.12s; white-space: nowrap; flex-shrink: 0;
  }
  .btn-copy:hover { background: #30363d; color: #e6edf3; }
  .sidebar-toolbar {
    display: flex; flex-wrap: wrap; gap: 4px; padding: 6px 6px 4px;
    border-bottom: 1px solid #21262d; flex-shrink: 0; background: #0d1117;
  }
  .btn-toolbar {
    flex: 1 1 calc(50% - 2px); padding: 4px 6px; border: 1px solid #30363d; border-radius: 5px; cursor: pointer;
    font-size: 10px; font-weight: 500; background: #161b22; color: #8b949e;
    transition: background 0.12s, color 0.12s; white-space: nowrap; overflow: hidden;
    text-overflow: ellipsis;
  }
  .btn-toolbar.btn-full { flex: 1 1 100%; }
  .btn-toolbar:hover { background: #30363d; color: #e6edf3; }
  .btn-toolbar.btn-new { color: #3fb950; border-color: #238636; }
  .btn-toolbar.btn-new:hover { background: #238636; color: #fff; }
  .btn-toolbar.btn-new-folder { color: #d29922; border-color: #9e6a03; }
  .btn-toolbar.btn-new-folder:hover { background: #9e6a03; color: #fff; }
  .new-file-form {
    padding: 6px; border-bottom: 1px solid #21262d; display: flex; flex-direction: column; gap: 4px;
  }
  .new-file-form input {
    width: 100%; padding: 4px 7px; background: #0d1117; border: 1px solid #30363d;
    border-radius: 5px; color: #e6edf3; font-size: 11px; font-family: monospace;
    outline: none;
  }
  .new-file-form input:focus { border-color: #2f81f7; }
  .new-file-form .ext { font-size: 9px; color: #484f58; padding: 0 2px; }
  .new-file-actions { display: flex; gap: 4px; }
  .btn-confirm { flex: 1; padding: 3px 6px; border: 1px solid #238636; border-radius: 5px; cursor: pointer; font-size: 10px; font-weight: 500; background: #238636; color: #fff; transition: background 0.12s; }
  .btn-confirm:hover { background: #2ea043; }
  .btn-cancel-form { flex: 1; padding: 3px 6px; border: 1px solid #30363d; border-radius: 5px; cursor: pointer; font-size: 10px; font-weight: 500; background: #21262d; color: #8b949e; transition: background 0.12s; }
  .btn-cancel-form:hover { background: #30363d; color: #e6edf3; }
`;
