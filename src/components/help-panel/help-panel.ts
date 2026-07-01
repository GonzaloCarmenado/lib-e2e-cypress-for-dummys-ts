import { TranslationService } from '../../services/translation.service';
import { HELP_PANEL_STYLES } from './help-panel.styles';
import { renderHelpPanel } from './help-panel.template';

/**
 * `<help-panel>` — an in-app cheat-sheet of everything the recorder can do
 * (spec 011). Mounted by the recorder inside a modal; content is driven by the
 * HELP.* i18n keys.
 */
export class HelpPanelElement extends HTMLElement {
  private shadow: ShadowRoot;
  translation!: TranslationService;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    if (!this.translation) this.translation = new TranslationService();
    this.render();
  }

  private render(): void {
    this.shadow.innerHTML =
      `<style>${HELP_PANEL_STYLES}</style>${renderHelpPanel(this.translation.translate.bind(this.translation))}`;
  }
}

if (!customElements.get('help-panel')) {
  customElements.define('help-panel', HelpPanelElement);
}
