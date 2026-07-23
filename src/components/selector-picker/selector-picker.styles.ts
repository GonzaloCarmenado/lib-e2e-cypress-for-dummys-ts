import { THEME } from '../../utils/theme';

export const SELECTOR_PICKER_STYLES = `
  :host {
    position: fixed;
    z-index: ${THEME.zIndex.overlay};
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
  }

  .overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: all;
    background: ${THEME.color.bgCard};
    border: 1px solid ${THEME.color.borderHover};
    border-radius: 10px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    min-width: 420px;
    max-width: 600px;
    font-family: 'Segoe UI', system-ui, sans-serif;
    color: ${THEME.color.textPrimary};
    font-size: 13px;
  }

  .header {
    padding: 12px 16px 8px;
    border-bottom: 1px solid ${THEME.color.border};
    font-weight: 600;
    font-size: 13px;
    color: ${THEME.color.textSecondary};
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .list {
    max-height: 320px;
    overflow-y: auto;
    padding: 6px 0;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 14px;
    cursor: pointer;
    border-radius: 6px;
    margin: 1px 6px;
    transition: background 0.1s;
  }

  .row:hover,
  .row.selected {
    background: ${THEME.color.border};
  }

  .row.selected {
    outline: 2px solid ${THEME.color.blueLight};
    outline-offset: -2px;
  }

  .quality-badge {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
  }

  .badge-excellent { background: ${THEME.color.green}; }
  .badge-good      { background: ${THEME.color.blueDark}; }
  .badge-acceptable{ background: ${THEME.color.yellowDark}; }
  .badge-poor      { background: ${THEME.color.redDark}; }

  .tag-name {
    font-family: monospace;
    font-size: 12px;
    color: ${THEME.color.textSecondary};
    flex-shrink: 0;
  }

  .attr-value {
    font-family: monospace;
    font-size: 12px;
    color: ${THEME.color.textBody};
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .selector-preview {
    font-family: monospace;
    font-size: 11px;
    color: ${THEME.color.shSelector};
    flex-shrink: 0;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .poor-warning {
    font-size: 10px;
    color: ${THEME.color.red};
    margin-left: auto;
  }

  .footer {
    padding: 8px 14px 10px;
    border-top: 1px solid ${THEME.color.border};
    display: flex;
    gap: 16px;
    font-size: 11px;
    color: ${THEME.color.textMuted};
  }

  .hint kbd {
    background: ${THEME.color.border};
    border: 1px solid ${THEME.color.borderHover};
    border-radius: 3px;
    padding: 1px 5px;
    font-size: 10px;
    color: ${THEME.color.textSecondary};
  }
`;
