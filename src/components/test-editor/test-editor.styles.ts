import { THEME, scrollbar } from '../../utils/theme';

export const TEST_EDITOR_STYLES = `
  :host { display: flex; flex-direction: column; flex: 1; min-height: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${THEME.color.textPrimary}; overflow: hidden; }
  * { box-sizing: border-box; }
  .toolbar {
    display: flex; align-items: center; gap: 6px; padding: 8px 10px; flex-shrink: 0;
    background: ${THEME.color.bgCard}; border-bottom: 1px solid ${THEME.color.border}; flex-wrap: wrap;
  }
  .tag-filter { display: flex; gap: 5px; flex-wrap: wrap; flex: 1; }
  .tag-chip {
    padding: 2px 10px; border-radius: 20px; cursor: pointer; font-size: 11px; font-weight: 500;
    border: 1px solid ${THEME.color.borderHover}; background: ${THEME.color.border}; color: ${THEME.color.textSecondary};
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }
  .tag-chip:hover { background: ${THEME.color.borderHover}; color: ${THEME.color.textPrimary}; }
  .tag-chip.active { background: rgba(47,129,247,0.2); color: ${THEME.color.blue}; border-color: rgba(47,129,247,0.4); }
  .btn-select {
    padding: 4px 12px; border: 1px solid ${THEME.color.borderHover}; border-radius: 6px; cursor: pointer;
    font-size: 11px; font-weight: 500; background: ${THEME.color.border}; color: ${THEME.color.textSecondary};
    transition: background 0.12s, color 0.12s; white-space: nowrap; flex-shrink: 0;
  }
  .btn-select:hover { background: ${THEME.color.borderHover}; color: ${THEME.color.textPrimary}; }
  .btn-select.active { background: rgba(47,129,247,0.15); color: ${THEME.color.blue}; border-color: rgba(47,129,247,0.3); }
  .describe-bar {
    display: flex; align-items: center; gap: 8px; padding: 8px 10px;
    background: rgba(47,129,247,0.06); border-bottom: 1px solid rgba(47,129,247,0.2);
    flex-wrap: wrap;
  }
  .describe-bar input {
    flex: 1; min-width: 150px; padding: 5px 10px; background: ${THEME.color.bgInput};
    border: 1px solid ${THEME.color.borderHover}; border-radius: 6px; color: ${THEME.color.textPrimary};
    font-size: 12px; outline: none;
  }
  .describe-bar input:focus { border-color: ${THEME.color.blue}; }
  .btn-gen-describe {
    padding: 5px 14px; border: 1px solid ${THEME.color.blue}; border-radius: 6px; cursor: pointer;
    font-size: 11px; font-weight: 500; background: rgba(47,129,247,0.15); color: ${THEME.color.blue};
    transition: background 0.12s; white-space: nowrap; flex-shrink: 0;
  }
  .btn-gen-describe:hover { background: rgba(47,129,247,0.25); }
  .selected-count { font-size: 11px; color: ${THEME.color.textSecondary}; }
  .describe-bar { flex-shrink: 0; }
  .list { padding: 8px; flex: 1; min-height: 0; overflow-y: auto; }
  ${scrollbar('.list')}
  .empty { color: ${THEME.color.textMuted}; text-align: center; padding: 32px; font-size: 13px; }
  .row {
    background: ${THEME.color.bgInput}; border-radius: 8px; margin-bottom: 6px;
    overflow: hidden; border: 1px solid ${THEME.color.border};
    transition: border-color 0.15s;
  }
  .row:hover { border-color: ${THEME.color.borderHover}; }
  .row.selected-row { border-color: rgba(47,129,247,0.5); }
  .row-header {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 12px; cursor: pointer; user-select: none;
  }
  .row-header:hover { background: rgba(48,54,61,0.3); }
  .test-name { flex: 1; font-size: 13px; font-weight: 500; color: ${THEME.color.textPrimary}; }
  .test-date { font-size: 10.5px; color: ${THEME.color.textMuted}; margin-right: 4px; }
  .test-tags { display: flex; gap: 4px; margin-right: 4px; }
  .test-tag {
    padding: 1px 7px; border-radius: 20px; font-size: 10px;
    background: rgba(47,129,247,0.1); color: ${THEME.color.textSecondary}; border: 1px solid rgba(47,129,247,0.2);
  }
  .ticket-badge, .ticket-link {
    padding: 1px 7px; border-radius: 20px; font-size: 10px; font-weight: 500;
    background: rgba(210,153,34,0.12); color: ${THEME.color.yellow}; border: 1px solid rgba(210,153,34,0.3);
    white-space: nowrap; flex-shrink: 0;
  }
  .ticket-link {
    text-decoration: none; cursor: pointer;
    transition: background 0.12s, border-color 0.12s;
  }
  .ticket-link::before { content: '🎫 '; font-size: 9px; }
  .ticket-link:hover { background: rgba(210,153,34,0.22); border-color: rgba(210,153,34,0.55); color: ${THEME.color.yellowLight}; }
  .ticket-badge::before { content: '🎫 '; font-size: 9px; }
  .btn-icon {
    padding: 3px 8px; border: none; border-radius: 6px; cursor: pointer;
    font-size: 11px; background: ${THEME.color.border}; color: ${THEME.color.textSecondary};
    transition: background 0.15s, color 0.12s;
  }
  .btn-icon:hover { background: ${THEME.color.borderHover}; color: ${THEME.color.textPrimary}; }
  .btn-del:hover  { background: rgba(248,81,73,0.15); color: ${THEME.color.red}; }
  input[type="checkbox"] {
    width: 14px; height: 14px; accent-color: ${THEME.color.blue}; cursor: pointer; flex-shrink: 0;
  }
  .row-body {
    background: ${THEME.color.bgInput}; padding: 10px 14px;
    border-top: 1px solid ${THEME.color.border};
  }
  .test-notes {
    margin: 0 0 10px; padding: 8px 12px;
    background: rgba(47,129,247,0.06); border-left: 3px solid rgba(47,129,247,0.4);
    border-radius: 0 6px 6px 0; font-size: 12px; color: ${THEME.color.textSecondary};
    line-height: 1.6; white-space: pre-wrap; word-break: break-word;
  }
  .code-preview {
    margin: 0; padding: 10px 12px; background: ${THEME.color.bgCard};
    border-radius: 6px; border: 1px solid ${THEME.color.border};
    font-size: 11px; color: ${THEME.color.textBody}; line-height: 1.7;
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    overflow-x: auto; white-space: pre;
  }
  ${scrollbar('.code-preview')}
  .code-preview-icp { margin-top: 8px; }
  .ticket-group { margin-bottom: 8px; }
  .ticket-group-header {
    padding: 4px 10px; margin-bottom: 4px;
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px;
    color: ${THEME.color.yellow}; border-left: 3px solid rgba(210,153,34,0.5);
    background: rgba(210,153,34,0.06); border-radius: 0 4px 4px 0;
  }
  .sh-kw  { color: ${THEME.color.shKeyword}; }
  .sh-bi  { color: ${THEME.color.shBuiltin}; }
  .sh-str { color: ${THEME.color.shString}; }
  .sh-cmt { color: ${THEME.color.textSecondary}; font-style: italic; }
  .sh-num { color: ${THEME.color.shNumber}; }
`;
