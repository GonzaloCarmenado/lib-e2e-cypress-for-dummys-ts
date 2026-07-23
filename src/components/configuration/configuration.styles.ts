import { THEME, SCROLLBAR_INLINE } from '../../utils/theme';

export const CONFIGURATION_STYLES = `
  :host { display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${THEME.color.textPrimary}; max-height: 70vh; overflow-y: auto; ${SCROLLBAR_INLINE} }
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
    background: ${THEME.color.bgCard};
    border: 1px solid ${THEME.color.border};
    border-radius: 10px;
    padding: 14px 16px;
    transition: border-color 0.15s;
  }
  .card:hover { border-color: ${THEME.color.borderHover}; }
  .card-wide { grid-column: 1 / -1; }

  /* ── Card header ──────────────────────────────────────── */
  .card-hd {
    display: flex; align-items: center; gap: 7px;
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.8px; color: ${THEME.color.textMuted}; margin-bottom: 12px;
  }
  .card-hd-icon { font-size: 13px; }

  /* ── Language ─────────────────────────────────────────── */
  .field-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .field-label { font-size: 12px; color: ${THEME.color.textSecondary}; }
  select {
    background: ${THEME.color.bgInput}; color: ${THEME.color.textPrimary}; border: 1px solid ${THEME.color.borderHover};
    border-radius: 6px; padding: 6px 10px; font-size: 12px; outline: none;
    cursor: pointer; transition: border-color 0.15s; flex-shrink: 0;
  }
  select:focus { border-color: ${THEME.color.blue}; box-shadow: 0 0 0 3px rgba(47,129,247,0.12); }

  /* ── HTTP toggle ──────────────────────────────────────── */
  .check-row {
    display: flex; align-items: flex-start; gap: 10px;
    cursor: pointer; user-select: none;
  }
  input[type="checkbox"] { width: 15px; height: 15px; margin-top: 2px; cursor: pointer; accent-color: ${THEME.color.blue}; flex-shrink: 0; }
  .check-title { font-size: 12px; color: ${THEME.color.textBody}; margin-bottom: 3px; }
  .check-sub   { font-size: 10px; color: ${THEME.color.textMuted}; line-height: 1.5; }

  /* ── Cypress folder ───────────────────────────────────── */
  .fs-layout { display: flex; gap: 12px; align-items: flex-start; }
  .fs-tree {
    flex-shrink: 0;
    margin: 0; padding: 8px 10px;
    background: ${THEME.color.bgInput}; border: 1px solid ${THEME.color.border}; border-radius: 6px;
    font-size: 10px; color: ${THEME.color.textBody}; line-height: 1.8;
    font-family: 'Cascadia Code','Fira Code','Consolas',monospace;
  }
  .fs-right { display: flex; flex-direction: column; gap: 10px; flex: 1; }
  .fs-status {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; color: ${THEME.color.textSecondary};
    background: ${THEME.color.bgInput}; border: 1px solid ${THEME.color.border}; border-radius: 6px;
    padding: 8px 10px;
  }
  .fs-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .fs-dot.on  { background: ${THEME.color.greenLight}; box-shadow: 0 0 6px rgba(63,185,80,.5); }
  .fs-dot.off { background: ${THEME.color.textMuted}; }
  .fs-folder  { color: ${THEME.color.textPrimary}; font-family: 'Cascadia Code','Fira Code','Consolas',monospace; font-size: 11px; }

  /* ── Buttons ──────────────────────────────────────────── */
  .btn-row { display: flex; gap: 8px; flex-wrap: wrap; }
  button {
    padding: 7px 14px; border: 1px solid ${THEME.color.borderHover}; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-weight: 500; background: ${THEME.color.border}; color: ${THEME.color.textSecondary};
    transition: background 0.15s, color 0.12s, border-color 0.15s;
  }
  button:hover { background: ${THEME.color.borderHover}; color: ${THEME.color.textPrimary}; border-color: ${THEME.color.textMuted}; }
  .btn-import {
    display: inline-block;
    padding: 7px 14px; border: 1px solid ${THEME.color.borderHover}; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-weight: 500; background: ${THEME.color.border}; color: ${THEME.color.textSecondary};
    transition: background 0.15s, color 0.12s, border-color 0.15s;
  }
  .btn-import:hover { background: ${THEME.color.borderHover}; color: ${THEME.color.textPrimary}; border-color: ${THEME.color.textMuted}; }
  .btn-danger { border-color: rgba(248,81,73,.4); color: ${THEME.color.red}; background: transparent; }
  .btn-danger:hover { background: rgba(248,81,73,.08); border-color: ${THEME.color.red}; color: ${THEME.color.red}; }
  .file-input { display: none; }

  /* ── Data section desc ────────────────────────────────── */
  .data-desc { font-size: 11px; color: ${THEME.color.textMuted}; margin-bottom: 10px; line-height: 1.5; }

  /* ── Export overlay (modal) ───────────────────────────── */
  .export-overlay {
    position: fixed; inset: 0; z-index: ${THEME.zIndex.modal};
    background: rgba(1,4,9,0.7);
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .export-modal {
    width: 640px; max-width: 100%; max-height: 86vh;
    display: flex; flex-direction: column;
    background: ${THEME.color.bgCard}; border: 1px solid ${THEME.color.borderHover}; border-radius: 12px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.5); overflow: hidden;
  }
  .export-hd {
    padding: 14px 18px; font-size: 13px; font-weight: 700;
    border-bottom: 1px solid ${THEME.color.border}; color: ${THEME.color.textPrimary};
  }
  .export-modes { display: flex; gap: 6px; padding: 12px 18px 0; }
  .export-mode {
    flex: 1; padding: 7px 10px; font-size: 11px; border-radius: 6px;
    background: ${THEME.color.bgInput}; border: 1px solid ${THEME.color.borderHover}; color: ${THEME.color.textSecondary};
  }
  .export-mode:hover { background: ${THEME.color.border}; color: ${THEME.color.textPrimary}; }
  .export-mode.active { background: rgba(47,129,247,0.15); border-color: ${THEME.color.blue}; color: ${THEME.color.blue}; }
  .export-body {
    padding: 14px 18px; overflow-y: auto; flex: 1; min-height: 160px;
    ${SCROLLBAR_INLINE}
  }
  .export-tag-hint { font-size: 12px; color: ${THEME.color.textMuted}; margin-top: 12px; }
  .export-result-label {
    font-size: 10px; color: ${THEME.color.textMuted}; text-transform: uppercase; letter-spacing: 0.6px;
    font-weight: 600; margin: 14px 0 6px;
  }
  .export-row-static { cursor: default; }
  .export-row-static:hover { background: transparent; }
  .export-all-desc { font-size: 12px; color: ${THEME.color.textSecondary}; }
  .export-empty { font-size: 12px; color: ${THEME.color.textMuted}; text-align: center; padding: 20px; }
  .export-list { display: flex; flex-direction: column; gap: 4px; }
  .export-row {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 8px; border-radius: 6px; cursor: pointer; font-size: 12px; color: ${THEME.color.textBody};
  }
  .export-row:hover { background: ${THEME.color.bgInput}; }
  .export-row-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .export-row-tag {
    font-size: 9px; color: ${THEME.color.textSecondary}; background: ${THEME.color.bgInput};
    border: 1px solid ${THEME.color.borderHover}; border-radius: 10px; padding: 1px 7px; flex-shrink: 0;
  }
  .export-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .export-tag {
    padding: 4px 10px; font-size: 11px; border-radius: 12px;
    background: ${THEME.color.bgInput}; border: 1px solid ${THEME.color.borderHover}; color: ${THEME.color.textSecondary};
  }
  .export-tag:hover { background: ${THEME.color.border}; color: ${THEME.color.textPrimary}; }
  .export-tag.active { background: rgba(47,129,247,0.15); border-color: ${THEME.color.blue}; color: ${THEME.color.blue}; }
  .export-ft {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    padding: 12px 18px; border-top: 1px solid ${THEME.color.border};
  }
  .export-count { font-size: 11px; color: ${THEME.color.textSecondary}; }
  .export-count b { color: ${THEME.color.textPrimary}; }
  .export-ft-actions { display: flex; gap: 8px; }
  .btn-export-confirm { background: ${THEME.color.green}; border-color: ${THEME.color.green}; color: #fff; }
  .btn-export-confirm:hover:not(:disabled) { background: ${THEME.color.greenHover}; border-color: ${THEME.color.greenHover}; }
  .btn-export-confirm:disabled { opacity: 0.45; cursor: not-allowed; }

  /* ── Form-element font reset ──────────────────────────────── */
  input, select, button, textarea { font-family: inherit; }

  /* ── Primary action button ────────────────────────────────── */
  .btn-primary { background: ${THEME.color.blueDark}; border-color: ${THEME.color.blueDark}; color: #fff; }
  .btn-primary:hover { background: ${THEME.color.blueLight}; border-color: ${THEME.color.blueLight}; color: #fff; }
  .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

  /* ── Login Setup overlay ──────────────────────────────────── */
  .ls-modal { max-width: 500px; }
  .ls-hd { display: flex; align-items: center; gap: 8px; }
  .ls-hd-icon { font-size: 15px; }

  .ls-body {
    padding: 20px; overflow-y: auto; flex: 1;
    display: flex; flex-direction: column; gap: 20px;
    ${SCROLLBAR_INLINE}
  }

  .ls-section { display: flex; flex-direction: column; gap: 8px; }
  .ls-section-label {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.8px; color: ${THEME.color.textMuted};
  }

  .ls-actions { display: flex; gap: 10px; }
  .ls-action-btn {
    flex: 1; padding: 14px 12px; border-radius: 8px;
    background: ${THEME.color.bgInput}; border: 1px solid ${THEME.color.border}; color: ${THEME.color.textSecondary};
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .ls-action-btn:hover { background: ${THEME.color.bgCard}; color: ${THEME.color.textPrimary}; border-color: ${THEME.color.blueLight}; }
  .ls-action-icon { font-size: 22px; line-height: 1; }
  .ls-action-label { font-size: 12px; font-weight: 600; color: ${THEME.color.textBody}; }
  .ls-action-btn:hover .ls-action-label { color: ${THEME.color.textPrimary}; }
  .ls-action-sub { font-size: 10px; color: ${THEME.color.textMuted}; line-height: 1.4; text-align: center; }

  .ls-file-row {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; background: ${THEME.color.bgInput};
    border: 1px solid ${THEME.color.border}; border-radius: 8px;
  }
  .ls-file-icon { font-size: 14px; flex-shrink: 0; }
  .ls-file-name {
    flex: 1; font-size: 11px; color: ${THEME.color.textBody};
    font-family: 'Cascadia Code','Fira Code','Consolas',monospace;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    min-width: 0;
  }
  .ls-btn-rescan {
    flex-shrink: 0; padding: 4px 10px; font-size: 11px;
    background: ${THEME.color.bgCard}; border-color: ${THEME.color.borderHover}; color: ${THEME.color.textSecondary};
  }
  .ls-btn-rescan:hover { background: ${THEME.color.border}; color: ${THEME.color.textPrimary}; }

  .ls-input {
    width: 100%; padding: 8px 10px; background: ${THEME.color.bgInput};
    border: 1px solid ${THEME.color.borderHover}; border-radius: 6px;
    color: ${THEME.color.textBody}; font-size: 12px; outline: none; font-family: inherit;
  }
  .ls-input:focus { border-color: ${THEME.color.blue}; box-shadow: 0 0 0 3px rgba(47,129,247,0.12); }

  .ls-fns {
    display: flex; flex-wrap: wrap; gap: 6px;
    padding: 10px; background: ${THEME.color.bgInput};
    border: 1px solid ${THEME.color.border}; border-radius: 6px; min-height: 38px;
  }
  .ls-fn-chip {
    padding: 3px 10px; font-size: 11px; color: ${THEME.color.shNumber};
    background: rgba(47,129,247,0.1); border: 1px solid rgba(47,129,247,0.2);
    border-radius: 12px; font-family: 'Cascadia Code','Fira Code','Consolas',monospace;
  }

  .ls-field-block { display: flex; flex-direction: column; gap: 6px; }
  .ls-field-block + .ls-field-block { margin-top: 12px; }
  .ls-label { font-size: 11px; color: ${THEME.color.textSecondary}; }
  .ls-select {
    width: 100%; padding: 8px 10px; background: ${THEME.color.bgInput};
    border: 1px solid ${THEME.color.borderHover}; border-radius: 6px;
    color: ${THEME.color.textBody}; font-size: 12px; outline: none; cursor: pointer;
  }
  .ls-select:focus { border-color: ${THEME.color.blue}; box-shadow: 0 0 0 3px rgba(47,129,247,0.12); }

  .ls-empty-state {
    display: flex; align-items: center; gap: 10px;
    padding: 14px; background: ${THEME.color.bgInput}; border: 1px solid ${THEME.color.border};
    border-radius: 8px; font-size: 12px; color: ${THEME.color.textMuted};
  }
  .ls-empty-icon { font-size: 16px; }

  .ls-ft { padding: 14px 20px; }
`;
