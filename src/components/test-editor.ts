import { PersistenceService } from '../services/persistence.service';
import type { TestWithDetails } from '../services/persistence.service';
import { translationService, TranslationService } from '../services/translation.service';

const STYLES = `
  :host { display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e6edf3; }
  * { box-sizing: border-box; }
  .toolbar {
    display: flex; align-items: center; gap: 6px; padding: 8px 10px;
    background: #161b22; border-bottom: 1px solid #21262d; flex-wrap: wrap;
  }
  .tag-filter { display: flex; gap: 5px; flex-wrap: wrap; flex: 1; }
  .tag-chip {
    padding: 2px 10px; border-radius: 20px; cursor: pointer; font-size: 11px; font-weight: 500;
    border: 1px solid #30363d; background: #21262d; color: #8b949e;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }
  .tag-chip:hover { background: #30363d; color: #e6edf3; }
  .tag-chip.active { background: rgba(47,129,247,0.2); color: #2f81f7; border-color: rgba(47,129,247,0.4); }
  .btn-select {
    padding: 4px 12px; border: 1px solid #30363d; border-radius: 6px; cursor: pointer;
    font-size: 11px; font-weight: 500; background: #21262d; color: #8b949e;
    transition: background 0.12s, color 0.12s; white-space: nowrap; flex-shrink: 0;
  }
  .btn-select:hover { background: #30363d; color: #e6edf3; }
  .btn-select.active { background: rgba(47,129,247,0.15); color: #2f81f7; border-color: rgba(47,129,247,0.3); }
  .describe-bar {
    display: flex; align-items: center; gap: 8px; padding: 8px 10px;
    background: rgba(47,129,247,0.06); border-bottom: 1px solid rgba(47,129,247,0.2);
    flex-wrap: wrap;
  }
  .describe-bar input {
    flex: 1; min-width: 150px; padding: 5px 10px; background: #0d1117;
    border: 1px solid #30363d; border-radius: 6px; color: #e6edf3;
    font-size: 12px; outline: none;
  }
  .describe-bar input:focus { border-color: #2f81f7; }
  .btn-gen-describe {
    padding: 5px 14px; border: 1px solid #2f81f7; border-radius: 6px; cursor: pointer;
    font-size: 11px; font-weight: 500; background: rgba(47,129,247,0.15); color: #2f81f7;
    transition: background 0.12s; white-space: nowrap; flex-shrink: 0;
  }
  .btn-gen-describe:hover { background: rgba(47,129,247,0.25); }
  .selected-count { font-size: 11px; color: #8b949e; }
  .list { padding: 8px; max-height: 340px; overflow-y: auto;
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
  .row.selected-row { border-color: rgba(47,129,247,0.5); }
  .row-header {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 12px; cursor: pointer; user-select: none;
  }
  .row-header:hover { background: rgba(48,54,61,0.3); }
  .test-name { flex: 1; font-size: 13px; font-weight: 500; color: #e6edf3; }
  .test-date { font-size: 10.5px; color: #484f58; margin-right: 4px; }
  .test-tags { display: flex; gap: 4px; margin-right: 4px; }
  .test-tag {
    padding: 1px 7px; border-radius: 20px; font-size: 10px;
    background: rgba(47,129,247,0.1); color: #8b949e; border: 1px solid rgba(47,129,247,0.2);
  }
  .btn-icon {
    padding: 3px 8px; border: none; border-radius: 6px; cursor: pointer;
    font-size: 11px; background: #21262d; color: #8b949e;
    transition: background 0.15s, color 0.12s;
  }
  .btn-icon:hover { background: #30363d; color: #e6edf3; }
  .btn-del:hover  { background: rgba(248,81,73,0.15); color: #f85149; }
  input[type="checkbox"] {
    width: 14px; height: 14px; accent-color: #2f81f7; cursor: pointer; flex-shrink: 0;
  }
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
  translation: TranslationService = translationService;
  tests: TestWithDetails[] = [];
  expandedIndex: number | null = null;
  interceptorsByTest: Record<number, string[]> = {};
  activeTag: string | null = null;
  selectMode = false;
  selectedIds: Set<number> = new Set();
  describeName = '';

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
    this.selectedIds.delete(id);
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

  toggleSelectMode(): void {
    this.selectMode = !this.selectMode;
    if (!this.selectMode) this.selectedIds.clear();
    this.render();
  }

  toggleSelectTest(id: number): void {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
    this.render();
  }

  generateDescribe(): void {
    const selected = this.tests.filter((t) => this.selectedIds.has(t.id));
    if (!selected.length) return;

    const name = this.describeName.trim() || this.t('TEST_EDITOR.DEFAULT_DESCRIBE');

    const allInterceptors = [...new Set(
      selected.flatMap((t) => this.interceptorsByTest[t.id] ?? t.interceptors ?? [])
    )];

    const beforeEach = allInterceptors.length
      ? `  beforeEach(() => {\n    // Interceptores Cypress generados automáticamente\n    ${allInterceptors.join('\n    ')}\n  });\n\n`
      : '';

    const itBlocks = selected
      .map((t) => {
        const cmds = (t.commands ?? []).map((c) => `    ${c}`).join('\n');
        return `  it('${(t.name ?? '').replace(/'/g, "\\'")}', () => {\n${cmds}\n  });`;
      })
      .join('\n\n');

    const block = `describe('${name.replace(/'/g, "\\'")}', () => {\n${beforeEach}${itBlocks}\n});`;
    navigator.clipboard?.writeText(block);
  }

  copyToClipboard(text: string): void {
    navigator.clipboard?.writeText(text);
  }

  get allTags(): string[] {
    const tagSet = new Set<string>();
    this.tests.forEach((t) => (t.tags ?? []).forEach((tag) => tagSet.add(tag)));
    return [...tagSet].sort();
  }

  get visibleTests(): TestWithDetails[] {
    if (!this.activeTag) return this.tests;
    return this.tests.filter((t) => (t.tags ?? []).includes(this.activeTag!));
  }

  private t(key: string): string { return this.translation.translate(key); }

  private render(): void {
    const tags = this.allTags;
    const visible = this.visibleTests;
    const selectedVisible = visible.filter((t) => this.selectedIds.has(t.id));

    const tagFilterHtml = tags.length
      ? `<div class="tag-filter">
          ${tags.map((tag) => `<button class="tag-chip${this.activeTag === tag ? ' active' : ''}" data-filter-tag="${escAttr(tag)}">${escHtml(tag)}</button>`).join('')}
         </div>`
      : `<div class="tag-filter" style="color:#484f58;font-size:11px">${this.t('TEST_EDITOR.NO_TAGS')}</div>`;

    const describeBarHtml = this.selectMode && selectedVisible.length > 0
      ? `<div class="describe-bar">
          <span class="selected-count">${selectedVisible.length} ${selectedVisible.length !== 1 ? this.t('TEST_EDITOR.SELECTED_PLURAL') : this.t('TEST_EDITOR.SELECTED_SINGULAR')}</span>
          <input id="describe-name" type="text" placeholder="${this.t('TEST_EDITOR.DESCRIBE_PLACEHOLDER')}" value="${escAttr(this.describeName)}" />
          <button class="btn-gen-describe" id="btn-gen-describe">${this.t('TEST_EDITOR.COPY_DESCRIBE')}</button>
        </div>`
      : '';

    const rows = visible.map((t, i) => {
      const expanded = this.expandedIndex === i;
      const date = new Date(t.createdAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      const icps = this.interceptorsByTest[t.id] ?? t.interceptors ?? [];
      const tagsHtml = (t.tags ?? []).length
        ? `<span class="test-tags">${(t.tags ?? []).map((tag) => `<span class="test-tag">${escHtml(tag)}</span>`).join('')}</span>`
        : '';
      const checkbox = this.selectMode
        ? `<input type="checkbox" ${this.selectedIds.has(t.id) ? 'checked' : ''} data-select="${t.id}" />`
        : '';
      const body = expanded ? `
        <div class="row-body">
          <div class="section-title">${this.t('TEST_EDITOR.SECTION_COMMANDS')} (${(t.commands ?? []).length})</div>
          <div class="cmd-list">${(t.commands ?? []).map(escHtml).join('<br>')}</div>
          ${icps.length ? `<div class="icp-list">
            <div class="section-title" style="margin-top:8px">${this.t('TEST_EDITOR.SECTION_INTERCEPTORS')}</div>
            ${icps.map(escHtml).join('<br>')}
          </div>` : ''}
          <div class="copy-row">
            <button class="btn-icon" data-action="copy-cmds" data-idx="${i}">${this.t('TEST_EDITOR.COPY_CMDS_BTN')}</button>
            ${icps.length ? `<button class="btn-icon" data-action="copy-icps" data-idx="${i}">${this.t('TEST_EDITOR.COPY_ICPS_BTN')}</button>` : ''}
          </div>
        </div>` : '';
      return `
        <div class="row${this.selectedIds.has(t.id) ? ' selected-row' : ''}">
          <div class="row-header" data-action="expand" data-idx="${i}">
            ${checkbox}
            <span class="test-name">${escHtml(t.name)}</span>
            ${tagsHtml}
            <span class="test-date">${date}</span>
            <button class="btn-icon btn-del" data-action="delete" data-id="${t.id}" title="${this.t('TEST_EDITOR.DELETE_TITLE')}">🗑</button>
          </div>
          ${body}
        </div>`;
    }).join('');

    this.shadow.innerHTML = `
      <style>${STYLES}</style>
      <div class="toolbar">
        ${tagFilterHtml}
        <button class="btn-select${this.selectMode ? ' active' : ''}" id="btn-select-mode">
          ${this.selectMode ? this.t('TEST_EDITOR.CANCEL_SELECT') : this.t('TEST_EDITOR.MULTI_SELECT')}
        </button>
      </div>
      ${describeBarHtml}
      <div class="list">
        ${visible.length ? rows : `<div class="empty">${this.t('TEST_EDITOR.NO_TESTS')}</div>`}
      </div>`;

    this.shadow.getElementById('btn-select-mode')!.addEventListener('click', () => this.toggleSelectMode());

    this.shadow.querySelectorAll('[data-filter-tag]').forEach((el) => {
      el.addEventListener('click', () => {
        const tag = (el as HTMLElement).dataset['filterTag']!;
        this.activeTag = this.activeTag === tag ? null : tag;
        this.render();
      });
    });

    const descInput = this.shadow.getElementById('describe-name') as HTMLInputElement | null;
    if (descInput) {
      descInput.addEventListener('input', () => { this.describeName = descInput.value; });
    }
    this.shadow.getElementById('btn-gen-describe')?.addEventListener('click', () => {
      this.describeName = descInput?.value ?? this.describeName;
      this.generateDescribe();
    });

    this.shadow.querySelectorAll('[data-select]').forEach((el) => {
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this.toggleSelectTest(Number((el as HTMLElement).dataset['select']));
      });
    });

    this.shadow.querySelectorAll('[data-action="expand"]').forEach((el) => {
      el.addEventListener('click', () => {
        if (this.selectMode) {
          const row = visible[Number((el as HTMLElement).dataset['idx'])];
          if (row) this.toggleSelectTest(row.id);
        } else {
          this.toggleExpand(Number((el as HTMLElement).dataset['idx']));
        }
      });
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
        this.copyToClipboard((visible[idx]?.commands ?? []).join('\n'));
      });
    });
    this.shadow.querySelectorAll('[data-action="copy-icps"]').forEach((el) => {
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const idx = Number((el as HTMLElement).dataset['idx']);
        const t = visible[idx];
        this.copyToClipboard((this.interceptorsByTest[t?.id] ?? []).join('\n'));
      });
    });
  }
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

if (!customElements.get('test-editor')) {
  customElements.define('test-editor', TestEditorElement);
}
