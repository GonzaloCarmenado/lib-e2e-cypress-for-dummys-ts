export const TEST_EDITOR_STYLES = `
  :host { display: flex; flex-direction: column; flex: 1; min-height: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e6edf3; overflow: hidden; }
  * { box-sizing: border-box; }
  .toolbar {
    display: flex; align-items: center; gap: 6px; padding: 8px 10px; flex-shrink: 0;
    background: #161b22; border-bottom: 1px solid #21262d; flex-wrap: wrap;
  }
  .tag-filter { display: flex; gap: 5px; flex-wrap: wrap; flex: 1; }
  .tag-chip {
    padding: 2px 10px; border-radius: 20px; cursor: pointer; font-size: 11px; font-weight: 500;
    border: 1px solid #30363d; background: #21262d; color: #8b949e;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }
  .tag-chip:hover { background: #30363d; color: #e6edf3; }
  .tag-chip.active { background: rgba(47,129,247,0.2); color: #2f81f7; border-color: rgba(47,129,247,0.4); }
  .btn-select {
    padding: 4px 12px; border: 1px solid #30363d; border-radius: 6px; cursor: pointer;
    font-size: 11px; font-weight: 500; background: #21262d; color: #8b949e;
    transition: background 0.12s, color 0.12s; white-space: nowrap; flex-shrink: 0;
  }
  .btn-select:hover { background: #30363d; color: #e6edf3; }
  .btn-select.active { background: rgba(47,129,247,0.15); color: #2f81f7; border-color: rgba(47,129,247,0.3); }
  .describe-bar {
    display: flex; align-items: center; gap: 8px; padding: 8px 10px;
    background: rgba(47,129,247,0.06); border-bottom: 1px solid rgba(47,129,247,0.2);
    flex-wrap: wrap;
  }
  .describe-bar input {
    flex: 1; min-width: 150px; padding: 5px 10px; background: #0d1117;
    border: 1px solid #30363d; border-radius: 6px; color: #e6edf3;
    font-size: 12px; outline: none;
  }
  .describe-bar input:focus { border-color: #2f81f7; }
  .btn-gen-describe {
    padding: 5px 14px; border: 1px solid #2f81f7; border-radius: 6px; cursor: pointer;
    font-size: 11px; font-weight: 500; background: rgba(47,129,247,0.15); color: #2f81f7;
    transition: background 0.12s; white-space: nowrap; flex-shrink: 0;
  }
  .btn-gen-describe:hover { background: rgba(47,129,247,0.25); }
  .selected-count { font-size: 11px; color: #8b949e; }
  .describe-bar { flex-shrink: 0; }
  .list { padding: 8px; flex: 1; min-height: 0; overflow-y: auto;
          scrollbar-width: thin; scrollbar-color: #30363d transparent; }
  .list::-webkit-scrollbar { width: 4px; }
  .list::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; }
  .empty { color: #484f58; text-align: center; padding: 32px; font-size: 13px; }
  .row {
    background: #0d1117; border-radius: 8px; margin-bottom: 6px;
    overflow: hidden; border: 1px solid #21262d;
    transition: border-color 0.15s;
  }
  .row:hover { border-color: #30363d; }
  .row.selected-row { border-color: rgba(47,129,247,0.5); }
  .row-header {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 12px; cursor: pointer; user-select: none;
  }
  .row-header:hover { background: rgba(48,54,61,0.3); }
  .test-name { flex: 1; font-size: 13px; font-weight: 500; color: #e6edf3; }
  .test-date { font-size: 10.5px; color: #484f58; margin-right: 4px; }
  .test-tags { display: flex; gap: 4px; margin-right: 4px; }
  .test-tag {
    padding: 1px 7px; border-radius: 20px; font-size: 10px;
    background: rgba(47,129,247,0.1); color: #8b949e; border: 1px solid rgba(47,129,247,0.2);
  }
  .btn-icon {
    padding: 3px 8px; border: none; border-radius: 6px; cursor: pointer;
    font-size: 11px; background: #21262d; color: #8b949e;
    transition: background 0.15s, color 0.12s;
  }
  .btn-icon:hover { background: #30363d; color: #e6edf3; }
  .btn-del:hover  { background: rgba(248,81,73,0.15); color: #f85149; }
  input[type="checkbox"] {
    width: 14px; height: 14px; accent-color: #2f81f7; cursor: pointer; flex-shrink: 0;
  }
  .row-body {
    background: #0d1117; padding: 10px 14px;
    border-top: 1px solid #21262d;
  }
  .code-preview {
    margin: 0; padding: 10px 12px; background: #161b22;
    border-radius: 6px; border: 1px solid #21262d;
    font-size: 11px; color: #c9d1d9; line-height: 1.7;
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    overflow-x: auto; white-space: pre;
    scrollbar-width: thin; scrollbar-color: #30363d transparent;
  }
  .code-preview::-webkit-scrollbar { height: 4px; }
  .code-preview::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; }
  .code-preview-icp { margin-top: 8px; }
  .sh-kw  { color: #ff7b72; }
  .sh-bi  { color: #d2a8ff; }
  .sh-str { color: #a5d6ff; }
  .sh-cmt { color: #8b949e; font-style: italic; }
  .sh-num { color: #79c0ff; }
`;
