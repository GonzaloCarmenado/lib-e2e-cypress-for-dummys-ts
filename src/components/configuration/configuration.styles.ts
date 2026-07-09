export const CONFIGURATION_STYLES = `
  :host { display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e6edf3; max-height: 70vh; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #30363d transparent; }
  * { box-sizing: border-box; }

  /* ── Grid container ───────────────────────────────────── */
  .cfg-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 14px;
  }

  /* ── Cards ────────────────────────────────────────────── */
  .card {
    background: #161b22;
    border: 1px solid #21262d;
    border-radius: 10px;
    padding: 14px 16px;
    transition: border-color 0.15s;
  }
  .card:hover { border-color: #30363d; }
  .card-wide { grid-column: 1 / -1; }

  /* ── Card header ──────────────────────────────────────── */
  .card-hd {
    display: flex; align-items: center; gap: 7px;
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.8px; color: #484f58; margin-bottom: 12px;
  }
  .card-hd-icon { font-size: 13px; }

  /* ── Language ─────────────────────────────────────────── */
  .field-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .field-label { font-size: 12px; color: #8b949e; }
  select {
    background: #0d1117; color: #e6edf3; border: 1px solid #30363d;
    border-radius: 6px; padding: 6px 10px; font-size: 12px; outline: none;
    cursor: pointer; transition: border-color 0.15s; flex-shrink: 0;
  }
  select:focus { border-color: #2f81f7; box-shadow: 0 0 0 3px rgba(47,129,247,0.12); }

  /* ── HTTP toggle ──────────────────────────────────────── */
  .check-row {
    display: flex; align-items: flex-start; gap: 10px;
    cursor: pointer; user-select: none;
  }
  input[type="checkbox"] { width: 15px; height: 15px; margin-top: 2px; cursor: pointer; accent-color: #2f81f7; flex-shrink: 0; }
  .check-title { font-size: 12px; color: #c9d1d9; margin-bottom: 3px; }
  .check-sub   { font-size: 10px; color: #484f58; line-height: 1.5; }

  /* ── Cypress folder ───────────────────────────────────── */
  .fs-layout { display: flex; gap: 12px; align-items: flex-start; }
  .fs-tree {
    flex-shrink: 0;
    margin: 0; padding: 8px 10px;
    background: #0d1117; border: 1px solid #21262d; border-radius: 6px;
    font-size: 10px; color: #c9d1d9; line-height: 1.8;
    font-family: 'Cascadia Code','Fira Code','Consolas',monospace;
  }
  .fs-right { display: flex; flex-direction: column; gap: 10px; flex: 1; }
  .fs-status {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; color: #8b949e;
    background: #0d1117; border: 1px solid #21262d; border-radius: 6px;
    padding: 8px 10px;
  }
  .fs-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .fs-dot.on  { background: #3fb950; box-shadow: 0 0 6px rgba(63,185,80,.5); }
  .fs-dot.off { background: #484f58; }
  .fs-folder  { color: #e6edf3; font-family: 'Cascadia Code','Fira Code','Consolas',monospace; font-size: 11px; }

  /* ── Buttons ──────────────────────────────────────────── */
  .btn-row { display: flex; gap: 8px; flex-wrap: wrap; }
  button {
    padding: 7px 14px; border: 1px solid #30363d; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-weight: 500; background: #21262d; color: #8b949e;
    transition: background 0.15s, color 0.12s, border-color 0.15s;
  }
  button:hover { background: #30363d; color: #e6edf3; border-color: #484f58; }
  .btn-import {
    display: inline-block;
    padding: 7px 14px; border: 1px solid #30363d; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-weight: 500; background: #21262d; color: #8b949e;
    transition: background 0.15s, color 0.12s, border-color 0.15s;
  }
  .btn-import:hover { background: #30363d; color: #e6edf3; border-color: #484f58; }
  .btn-danger { border-color: rgba(248,81,73,.4); color: #f85149; background: transparent; }
  .btn-danger:hover { background: rgba(248,81,73,.08); border-color: #f85149; color: #f85149; }
  .file-input { display: none; }

  /* ── Data section desc ────────────────────────────────── */
  .data-desc { font-size: 11px; color: #484f58; margin-bottom: 10px; line-height: 1.5; }

  /* ── Export overlay (modal) ───────────────────────────── */
  .export-overlay {
    position: fixed; inset: 0; z-index: 100000;
    background: rgba(1,4,9,0.7);
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .export-modal {
    width: 640px; max-width: 100%; max-height: 86vh;
    display: flex; flex-direction: column;
    background: #161b22; border: 1px solid #30363d; border-radius: 12px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.5); overflow: hidden;
  }
  .export-hd {
    padding: 14px 18px; font-size: 13px; font-weight: 700;
    border-bottom: 1px solid #21262d; color: #e6edf3;
  }
  .export-modes { display: flex; gap: 6px; padding: 12px 18px 0; }
  .export-mode {
    flex: 1; padding: 7px 10px; font-size: 11px; border-radius: 6px;
    background: #0d1117; border: 1px solid #30363d; color: #8b949e;
  }
  .export-mode:hover { background: #21262d; color: #e6edf3; }
  .export-mode.active { background: rgba(47,129,247,0.15); border-color: #2f81f7; color: #2f81f7; }
  .export-body {
    padding: 14px 18px; overflow-y: auto; flex: 1; min-height: 160px;
    scrollbar-width: thin; scrollbar-color: #30363d transparent;
  }
  .export-tag-hint { font-size: 12px; color: #484f58; margin-top: 12px; }
  .export-result-label {
    font-size: 10px; color: #484f58; text-transform: uppercase; letter-spacing: 0.6px;
    font-weight: 600; margin: 14px 0 6px;
  }
  .export-row-static { cursor: default; }
  .export-row-static:hover { background: transparent; }
  .export-all-desc { font-size: 12px; color: #8b949e; }
  .export-empty { font-size: 12px; color: #484f58; text-align: center; padding: 20px; }
  .export-list { display: flex; flex-direction: column; gap: 4px; }
  .export-row {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 8px; border-radius: 6px; cursor: pointer; font-size: 12px; color: #c9d1d9;
  }
  .export-row:hover { background: #0d1117; }
  .export-row-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .export-row-tag {
    font-size: 9px; color: #8b949e; background: #0d1117;
    border: 1px solid #30363d; border-radius: 10px; padding: 1px 7px; flex-shrink: 0;
  }
  .export-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .export-tag {
    padding: 4px 10px; font-size: 11px; border-radius: 12px;
    background: #0d1117; border: 1px solid #30363d; color: #8b949e;
  }
  .export-tag:hover { background: #21262d; color: #e6edf3; }
  .export-tag.active { background: rgba(47,129,247,0.15); border-color: #2f81f7; color: #2f81f7; }
  .export-ft {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    padding: 12px 18px; border-top: 1px solid #21262d;
  }
  .export-count { font-size: 11px; color: #8b949e; }
  .export-count b { color: #e6edf3; }
  .export-ft-actions { display: flex; gap: 8px; }
  .btn-export-confirm { background: #238636; border-color: #238636; color: #fff; }
  .btn-export-confirm:hover:not(:disabled) { background: #2ea043; border-color: #2ea043; }
  .btn-export-confirm:disabled { opacity: 0.45; cursor: not-allowed; }

  /* ── Form-element font reset ──────────────────────────────── */
  input, select, button, textarea { font-family: inherit; }

  /* ── Primary action button ────────────────────────────────── */
  .btn-primary { background: #1f6feb; border-color: #1f6feb; color: #fff; }
  .btn-primary:hover { background: #388bfd; border-color: #388bfd; color: #fff; }
  .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

  /* ── Login Setup overlay ──────────────────────────────────── */
  .ls-body {
    padding: 16px 18px; overflow-y: auto; flex: 1;
    scrollbar-width: thin; scrollbar-color: #30363d transparent;
  }
  .ls-actions { display: flex; gap: 8px; margin-bottom: 14px; }
  .ls-action-btn {
    flex: 1; padding: 10px 14px; text-align: center;
    background: #0d1117; border-color: #21262d; color: #8b949e;
    display: flex; flex-direction: column; align-items: center; gap: 5px;
  }
  .ls-action-btn:hover { background: #161b22; color: #e6edf3; border-color: #30363d; }
  .ls-action-icon { font-size: 18px; line-height: 1; }
  .ls-action-label { font-size: 11px; font-weight: 500; }
  .ls-action-sub { font-size: 10px; color: #484f58; }
  .ls-file-row {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 10px; background: #0d1117;
    border: 1px solid #21262d; border-radius: 6px; margin: 10px 0;
  }
  .ls-file-name {
    flex: 1; font-size: 11px; color: #c9d1d9;
    font-family: 'Cascadia Code','Fira Code','Consolas',monospace;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .ls-fns {
    display: flex; flex-wrap: wrap; gap: 4px;
    padding: 7px 8px; background: #0d1117;
    border: 1px solid #21262d; border-radius: 6px;
    margin: 8px 0 14px; min-height: 32px;
  }
  .ls-fn-chip {
    padding: 2px 8px; font-size: 10px; color: #79c0ff;
    background: rgba(47,129,247,0.1); border: 1px solid rgba(47,129,247,0.2);
    border-radius: 10px; font-family: 'Cascadia Code','Fira Code','Consolas',monospace;
  }
  .ls-no-fn { font-size: 11px; color: #484f58; padding: 6px 2px; margin: 6px 0 14px; }
  .ls-input {
    flex: 1; padding: 5px 8px; background: #161b22;
    border: 1px solid #30363d; border-radius: 5px;
    color: #c9d1d9; font-size: 12px; outline: none; font-family: inherit;
  }
  .ls-input:focus { border-color: #2f81f7; box-shadow: 0 0 0 3px rgba(47,129,247,0.12); }
  .ls-divider { border: none; border-top: 1px solid #21262d; margin: 14px 0; }
  .ls-select {
    flex: 1; padding: 5px 8px; background: #161b22;
    border: 1px solid #30363d; border-radius: 5px;
    color: #c9d1d9; font-size: 12px; outline: none; cursor: pointer;
  }
  .ls-select:focus { border-color: #2f81f7; box-shadow: 0 0 0 3px rgba(47,129,247,0.12); }
  .ls-field-row { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
`;
