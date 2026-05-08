export const ADVANCED_TEST_EDITOR_STYLES = `
  :host { display: flex; flex-direction: column; flex: 1; min-height: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e6edf3; overflow: hidden; }
  * { box-sizing: border-box; }
  .layout { display: flex; flex: 1; min-height: 0; }
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
    line-height: 1.7; overflow-y: auto;
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
