import { THEME } from '../../utils/theme';

export const SAVE_TEST_STYLES = `
  :host { display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${THEME.color.textPrimary}; }
  * { box-sizing: border-box; }
  .container { padding: 24px 28px; text-align: left; }
  .btn-row { text-align: center; }
  p { margin: 0 0 20px; font-size: 14px; color: ${THEME.color.textSecondary}; line-height: 1.5; }
  .btn-row { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 16px; }
  button {
    padding: 7px 16px; border: 1px solid ${THEME.color.borderHover}; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-weight: 500; transition: filter 0.15s, transform 0.1s;
    letter-spacing: 0.1px;
  }
  button:hover { filter: brightness(1.1); }
  button:active { transform: scale(0.97); }
  .btn-primary { background: ${THEME.color.blue}; color: #fff; }
  .btn-success { background: ${THEME.color.greenLight}; color: #fff; }
  .btn-danger  { background: transparent; color: ${THEME.color.red}; border: 1px solid rgba(248,81,73,0.5); }
  .btn-danger:hover { background: rgba(248,81,73,0.08); filter: none; }
  input[type="text"] {
    width: 100%; padding: 10px 14px; border: 1px solid ${THEME.color.borderHover};
    border-radius: 8px; background: ${THEME.color.bgInput}; color: ${THEME.color.textPrimary};
    font-size: 14px; outline: none; margin-bottom: 4px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  input[type="text"]:focus { border-color: ${THEME.color.blue}; box-shadow: 0 0 0 3px rgba(47,129,247,0.15); }
  input[type="text"]::placeholder { color: ${THEME.color.textMuted}; }
  textarea {
    width: 100%; padding: 10px 14px; border: 1px solid ${THEME.color.borderHover};
    border-radius: 8px; background: ${THEME.color.bgInput}; color: ${THEME.color.textPrimary};
    font-size: 14px; outline: none; margin-bottom: 4px;
    font-family: inherit; resize: vertical; line-height: 1.5;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  textarea:focus { border-color: ${THEME.color.blue}; box-shadow: 0 0 0 3px rgba(47,129,247,0.15); }
  textarea::placeholder { color: ${THEME.color.textMuted}; }
  .tag-label {
    font-size: 11px; color: ${THEME.color.textMuted}; text-align: left; margin-bottom: 5px; display: block;
  }
  .tag-input-row { display: flex; gap: 6px; margin-bottom: 8px; }
  .tag-input-row input[type="text"] {
    font-size: 12px; padding: 6px 10px; margin: 0;
  }
  .btn-tag-add {
    padding: 6px 12px; font-size: 12px; background: ${THEME.color.border}; color: ${THEME.color.textSecondary};
    border: 1px solid ${THEME.color.borderHover}; border-radius: 6px; cursor: pointer;
    transition: background 0.15s, color 0.12s; white-space: nowrap; flex-shrink: 0;
  }
  .btn-tag-add:hover { background: ${THEME.color.borderHover}; color: ${THEME.color.textPrimary}; filter: none; }
  .chips { display: flex; flex-wrap: wrap; gap: 5px; min-height: 24px; text-align: left; }
  .chip {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(47,129,247,0.15); color: ${THEME.color.blue};
    border: 1px solid rgba(47,129,247,0.3); border-radius: 20px;
    padding: 2px 10px 2px 10px; font-size: 11px; font-weight: 500;
  }
  .chip-del {
    cursor: pointer; color: ${THEME.color.textSecondary}; font-size: 12px; line-height: 1;
    transition: color 0.12s; padding: 0; background: none; border: none;
  }
  .chip-del:hover { color: ${THEME.color.red}; filter: none; }
  .discard-warn { color: ${THEME.color.textPrimary}; font-size: 13px; margin-bottom: 20px; line-height: 1.5; }
`;
