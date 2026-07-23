import { TranslationService } from '../../services/translation.service';
import { HELP_PANEL_STYLES } from './help-panel.styles';
import { renderHelpPanel, type HelpTab } from './help-panel.template';
import { BaseElement } from '../base.element';

/**
 * `<help-panel>` — an in-app guide (spec 011). Two tabs: a quick reference
 * cheat-sheet and a verbose usage guide (workflow + coverage). Content is driven
 * by the HELP.* i18n keys.
 */
export class HelpPanelElement extends BaseElement {
  private activeTab: HelpTab = 'reference';

  connectedCallback(): void {
    if (!this.translation) this.translation = new TranslationService();
    this.render();
  }

  private render(): void {
    this.shadow.innerHTML =
      `<style>${HELP_PANEL_STYLES}</style>${renderHelpPanel(this.translation.translate.bind(this.translation), this.activeTab)}`;
    this.shadow.querySelectorAll<HTMLElement>('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.activeTab = (btn.dataset['tab'] as HelpTab) ?? 'reference';
        this.render();
      });
    });
  }
}

if (!customElements.get('lib-e2e-help-panel')) {
  customElements.define('lib-e2e-help-panel', HelpPanelElement);
}
