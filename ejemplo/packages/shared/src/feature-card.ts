/**
 * <feature-card> — wraps a feature demo with title, activation hint, and expected output.
 *
 * Attributes:
 *   name     — feature name (required)
 *   how      — how to activate (shown as bullet list, pipe-separated)
 *   expected — expected Cypress command/output (shown as code block)
 *   shortcut — optional keyboard shortcut badge
 */
class FeatureCard extends HTMLElement {
  connectedCallback() {
    const name     = this.getAttribute('name') ?? '';
    const how      = this.getAttribute('how') ?? '';
    const expected = this.getAttribute('expected') ?? '';
    const shortcut = this.getAttribute('shortcut') ?? '';

    const howItems = how ? how.split('|').map(s => `<li>${s.trim()}</li>`).join('') : '';
    const shortcutBadge = shortcut
      ? `<kbd style="margin-left:8px;font-size:11px">${shortcut}</kbd>`
      : '';

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { display: block; }
        .card {
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 10px;
          padding: 16px 18px;
          margin-bottom: 14px;
        }
        .header {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 12px;
        }
        .title {
          font-size: 13px; font-weight: 700;
          color: #e6edf3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .section-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: .7px; color: #484f58; margin-bottom: 5px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        ul {
          margin: 0 0 10px 16px; padding: 0;
          font-size: 12px; color: #8b949e; line-height: 1.7;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        pre {
          background: #0d1117; border: 1px solid #21262d; border-radius: 6px;
          padding: 8px 12px; font-size: 11px; color: #a5d6ff;
          font-family: 'Cascadia Code','Fira Code','Consolas',monospace;
          overflow-x: auto; white-space: pre; line-height: 1.6; margin: 0;
        }
        kbd {
          background: #21262d; border: 1px solid #30363d; border-radius: 4px;
          padding: 1px 6px; font-family: 'Cascadia Code','Consolas',monospace;
          font-size: 11px; color: #e6edf3;
        }
        .demo { margin-top: 12px; padding-top: 12px; border-top: 1px solid #21262d; }
      </style>
      <div class="card">
        <div class="header">
          <span class="title">${name}</span>${shortcutBadge}
        </div>
        ${howItems ? `<div class="section-label">Cómo activar</div><ul>${howItems}</ul>` : ''}
        ${expected ? `<div class="section-label">Comando Cypress generado</div><pre>${expected}</pre>` : ''}
        <div class="demo"><slot></slot></div>
      </div>`;
  }
}

if (!customElements.get('feature-card')) {
  customElements.define('feature-card', FeatureCard);
}

export {};
