import type { RecordingService } from '../../services/recording.service';
import type { TranslationService } from '../../services/translation.service';
import { describePickerRow, type PickerRow } from '../../utils/selector-quality.utils';
import { escapeSingleQuotes } from '../../utils/code-format.utils';
import { SELECTOR_PICKER_STYLES } from './selector-picker.styles';
import { renderPicker } from './selector-picker.template';

const OWN_DATA_CY = 'lib-e2e-cypress-for-dummys';
const MAX_ANCESTORS = 10;

export class SelectorPickerElement extends HTMLElement {
  targetElement: HTMLElement | null = null;
  recording!: RecordingService;
  translation!: TranslationService;

  private shadow: ShadowRoot;
  private ancestors: HTMLElement[] = [];
  private rows: PickerRow[] = [];
  private selectedIndex = 0;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private unsubRecording: (() => void) | null = null;
  private unsubPause: (() => void) | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.setAttribute('data-cy', 'lib-e2e-cypress-for-dummys');
    this.ancestors = this.buildAncestors();
    this.rows = this.ancestors.map(describePickerRow);
    this.selectedIndex = this.findBestIndex();
    this.render();
    this.attachKeyListener();
    this.attachRowClickListeners();
    this.subscribeToRecordingChanges();
  }

  disconnectedCallback(): void {
    this.detachKeyListener();
    this.unsubRecording?.();
    this.unsubPause?.();
  }

  private t(key: string): string {
    return this.translation?.translate(key) ?? key;
  }

  // ── Ancestor chain ──────────────────────────────────────────────────────────

  private buildAncestors(): HTMLElement[] {
    const chain: HTMLElement[] = [];
    let current: HTMLElement | null = this.targetElement;

    while (current && current.tagName.toLowerCase() !== 'html' && chain.length < MAX_ANCESTORS) {
      if (current.getAttribute('data-cy') === OWN_DATA_CY) {
        current = current.parentElement;
        continue;
      }
      chain.push(current);
      current = current.parentElement;
    }

    return chain;
  }

  private findBestIndex(): number {
    for (let i = 0; i < this.rows.length; i++) {
      const q = this.rows[i].quality;
      if (q === 'excellent' || q === 'good' || q === 'acceptable') return i;
    }
    return 0;
  }

  // ── Rendering ───────────────────────────────────────────────────────────────

  private render(): void {
    this.shadow.innerHTML = `<style>${SELECTOR_PICKER_STYLES}</style>${renderPicker(
      this.rows,
      this.selectedIndex,
      this.t.bind(this),
    )}`;
  }

  // ── Keyboard ────────────────────────────────────────────────────────────────

  private attachKeyListener(): void {
    this.keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.stopPropagation();
        e.preventDefault();
        this.selectedIndex = (this.selectedIndex + 1) % this.ancestors.length;
        this.render();
        this.attachRowClickListeners();
      } else if (e.key === 'ArrowUp') {
        e.stopPropagation();
        e.preventDefault();
        this.selectedIndex = (this.selectedIndex - 1 + this.ancestors.length) % this.ancestors.length;
        this.render();
        this.attachRowClickListeners();
      } else if (e.key === 'Enter') {
        e.stopPropagation();
        this.confirm(this.selectedIndex);
      } else if (e.key === 'Escape') {
        e.stopPropagation();
        this.cancel();
      }
    };
    window.addEventListener('keydown', this.keyHandler, { capture: true });
  }

  private detachKeyListener(): void {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler, { capture: true });
      this.keyHandler = null;
    }
  }

  // ── Row click listeners ─────────────────────────────────────────────────────

  private attachRowClickListeners(): void {
    this.shadow.querySelectorAll('[data-idx]').forEach((row) => {
      (row as HTMLElement).addEventListener('click', () => {
        const idx = parseInt((row as HTMLElement).dataset['idx'] ?? '0', 10);
        this.confirm(idx);
      });
    });
  }

  // ── Recording auto-close ────────────────────────────────────────────────────

  private subscribeToRecordingChanges(): void {
    this.unsubRecording = this.recording.onRecordingChange((isRecording) => {
      if (!isRecording) this.closeSilently();
    });
    this.unsubPause = this.recording.onPauseChange((isPaused) => {
      if (isPaused) this.closeSilently();
    });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  private confirm(index: number): void {
    const row = this.rows[index];
    if (!row) return;
    const command = `cy.get('${escapeSingleQuotes(row.selector)}').click()`;
    this.recording.appendCommand(command);
    this.dispatchEvent(new CustomEvent('selectorchosen', { detail: command, bubbles: true, composed: true }));
    this.closeSilently();
  }

  private cancel(): void {
    this.dispatchEvent(new CustomEvent('pickercancelled', { bubbles: true, composed: true }));
    this.closeSilently();
  }

  private closeSilently(): void {
    this.detachKeyListener();
    this.unsubRecording?.();
    this.unsubPause?.();
    this.unsubRecording = null;
    this.unsubPause = null;
    this.remove();
  }
}

if (!customElements.get('lib-e2e-selector-picker')) {
  customElements.define('lib-e2e-selector-picker', SelectorPickerElement);
}
