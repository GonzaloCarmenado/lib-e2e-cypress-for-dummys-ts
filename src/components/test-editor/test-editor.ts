import { PersistenceService } from '../../services/persistence.service';
import type { TestWithDetails } from '../../services/persistence.service';
import { localeForLang } from '../../models/lang.model';
import { escapeSingleQuotes } from '../../utils/code-format.utils';
import { DEFAULT_ISSUE_TRACKER_CONFIG, type IssueTrackerConfig } from '../../models/issue-tracker.model';
import { TEST_EDITOR_STYLES } from './test-editor.styles';
import { renderTestEditor } from './test-editor.template';
import { BaseElement } from '../base.element';

/**
 * `<lib-e2e-test-editor>` custom element — lists all saved Cypress tests stored
 * in IndexedDB and provides expand, tag-filter, select, and export controls.
 *
 * Supports grouping by ticket, multi-select export modes (`all`, `manual`,
 * `tags`), and configurable issue-tracker URL linking.
 */
export class TestEditorElement extends BaseElement {
  persistence!: PersistenceService;
  tests: TestWithDetails[] = [];
  expandedIndex: number | null = null;
  interceptorsByTest: Record<number, string[]> = {};
  activeTag: string | null = null;
  selectMode = false;
  selectedIds: Set<number> = new Set();
  describeName = '';
  groupByTicket = false;
  issueTrackerConfig: IssueTrackerConfig = { ...DEFAULT_ISSUE_TRACKER_CONFIG };

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

  toggleGroupByTicket(): void {
    this.groupByTicket = !this.groupByTicket;
    this.render();
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
      ? `  beforeEach(() => {\n    // Auto-generated Cypress interceptors\n    ${allInterceptors.join('\n    ')}\n  });\n\n`
      : '';

    const itBlocks = selected
      .map((t) => {
        const cmds = (t.commands ?? []).map((c) => `    ${c}`).join('\n');
        return `  it('${escapeSingleQuotes(t.name ?? '')}', () => {\n${cmds}\n  });`;
      })
      .join('\n\n');

    const block = `describe('${escapeSingleQuotes(name)}', () => {\n${beforeEach}${itBlocks}\n});`;
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
    const tag = this.activeTag;
    if (!tag) return this.tests;
    return this.tests.filter((t) => (t.tags ?? []).includes(tag));
  }

  private render(): void {
    const tags = this.allTags;
    const visible = this.visibleTests;
    const selectedVisible = visible.filter((t) => this.selectedIds.has(t.id));

    this.shadow.innerHTML = `<style>${TEST_EDITOR_STYLES}</style>${renderTestEditor({
      tags,
      visible,
      selectedVisible,
      activeTag: this.activeTag,
      selectMode: this.selectMode,
      selectedIds: this.selectedIds,
      describeName: this.describeName,
      expandedIndex: this.expandedIndex,
      interceptorsByTest: this.interceptorsByTest,
      locale: localeForLang(this.translation.getLang()),
      groupByTicket: this.groupByTicket,
      issueTrackerConfig: this.issueTrackerConfig,
    }, this.t.bind(this))}`;

    this.shadow.getElementById('btn-group-ticket')?.addEventListener('click', () => this.toggleGroupByTicket());
    this.shadow.getElementById('btn-select-mode')?.addEventListener('click', () => this.toggleSelectMode());

    this.shadow.querySelectorAll('[data-filter-tag]').forEach((el) => {
      el.addEventListener('click', () => {
        const tag = (el as HTMLElement).dataset['filterTag'] ?? '';
        if (!tag) return;
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
        this.copyToClipboard((this.interceptorsByTest[t?.id] ?? t?.interceptors ?? []).join('\n'));
      });
    });
  }
}

if (!customElements.get('lib-e2e-test-editor')) {
  customElements.define('lib-e2e-test-editor', TestEditorElement);
}
