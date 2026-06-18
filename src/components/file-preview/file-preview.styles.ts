export const FILE_PREVIEW_STYLES = `
  :host { display: block; height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e6edf3; }
  * { box-sizing: border-box; }
  .container { display: flex; flex-direction: column; height: 100%; }
  .header {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px; border-bottom: 1px solid #21262d;
    background: #161b22;
  }
  .file-name { flex: 1; font-size: 12px; color: #8b949e;
               font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace; }
  .body { display: flex; flex: 1; overflow: hidden; min-height: 0; }
  .editor {
    flex: 1; min-width: 0; padding: 14px;
    background: #0d1117; color: #c9d1d9; border: none; outline: none;
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace; font-size: 12px;
    line-height: 1.7; resize: none;
    scrollbar-width: thin; scrollbar-color: #30363d transparent;
  }
  .editor::-webkit-scrollbar { width: 5px; }
  .editor::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
  .blocks-panel {
    width: 260px; flex-shrink: 0; border-left: 1px solid #21262d;
    background: #0d1117; padding: 10px 12px; overflow-y: auto;
    display: flex; flex-direction: column; gap: 10px;
    scrollbar-width: thin; scrollbar-color: #30363d transparent;
  }
  .blocks-panel::-webkit-scrollbar { width: 4px; }
  .blocks-panel::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; }
  .block-section { display: flex; flex-direction: column; gap: 4px; }
  .block-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; }
  .block-label { font-size: 10px; color: #484f58; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 600; }
  .btn-copy-sm {
    padding: 2px 8px; border: 1px solid #30363d; border-radius: 4px; cursor: pointer;
    font-size: 10px; font-weight: 500; background: #21262d; color: #8b949e;
    transition: background 0.12s, color 0.12s; white-space: nowrap;
  }
  .btn-copy-sm:hover { background: #30363d; color: #e6edf3; }
  .block-pre {
    margin: 0; padding: 6px 8px; background: #161b22;
    border-radius: 5px; border: 1px solid #21262d;
    font-size: 10px; color: #c9d1d9; line-height: 1.6;
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    max-height: 280px; overflow-y: auto; white-space: pre-wrap; word-break: break-all;
    scrollbar-width: thin; scrollbar-color: #30363d transparent;
  }
  .diff-panel {
    flex: 1; overflow-y: auto; background: #0d1117; border-left: 1px solid #21262d;
    padding: 8px 0; min-width: 0;
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace; font-size: 11px;
    line-height: 1.6;
    scrollbar-width: thin; scrollbar-color: #30363d transparent;
  }
  .diff-panel::-webkit-scrollbar { width: 5px; }
  .diff-panel::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
  .diff-line {
    display: flex; gap: 0; white-space: pre; padding: 0 12px;
  }
  .diff-line.added   { background: rgba(63,185,80,0.12); color: #3fb950; }
  .diff-line.removed { background: rgba(248,81,73,0.1);  color: #f85149; }
  .diff-line.same    { color: #484f58; }
  .diff-sign { width: 14px; flex-shrink: 0; user-select: none; }
  .diff-empty { color: #484f58; font-size: 12px; padding: 20px; text-align: center; }
  .footer {
    display: flex; gap: 8px; padding: 8px 12px;
    border-top: 1px solid #21262d; justify-content: flex-end;
    background: #161b22;
  }
  button {
    padding: 6px 14px; border: 1px solid #30363d; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-weight: 500; background: #21262d; color: #8b949e;
    transition: background 0.15s, color 0.12s;
  }
  button:hover { background: #30363d; color: #e6edf3; }
  .btn-save { background: #3fb950; border-color: #3fb950; color: #fff; }
  .btn-save:hover { background: #2ea043; border-color: #2ea043; }
  .btn-launch { background: transparent; border-color: #e3b341; color: #e3b341; }
  .btn-launch:hover { background: rgba(227,179,65,0.1); }
  .btn-insert { background: transparent; border-color: #a371f7; color: #a371f7; }
  .btn-insert:hover { background: rgba(163,113,247,0.12); color: #c8a8ff; }
  .btn-diff-active { background: rgba(47,129,247,0.15); border-color: rgba(47,129,247,0.4); color: #2f81f7; }
`;
