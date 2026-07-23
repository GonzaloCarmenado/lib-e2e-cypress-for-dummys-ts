import { translationService, type TranslationService } from '../services/translation.service';

/**
 * Abstract base class for all lib-e2e custom elements.
 *
 * Centralises the three pieces of boilerplate that every component repeats:
 * - Shadow DOM attachment (open mode).
 * - The `translation` property (defaults to the global singleton; injectable for tests).
 * - The `t()` shorthand for translating i18n keys.
 *
 * @example
 * ```ts
 * export class MyElement extends BaseElement {
 *   connectedCallback() {
 *     this.shadow.innerHTML = `<p>${this.t('MY.KEY')}</p>`;
 *   }
 * }
 * ```
 */
export abstract class BaseElement extends HTMLElement {
  /** Attached shadow root (open mode). Available from the constructor onwards. */
  protected shadow: ShadowRoot;

  /**
   * Translation service instance.
   * Defaults to the global singleton; override for isolated unit tests.
   */
  translation: TranslationService = translationService;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  /**
   * Returns the localised string for an i18n key.
   * Falls back to the raw key when the service is unavailable (e.g. in tests).
   *
   * @param key - Dot-separated translation key (e.g. `'PICKER.TITLE'`).
   * @returns Translated string, or the key itself if no translation is found.
   */
  protected t(key: string): string {
    return this.translation?.translate(key) ?? key;
  }
}
