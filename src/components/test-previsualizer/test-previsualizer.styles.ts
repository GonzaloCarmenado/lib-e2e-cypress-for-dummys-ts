import { THEME, scrollbar } from '../../utils/theme';

export const TEST_PREVISUALIZER_STYLES = `
  :host { display: flex; flex-direction: column; flex: 1; min-height: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${THEME.color.textPrimary}; overflow: hidden; }
  * { box-sizing: border-box; }
  .toolbar {
    display: flex; gap: 6px; padding: 10px 12px; flex-shrink: 0;
    background: ${THEME.color.bgCard}; border-bottom: 1px solid ${THEME.color.border};
  }
  button {
    padding: 5px 12px; border: none; border-radius: 6px; cursor: pointer;
    font-size: 11px; font-weight: 500; background: ${THEME.color.border}; color: ${THEME.color.textSecondary};
    transition: background 0.15s, color 0.12s; letter-spacing: 0.1px;
  }
  button:hover { background: ${THEME.color.borderHover}; color: ${THEME.color.textPrimary}; }
  button.active { background: ${THEME.color.blue}; color: #fff; }
  .section { padding: 10px 12px; flex-shrink: 0; }
  .section.section-cmds { flex: 1; min-height: 0; display: flex; flex-direction: column; }
  .section-title {
    font-size: 10px; font-weight: 600; color: ${THEME.color.textMuted}; text-transform: uppercase;
    letter-spacing: 0.8px; margin-bottom: 7px; flex-shrink: 0;
  }
  .list {
    overflow-y: auto; background: ${THEME.color.bgInput};
    border-radius: 8px; padding: 6px 8px;
    border: 1px solid ${THEME.color.border};
  }
  .section-cmds .list { flex: 1; min-height: 0; }
  ${scrollbar('.list')}
  .item {
    display: flex; align-items: flex-start; gap: 6px;
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace; font-size: 11px;
    color: ${THEME.color.textBody}; padding: 4px 8px; border-radius: 4px;
    word-break: break-all; line-height: 1.65;
    border-left: 2px solid transparent;
    transition: background 0.1s, border-color 0.1s;
  }
  .item:hover { background: ${THEME.color.bgCard}; border-left-color: ${THEME.color.blue}; }
  .cmd-text { flex: 1; }
  .item-actions {
    display: flex; gap: 3px; flex-shrink: 0;
    opacity: 0; transition: opacity 0.15s;
  }
  .item:hover .item-actions { opacity: 1; }
  .btn-step {
    width: 20px; height: 20px; border: none; border-radius: 3px; cursor: pointer;
    font-size: 12px; background: transparent; color: ${THEME.color.textMuted};
    transition: background 0.12s, color 0.12s;
    display: flex; align-items: center; justify-content: center;
    padding: 0; line-height: 1;
  }
  .btn-step:hover { background: ${THEME.color.borderHover}; color: ${THEME.color.textPrimary}; }
  .btn-step-del:hover { background: rgba(248,81,73,0.15); color: ${THEME.color.red}; }
  .empty { color: ${THEME.color.textMuted}; font-size: 12px; padding: 20px 8px; text-align: center; }
`;
