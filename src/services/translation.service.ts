import { type Lang, isLang } from '../models/lang.model';
import { Subject } from '../utils/subject';
import { I18N_ES } from '../i18n/es';
import { I18N_EN } from '../i18n/en';
import { I18N_FR } from '../i18n/fr';
import { I18N_IT } from '../i18n/it';
import { I18N_DE } from '../i18n/de';

type Translations = typeof I18N_ES;

/**
 * Manages the active UI language and resolves i18n translation keys for all
 * components in the library.
 *
 * Supports five languages: Spanish (`es`), English (`en`), French (`fr`),
 * Italian (`it`), and German (`de`). The active language is stored in a
 * reactive {@link Subject} so components can subscribe and re-render on change.
 */
export class TranslationService {
  private readonly lang$: Subject<Lang>;

  private readonly translations: Record<Lang, Translations> = {
    es: I18N_ES,
    en: I18N_EN,
    fr: I18N_FR,
    it: I18N_IT,
    de: I18N_DE,
  };

  constructor() {
    this.lang$ = new Subject<Lang>(this.detectLang());
  }

  /**
   * Sets the active language, notifying all subscribers.
   *
   * @param lang - One of the supported language codes (`'es'`, `'en'`, `'fr'`, `'it'`, `'de'`).
   */
  setLang(lang: Lang): void {
    this.lang$.next(lang);
  }

  /** Returns the currently active language code. */
  getLang(): Lang {
    return this.lang$.getValue();
  }

  /** Subscribe to language changes; returns an unsubscribe function. */
  onLangChange(fn: (lang: Lang) => void): () => void {
    return this.lang$.subscribe(fn);
  }

  /**
   * Resolves a dot-separated translation key against the current language's
   * translation map. Returns the key itself when the path is not found, so
   * missing translations are visible rather than silent.
   *
   * @param key - A dot-separated path into the translation object
   *              (e.g. `'RECORDER.START_BTN'`).
   * @returns The translated string, or `key` if the path does not exist.
   */
  translate(key: string): string {
    const keys = key.split('.');
    let value: unknown = this.translations[this.lang$.getValue()];
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
      if (value === undefined) return key;
    }
    return value as string;
  }

  /**
   * Detects the best initial language from `navigator.language`. Falls back to
   * `'es'` when the browser language is not one of the supported codes.
   *
   * @returns The detected or default {@link Lang} code.
   */
  detectLang(): Lang {
    const browserLang = navigator.language.split('-')[0];
    return isLang(browserLang) ? browserLang : 'es';
  }
}

/** Shared singleton instance of {@link TranslationService}. */
export const translationService = new TranslationService();
