import { PersistenceService } from '../services/persistence.service';
import type { TestWithDetails } from '../services/persistence.service';

const STYLES = `
  :host { display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e6edf3; }
  * { box-sizing: border-box; }
  .list { padding: 8px; max-height: 380px; overflow-y: auto;
          scrollbar-width: thin; scrollbar-color: #30363d transparent; }
  .list::-webkit-scrollbar { width: 4px; }
  .list::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; }
  .empty { color: #484f58; text-align: center; padding: 32px; font-size: 13px; }
  .row {
    background: #0d1117; border-radius: 8px; margin-bottom: 6px;
    overflow: hidden; border: 1px solid #21262d;
    transition: border-color 0.15s;
  }
  .row:hover { border-color: #30363d; }
  .row-header {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 12px; cursor: pointer; user-select: none;
  }
  .row-header:hover { background: rgba(48,54,61,0.3); }
  .test-name { flex: 1; font-size: 13px; font-weight: 500; color: #e6edf3; }
  .test-date { font-size: 10.5px; color: #484f58; margin-right: 4px; }
  .btn-icon {
    padding: 3px 8px; border: none; border-radius: 6px; cursor: pointer;
    font-size: 11px; background: #21262d; color: #8b949e;
    transition: background 0.15s, color 0.12s;
  }
  .btn-icon:hover { background: #30363d; color: #e6edf3; }
  .btn-del:hover  { background: rgba(248,81,73,0.15); color: #f85149; }
  .row-body {
    background: #0d1117; padding: 10px 14px;
    border-top: 1px solid #21262d;
  }
  .section-title { font-size: 10px; color: #484f58; text-transform: uppercase;
                   letter-spacing: 0.8px; margin-bottom: 6px; font-weight: 600; }
  .cmd-list { font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
              font-size: 11px; color: #c9d1d9; line-height: 1.8; }
  .icp-list { font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
              font-size: 11px; color: #3fb950; line-height: 1.8; margin-top: 10px; }
  .copy-row { display: flex; gap: 6px; margin-top: 10px; }
`;

export class TestEditorElement extends HTMLElement {
  private shadow: ShadowRoot;
  persistence!: PersistenceService;
  tests: TestWithDetails[] = [];
  expandedIndex: number | null = null;
  interceptorsByTest: Record<number, string[]> = {};

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    if (!this.persistence) this.persistence = new PersistenceService();
    this.loadTests();
  }

  async loadTests(): Promise<void> {
    this.tests = await this.persistence.getAllTests();
    this.render();
  }

  async deleteTest(id: number): Promise<void> {
    await this.persistence.deleteTest(id);
    await this.loadTests();
  }

  toggleExpand(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
    if (this.expandedIndex !== null) {
      const test = this.tests[this.expandedIndex];
      if (test?.id && !this.interceptorsByTest[test.id]) {
        this.interceptorsByTest[test.id] = Array.isArray(test.interceptors) ? test.interceptors : [];
      }
    }
    this.render();
  }

  hasInterceptors(testId: number): boolean {
    return Array.isArray(this.interceptorsByTest[testId]) && this.interceptorsByTest[testId].length > 0;
  }

  copyToClipboard(text: string): void {
    navigator.clipboard?.writeText(text);
  }

  private render(): void {
    const rows = this.tests.map((t, i) => {
      const expanded = this.expandedIndex === i;
      const date = new Date(t.createdAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      const icps = this.interceptorsByTest[t.id] ?? t.interceptors ?? [];
      const body = expanded ? `
        <div class="row-body">
          <div class="section-title">Comandos (${(t.commands ?? []).length})</div>
          <div class="cmd-list">${(t.commands ?? []).map(escHtml).join('<br>')}</div>
          ${icps.length ? `<div class="icp-list">
            <div class="section-title" style="margin-top:8px">Interceptores</div>
            ${icps.map(escHtml).join('<br>')}
          </div>` : ''}
          <div class="copy-row">
            <button class="btn-icon" data-action="copy-cmds" data-idx="${i}">📋 Copiar comandos</button>
            ${icps.length ? `<button class="btn-icon" data-action="copy-icps" data-idx="${i}">📋 Copiar interceptores</button>` : ''}
          </div>
        </div>` : '';
      return `
        <div class="row">
          <div class="row-header" data-action="expand" data-idx="${i}">
            <span class="test-name">${escHtml(t.name)}</span>
            <span class="test-date">${date}</span>
            <button class="btn-icon btn-del" data-action="delete" data-id="${t.id}" title="Eliminar">🗑</button>
          </div>
          ${body}
        </div>`;
    }).join('');

    this.shadow.innerHTML = `
      <style>${STYLES}</style>
      <div class="list">
        ${this.tests.length ? rows : '<div class="empty">No hay tests guardados</div>'}
      </div>`;

    this.shadow.querySelectorAll('[data-action="expand"]').forEach((el) => {
      el.addEventListener('click', () => this.toggleExpand(Number((el as HTMLElement).dataset['idx'])));
    });
    this.shadow.querySelectorAll('[data-action="delete"]').forEach((el) => {
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this.deleteTest(Number((el as HTMLElement).dataset['id']));
      });
    });
    this.shadow.querySelectorAll('[data-action="copy-cmds"]').forEach((el) => {
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const idx = Number((el as HTMLElement).dataset['idx']);
        this.copyToClipboard((this.tests[idx]?.commands ?? []).join('\n'));
      });
    });
    this.shadow.querySelectorAll('[data-action="copy-icps"]').forEach((el) => {
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const idx = Number((el as HTMLElement).dataset['idx']);
        const t = this.tests[idx];
        this.copyToClipboard((this.interceptorsByTest[t?.id] ?? []).join('\n'));
      });
    });
  }
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

if (!customElements.get('test-editor')) {
  customElements.define('test-editor', TestEditorElement);
}
