export const SELECTOR_PICKER_STYLES = `
  :host {
    position: fixed;
    z-index: 2147483647;
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
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 10px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    min-width: 420px;
    max-width: 600px;
    font-family: 'Segoe UI', system-ui, sans-serif;
    color: #e6edf3;
    font-size: 13px;
  }

  .header {
    padding: 12px 16px 8px;
    border-bottom: 1px solid #21262d;
    font-weight: 600;
    font-size: 13px;
    color: #8b949e;
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
    background: #21262d;
  }

  .row.selected {
    outline: 2px solid #388bfd;
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

  .badge-excellent { background: #238636; }
  .badge-good      { background: #1f6feb; }
  .badge-acceptable{ background: #9e6a03; }
  .badge-poor      { background: #da3633; }

  .tag-name {
    font-family: monospace;
    font-size: 12px;
    color: #8b949e;
    flex-shrink: 0;
  }

  .attr-value {
    font-family: monospace;
    font-size: 12px;
    color: #c9d1d9;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .selector-preview {
    font-family: monospace;
    font-size: 11px;
    color: #58a6ff;
    flex-shrink: 0;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .poor-warning {
    font-size: 10px;
    color: #f85149;
    margin-left: auto;
  }

  .footer {
    padding: 8px 14px 10px;
    border-top: 1px solid #21262d;
    display: flex;
    gap: 16px;
    font-size: 11px;
    color: #484f58;
  }

  .hint kbd {
    background: #21262d;
    border: 1px solid #30363d;
    border-radius: 3px;
    padding: 1px 5px;
    font-size: 10px;
    color: #8b949e;
  }
`;
