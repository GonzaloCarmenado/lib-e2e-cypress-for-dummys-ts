import { PersistenceService } from '../services/persistence.service';
import type { TestWithDetails } from '../services/persistence.service';

const STYLES = `
  :host { display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #fff; }
  * { box-sizing: border-box; }
  .list { padding: 10px 12px; max-height: 380px; overflow-y: auto;
          scrollbar-width: thin; scrollbar-color: #1976d2 #1e2535; }
  .empty { color: #6c7a99; text-align: center; padding: 24px; font-size: 13px; }
  .row {
    background: #1e2535; border-radius: 8px; margin-bottom: 8px;
    overflow: hidden; border: 1px solid #2a3245;
  }
  .row-header {
    display: flex; align-items: center; gap: 8px;
    padding: 9px 12px; cursor: pointer;
  }
  .row-header:hover { background: #252f45; }
  .test-name { flex: 1; font-size: 13px; font-weight: 500; }
  .test-date { font-size: 10px; color: #6c7a99; margin-right: 6px; }
  .btn-icon {
    padding: 3px 8px; border: none; border-radius: 5px; cursor: pointer;
    font-size: 11px; background: #2a3245; color: #adb5d0;
    transition: background 0.15s;
  }
  .btn-icon:hover { background: #1976d2; color: #fff; }
  .btn-del:hover  { background: #d32f2f; color: #fff; }
  .row-body {
    background: #0d1117; padding: 10px 12px;
    border-top: 1px solid #2a3245;
  }
  .section-title { font-size: 10px; color: #6c7a99; text-transform: uppercase;
                   letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 700; }
  .cmd-list { font-family: monospace; font-size: 11.5px; color: #c9d1d9; line-height: 1.6; }
  .icp-list { font-family: monospace; font-size: 11.5px; color: #82b366; line-height: 1.6;
              margin-top: 8px; }
  .copy-row { display: flex; gap: 6px; margin-top: 8px; }
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
      el.addEventListener('click', () => this.toggleExpand(Number((el as HTMLElement).dataset.idx)));
    });
    this.shadow.querySelectorAll('[data-action="delete"]').forEach((el) => {
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this.deleteTest(Number((el as HTMLElement).dataset.id));
      });
    });
    this.shadow.querySelectorAll('[data-action="copy-cmds"]').forEach((el) => {
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const idx = Number((el as HTMLElement).dataset.idx);
        this.copyToClipboard((this.tests[idx]?.commands ?? []).join('\n'));
      });
    });
    this.shadow.querySelectorAll('[data-action="copy-icps"]').forEach((el) => {
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const idx = Number((el as HTMLElement).dataset.idx);
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
