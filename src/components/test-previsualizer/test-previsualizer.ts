import { translationService, type TranslationService } from '../../services/translation.service';
import { TEST_PREVISUALIZER_STYLES } from './test-previsualizer.styles';
import { renderTestPrevisualizer } from './test-previsualizer.template';

export class TestPrevisualizerElement extends HTMLElement {
  private shadow: ShadowRoot;
  private _commands: string[] = [];
  private _interceptors: string[] = [];
  private _showInterceptors = false;
  editable = false;
  translation: TranslationService = translationService;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.render();
  }

  get commands(): string[] {
    return this._commands;
  }
  set commands(v: string[]) {
    this._commands = v;
    this.render();
  }

  get interceptors(): string[] {
    return this._interceptors;
  }
  set interceptors(v: string[]) {
    this._interceptors = v;
    this.render();
  }

  get showInterceptors(): boolean {
    return this._showInterceptors;
  }

  toggleInterceptors(): void {
    this._showInterceptors = !this._showInterceptors;
    this.render();
  }

  copyToClipboard(): void {
    const text = this._commands.join('\n');
    if (!text) return;
    navigator.clipboard?.writeText(text);
  }

  copyInterceptorsToClipboard(): void {
    const text = this._interceptors.join('\n');
    if (!text) return;
    navigator.clipboard?.writeText(text);
  }

  private t(key: string): string { return this.translation.translate(key); }

  private dispatchDelete(index: number): void {
    this.dispatchEvent(new CustomEvent('deletecommand', { detail: index, bubbles: true, composed: true }));
  }

  private dispatchMove(from: number, to: number): void {
    this.dispatchEvent(new CustomEvent('movecommand', { detail: { from, to }, bubbles: true, composed: true }));
  }

  private dispatchDeleteInterceptor(index: number): void {
    this.dispatchEvent(new CustomEvent('deleteinterceptor', { detail: index, bubbles: true, composed: true }));
  }

  private render(): void {
    this.shadow.innerHTML = `<style>${TEST_PREVISUALIZER_STYLES}</style>${renderTestPrevisualizer(
      this._commands,
      this._interceptors,
      this._showInterceptors,
      this.editable,
      this.t.bind(this),
    )}`;

    const cmdsEl = this.shadow.querySelector<HTMLElement>('[data-ref="cmds"]');
    if (cmdsEl) cmdsEl.scrollTop = cmdsEl.scrollHeight;

    this.shadow.querySelector('[data-action="copy"]')?.addEventListener('click', () => this.copyToClipboard());
    this.shadow.querySelector('[data-action="toggle-icp"]')?.addEventListener('click', () => this.toggleInterceptors());
    this.shadow.querySelector('[data-action="copy-icp"]')?.addEventListener('click', () => this.copyInterceptorsToClipboard());

    if (this.editable) {
      this.shadow.querySelectorAll('[data-del]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.dispatchDelete(Number((btn as HTMLElement).dataset['del']));
        });
      });
      this.shadow.querySelectorAll('[data-move-up]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = Number((btn as HTMLElement).dataset['moveUp']);
          this.dispatchMove(idx, idx - 1);
        });
      });
      this.shadow.querySelectorAll('[data-move-dn]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = Number((btn as HTMLElement).dataset['moveDn']);
          this.dispatchMove(idx, idx + 1);
        });
      });
      this.shadow.querySelectorAll('[data-del-icp]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.dispatchDeleteInterceptor(Number((btn as HTMLElement).dataset['delIcp']));
        });
      });
    }
  }
}

if (!customElements.get('test-previsualizer')) {
  customElements.define('test-previsualizer', TestPrevisualizerElement);
}
