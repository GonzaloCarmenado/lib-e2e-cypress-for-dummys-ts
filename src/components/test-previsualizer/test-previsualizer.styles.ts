export const TEST_PREVISUALIZER_STYLES = `
  :host { display: flex; flex-direction: column; flex: 1; min-height: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e6edf3; overflow: hidden; }
  * { box-sizing: border-box; }
  .toolbar {
    display: flex; gap: 6px; padding: 10px 12px; flex-shrink: 0;
    background: #161b22; border-bottom: 1px solid #21262d;
  }
  button {
    padding: 5px 12px; border: none; border-radius: 6px; cursor: pointer;
    font-size: 11px; font-weight: 500; background: #21262d; color: #8b949e;
    transition: background 0.15s, color 0.12s; letter-spacing: 0.1px;
  }
  button:hover { background: #30363d; color: #e6edf3; }
  button.active { background: #2f81f7; color: #fff; }
  .section { padding: 10px 12px; flex-shrink: 0; }
  .section.section-cmds { flex: 1; min-height: 0; display: flex; flex-direction: column; }
  .section-title {
    font-size: 10px; font-weight: 600; color: #484f58; text-transform: uppercase;
    letter-spacing: 0.8px; margin-bottom: 7px; flex-shrink: 0;
  }
  .list {
    overflow-y: auto; background: #0d1117;
    border-radius: 8px; padding: 6px 8px;
    border: 1px solid #21262d;
    scrollbar-width: thin; scrollbar-color: #30363d transparent;
  }
  .section-cmds .list { flex: 1; min-height: 0; }
  .list::-webkit-scrollbar { width: 4px; }
  .list::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; }
  .item {
    display: flex; align-items: flex-start; gap: 6px;
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace; font-size: 11px;
    color: #c9d1d9; padding: 4px 8px; border-radius: 4px;
    word-break: break-all; line-height: 1.65;
    border-left: 2px solid transparent;
    transition: background 0.1s, border-color 0.1s;
  }
  .item:hover { background: #161b22; border-left-color: #2f81f7; }
  .cmd-text { flex: 1; }
  .item-actions {
    display: flex; gap: 3px; flex-shrink: 0;
    opacity: 0; transition: opacity 0.15s;
  }
  .item:hover .item-actions { opacity: 1; }
  .btn-step {
    width: 20px; height: 20px; border: none; border-radius: 3px; cursor: pointer;
    font-size: 12px; background: transparent; color: #484f58;
    transition: background 0.12s, color 0.12s;
    display: flex; align-items: center; justify-content: center;
    padding: 0; line-height: 1;
  }
  .btn-step:hover { background: #30363d; color: #e6edf3; }
  .btn-step-del:hover { background: rgba(248,81,73,0.15); color: #f85149; }
  .empty { color: #484f58; font-size: 12px; padding: 20px 8px; text-align: center; }
`;
