import { THEME } from '../../utils/theme';

export const HELP_PANEL_STYLES = `
  :host { display: block; }
  *, *::before, *::after { box-sizing: border-box; }

  .help-tabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid ${THEME.color.border};
    margin-bottom: 8px;
  }
  .help-tab {
    appearance: none;
    border: none;
    background: transparent;
    color: ${THEME.color.textSecondary};
    font-size: 12px;
    font-weight: 600;
    padding: 8px 12px;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    transition: color .12s, border-color .12s;
  }
  .help-tab:hover { color: ${THEME.color.textBody}; }
  .help-tab.active { color: ${THEME.color.textPrimary}; border-bottom-color: ${THEME.color.blue}; }

  .help-panel {
    max-height: 60vh;
    overflow-y: auto;
    padding: 4px 6px 8px;
    color: ${THEME.color.textBody};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    line-height: 1.55;
  }

  .help-intro {
    margin: 0 0 12px;
    color: ${THEME.color.textSecondary};
    font-size: 12px;
  }

  .help-sec { margin: 0 0 14px; }

  .help-sec-hd {
    margin: 0 0 6px;
    font-size: 12px;
    font-weight: 700;
    color: ${THEME.color.textPrimary};
    letter-spacing: .3px;
    border-bottom: 1px solid ${THEME.color.border};
    padding-bottom: 4px;
  }

  .help-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .help-list li {
    padding: 3px 0 3px 14px;
    position: relative;
    color: ${THEME.color.textBody};
  }

  .help-list li::before {
    content: '·';
    position: absolute;
    left: 3px;
    color: ${THEME.color.blue};
    font-weight: 700;
  }
`;
