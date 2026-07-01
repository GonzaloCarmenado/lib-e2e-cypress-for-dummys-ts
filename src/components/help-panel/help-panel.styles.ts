export const HELP_PANEL_STYLES = `
  :host { display: block; }
  *, *::before, *::after { box-sizing: border-box; }

  .help-panel {
    max-height: 60vh;
    overflow-y: auto;
    padding: 4px 6px 8px;
    color: #c9d1d9;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    line-height: 1.55;
  }

  .help-intro {
    margin: 0 0 12px;
    color: #8b949e;
    font-size: 12px;
  }

  .help-sec { margin: 0 0 14px; }

  .help-sec-hd {
    margin: 0 0 6px;
    font-size: 12px;
    font-weight: 700;
    color: #e6edf3;
    letter-spacing: .3px;
    border-bottom: 1px solid #21262d;
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
    color: #c9d1d9;
  }

  .help-list li::before {
    content: '·';
    position: absolute;
    left: 3px;
    color: #2f81f7;
    font-weight: 700;
  }
`;
