export interface FcOpts {
  name: string;
  how: string;
  expected?: string;
  shortcut?: string;
}

export function injectFcStyles(): void {
  if (document.getElementById('fc-styles')) return;
  const s = document.createElement('style');
  s.id = 'fc-styles';
  s.textContent = `
    .fc-card{background:#161b22;border:1px solid #30363d;border-radius:10px;padding:16px 18px;margin-bottom:14px}
    .fc-header{display:flex;align-items:center;gap:8px;margin-bottom:12px}
    .fc-title{font-size:13px;font-weight:700;color:#e6edf3;font-family:-apple-system,sans-serif}
    .fc-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:#484f58;margin-bottom:5px;font-family:-apple-system,sans-serif}
    .fc-list{margin:0 0 10px 16px;padding:0;font-size:12px;color:#8b949e;line-height:1.7;font-family:-apple-system,sans-serif}
    .fc-pre{background:#0d1117;border:1px solid #21262d;border-radius:6px;padding:8px 12px;font-size:11px;color:#a5d6ff;font-family:'Cascadia Code','Consolas',monospace;overflow-x:auto;white-space:pre;line-height:1.6;margin:0 0 10px}
    .fc-demo{margin-top:12px;padding-top:12px;border-top:1px solid #21262d}
    .fc-kbd{background:#21262d;border:1px solid #30363d;border-radius:4px;padding:1px 6px;font-family:'Cascadia Code',monospace;font-size:11px;color:#e6edf3;margin-left:8px}
  `;
  document.head.appendChild(s);
}

export function fc(opts: FcOpts, content: string): string {
  const items = opts.how.split('|').map(s => `<li>${s.trim()}</li>`).join('');
  const badge = opts.shortcut ? `<kbd class="fc-kbd">${opts.shortcut}</kbd>` : '';
  const expected = opts.expected
    ? `<div class="fc-label">Comando Cypress generado</div><pre class="fc-pre">${opts.expected}</pre>`
    : '';
  return `<div class="fc-card">
    <div class="fc-header"><span class="fc-title">${opts.name}</span>${badge}</div>
    <div class="fc-label">Cómo activar</div><ul class="fc-list">${items}</ul>
    ${expected}
    <div class="fc-demo">${content}</div>
  </div>`;
}
