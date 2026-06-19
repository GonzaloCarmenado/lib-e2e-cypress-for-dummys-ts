import { type Lang, isLang } from '../models/lang.model';
import { Subject } from '../utils/subject';
import { I18N_ES } from '../i18n/es';
import { I18N_EN } from '../i18n/en';
import { I18N_FR } from '../i18n/fr';
import { I18N_IT } from '../i18n/it';
import { I18N_DE } from '../i18n/de';

type Translations = typeof I18N_ES;

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

  setLang(lang: Lang): void {
    this.lang$.next(lang);
  }

  getLang(): Lang {
    return this.lang$.getValue();
  }

  /** Subscribe to language changes; returns an unsubscribe function. */
  onLangChange(fn: (lang: Lang) => void): () => void {
    return this.lang$.subscribe(fn);
  }

  translate(key: string): string {
    const keys = key.split('.');
    let value: unknown = this.translations[this.lang$.getValue()];
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
      if (value === undefined) return key;
    }
    return value as string;
  }

  detectLang(): Lang {
    const browserLang = navigator.language.split('-')[0];
    return isLang(browserLang) ? browserLang : 'es';
  }
}

export const translationService = new TranslationService();
