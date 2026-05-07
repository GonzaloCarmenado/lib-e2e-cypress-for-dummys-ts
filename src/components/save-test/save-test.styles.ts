export const SAVE_TEST_STYLES = `
  :host { display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e6edf3; }
  * { box-sizing: border-box; }
  .container { padding: 24px 28px; text-align: center; }
  p { margin: 0 0 20px; font-size: 14px; color: #8b949e; line-height: 1.5; }
  .btn-row { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 16px; }
  button {
    padding: 7px 16px; border: 1px solid #30363d; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-weight: 500; transition: filter 0.15s, transform 0.1s;
    letter-spacing: 0.1px;
  }
  button:hover { filter: brightness(1.1); }
  button:active { transform: scale(0.97); }
  .btn-primary { background: #2f81f7; color: #fff; }
  .btn-success { background: #3fb950; color: #fff; }
  .btn-danger  { background: transparent; color: #f85149; border: 1px solid rgba(248,81,73,0.5); }
  .btn-danger:hover { background: rgba(248,81,73,0.08); filter: none; }
  input[type="text"] {
    width: 100%; padding: 10px 14px; border: 1px solid #30363d;
    border-radius: 8px; background: #0d1117; color: #e6edf3;
    font-size: 14px; outline: none; margin-bottom: 4px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  input[type="text"]:focus { border-color: #2f81f7; box-shadow: 0 0 0 3px rgba(47,129,247,0.15); }
  input[type="text"]::placeholder { color: #484f58; }
  .tag-label {
    font-size: 11px; color: #484f58; text-align: left; margin-bottom: 5px; display: block;
  }
  .tag-input-row { display: flex; gap: 6px; margin-bottom: 8px; }
  .tag-input-row input[type="text"] {
    font-size: 12px; padding: 6px 10px; margin: 0;
  }
  .btn-tag-add {
    padding: 6px 12px; font-size: 12px; background: #21262d; color: #8b949e;
    border: 1px solid #30363d; border-radius: 6px; cursor: pointer;
    transition: background 0.15s, color 0.12s; white-space: nowrap; flex-shrink: 0;
  }
  .btn-tag-add:hover { background: #30363d; color: #e6edf3; filter: none; }
  .chips { display: flex; flex-wrap: wrap; gap: 5px; min-height: 24px; text-align: left; }
  .chip {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(47,129,247,0.15); color: #2f81f7;
    border: 1px solid rgba(47,129,247,0.3); border-radius: 20px;
    padding: 2px 10px 2px 10px; font-size: 11px; font-weight: 500;
  }
  .chip-del {
    cursor: pointer; color: #8b949e; font-size: 12px; line-height: 1;
    transition: color 0.12s; padding: 0; background: none; border: none;
  }
  .chip-del:hover { color: #f85149; filter: none; }
`;
