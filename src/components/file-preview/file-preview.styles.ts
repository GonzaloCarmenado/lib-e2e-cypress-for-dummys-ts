import { THEME, scrollbar, SCROLLBAR_INLINE } from '../../utils/theme';

export const FILE_PREVIEW_STYLES = `
  :host { display: block; height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${THEME.color.textPrimary}; }
  * { box-sizing: border-box; }
  .container { display: flex; flex-direction: column; height: 100%; }
  .header {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px; border-bottom: 1px solid ${THEME.color.border};
    background: ${THEME.color.bgCard};
  }
  .file-name { flex: 1; font-size: 12px; color: ${THEME.color.textSecondary};
               font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace; }
  .body { display: flex; flex: 1; overflow: hidden; min-height: 0; }
  .editor {
    flex: 1; min-width: 0; padding: 14px;
    background: ${THEME.color.bgInput}; color: ${THEME.color.textBody}; border: none; outline: none;
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace; font-size: 12px;
    line-height: 1.7; resize: none;
  }
  ${scrollbar('.editor', 5)}
  .blocks-panel {
    width: 260px; flex-shrink: 0; border-left: 1px solid ${THEME.color.border};
    background: ${THEME.color.bgInput}; padding: 10px 12px; overflow-y: auto;
    display: flex; flex-direction: column; gap: 10px;
  }
  ${scrollbar('.blocks-panel')}
  .block-section { display: flex; flex-direction: column; gap: 4px; }
  .block-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; }
  .block-label { font-size: 10px; color: ${THEME.color.textMuted}; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 600; }
  .btn-copy-sm {
    padding: 2px 8px; border: 1px solid ${THEME.color.borderHover}; border-radius: 4px; cursor: pointer;
    font-size: 10px; font-weight: 500; background: ${THEME.color.border}; color: ${THEME.color.textSecondary};
    transition: background 0.12s, color 0.12s; white-space: nowrap;
  }
  .btn-copy-sm:hover { background: ${THEME.color.borderHover}; color: ${THEME.color.textPrimary}; }
  .block-pre {
    margin: 0; padding: 6px 8px; background: ${THEME.color.bgCard};
    border-radius: 5px; border: 1px solid ${THEME.color.border};
    font-size: 10px; color: ${THEME.color.textBody}; line-height: 1.6;
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    max-height: 280px; overflow-y: auto; white-space: pre-wrap; word-break: break-all;
  }
  ${scrollbar('.block-pre')}
  .diff-panel {
    flex: 1; overflow-y: auto; background: ${THEME.color.bgInput}; border-left: 1px solid ${THEME.color.border};
    padding: 8px 0; min-width: 0;
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace; font-size: 11px;
    line-height: 1.6;
  }
  ${scrollbar('.diff-panel', 5)}
  .diff-line {
    display: flex; gap: 0; white-space: pre; padding: 0 12px;
  }
  .diff-line.added   { background: rgba(63,185,80,0.12); color: ${THEME.color.greenLight}; }
  .diff-line.removed { background: rgba(248,81,73,0.1);  color: ${THEME.color.red}; }
  .diff-line.same    { color: ${THEME.color.textMuted}; }
  .diff-sign { width: 14px; flex-shrink: 0; user-select: none; }
  .diff-empty { color: ${THEME.color.textMuted}; font-size: 12px; padding: 20px; text-align: center; }
  .footer {
    display: flex; gap: 8px; padding: 8px 12px;
    border-top: 1px solid ${THEME.color.border}; justify-content: flex-end;
    background: ${THEME.color.bgCard};
  }
  button {
    padding: 6px 14px; border: 1px solid ${THEME.color.borderHover}; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-weight: 500; background: ${THEME.color.border}; color: ${THEME.color.textSecondary};
    transition: background 0.15s, color 0.12s;
  }
  button:hover { background: ${THEME.color.borderHover}; color: ${THEME.color.textPrimary}; }
  .btn-save { background: ${THEME.color.greenLight}; border-color: ${THEME.color.greenLight}; color: #fff; }
  .btn-save:hover { background: ${THEME.color.greenHover}; border-color: ${THEME.color.greenHover}; }
  .btn-launch { background: transparent; border-color: ${THEME.color.yellowLight}; color: ${THEME.color.yellowLight}; }
  .btn-launch:hover { background: rgba(227,179,65,0.1); }
  .btn-launch:disabled { opacity: 0.45; cursor: not-allowed; }
  .btn-launch:disabled:hover { background: transparent; }
  .launch-hint { font-size: 10px; color: #8b6d3b; align-self: center; }
  .btn-insert { background: transparent; border-color: ${THEME.color.purple}; color: ${THEME.color.purple}; }
  .btn-insert:hover { background: rgba(163,113,247,0.12); color: #c8a8ff; }
  .btn-diff-active { background: rgba(47,129,247,0.15); border-color: rgba(47,129,247,0.4); color: ${THEME.color.blue}; }

  /* ── Run result panel ─────────────────────────────────── */
  .run-result {
    border-top: 1px solid ${THEME.color.border}; padding: 8px 12px; background: ${THEME.color.bgInput};
    max-height: 220px; overflow-y: auto; flex-shrink: 0;
    ${SCROLLBAR_INLINE}
  }
  .run-status { font-size: 12px; font-weight: 600; }
  .run-passed  .run-status { color: ${THEME.color.greenLight}; }
  .run-failed  .run-status { color: ${THEME.color.red}; }
  .run-running .run-status { color: ${THEME.color.yellowLight}; }
  .run-error   .run-status { color: ${THEME.color.red}; }
  .run-output {
    margin: 6px 0 0; padding: 8px 10px; background: ${THEME.color.bgCard}; border: 1px solid ${THEME.color.border};
    border-radius: 5px; font-size: 10px; color: ${THEME.color.textBody}; line-height: 1.5;
    font-family: 'Cascadia Code','Fira Code','Consolas',monospace;
    white-space: pre-wrap; word-break: break-word; max-height: 160px; overflow-y: auto;
  }
`;
