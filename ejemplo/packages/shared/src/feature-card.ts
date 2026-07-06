// Injects card styles into <head> once per page load
function injectStyles() {
  if (document.getElementById('fc-styles')) return;
  const s = document.createElement('style');
  s.id = 'fc-styles';
  s.textContent = `
    feature-card { display: block; margin-bottom: 14px; }
    .fc-card { background:#161b22; border:1px solid #30363d; border-radius:10px; padding:16px 18px; }
    .fc-header { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
    .fc-title { font-size:13px; font-weight:700; color:#e6edf3;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
    .fc-label { font-size:10px; font-weight:700; text-transform:uppercase;
      letter-spacing:.7px; color:#484f58; margin-bottom:5px;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
    .fc-list { margin:0 0 10px 16px; padding:0; font-size:12px; color:#8b949e;
      line-height:1.7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
    .fc-pre { background:#0d1117; border:1px solid #21262d; border-radius:6px;
      padding:8px 12px; font-size:11px; color:#a5d6ff;
      font-family:'Cascadia Code','Fira Code','Consolas',monospace;
      overflow-x:auto; white-space:pre; line-height:1.6; margin:0 0 10px; }
    .fc-demo { margin-top:12px; padding-top:12px; border-top:1px solid #21262d; }
    .fc-kbd { background:#21262d; border:1px solid #30363d; border-radius:4px;
      padding:1px 6px; font-family:'Cascadia Code','Consolas',monospace;
      font-size:11px; color:#e6edf3; margin-left:8px; }
  `;
  document.head.appendChild(s);
}

class FeatureCard extends HTMLElement {
  connectedCallback() {
    injectStyles();

    const name     = this.getAttribute('name') ?? '';
    const how      = this.getAttribute('how') ?? '';
    const expected = this.getAttribute('expected') ?? '';
    const shortcut = this.getAttribute('shortcut') ?? '';

    // Save demo children before wiping innerHTML
    const children = Array.from(this.childNodes);

    const howItems = how
      ? how.split('|').map(s => `<li>${s.trim()}</li>`).join('')
      : '';
    const shortcutBadge = shortcut
      ? `<kbd class="fc-kbd">${shortcut}</kbd>`
      : '';

    this.innerHTML = `
      <div class="fc-card">
        <div class="fc-header">
          <span class="fc-title">${name}</span>${shortcutBadge}
        </div>
        ${howItems ? `<div class="fc-label">Cómo activar</div><ul class="fc-list">${howItems}</ul>` : ''}
        ${expected ? `<div class="fc-label">Comando Cypress generado</div><pre class="fc-pre">${expected}</pre>` : ''}
        <div class="fc-demo"></div>
      </div>`;

    // Re-attach demo children into .fc-demo (real light DOM — no slot issues)
    const demo = this.querySelector('.fc-demo')!;
    children.forEach(child => demo.appendChild(child));
  }
}

if (!customElements.get('feature-card')) {
  customElements.define('feature-card', FeatureCard);
}

export {};
