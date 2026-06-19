export type Lang = 'es' | 'en' | 'fr' | 'it' | 'de';

export const SUPPORTED_LANGS: Lang[] = ['es', 'en', 'fr', 'it', 'de'];

export function isLang(value: string): value is Lang {
  return SUPPORTED_LANGS.includes(value as Lang);
}

/** BCP-47 locale used for date/number formatting per UI language. */
export const LOCALE_BY_LANG: Record<Lang, string> = {
  es: 'es-ES',
  en: 'en-GB',
  fr: 'fr-FR',
  it: 'it-IT',
  de: 'de-DE',
};

/** Returns the formatting locale for a UI language (falls back to es-ES). */
export function localeForLang(lang: string): string {
  return isLang(lang) ? LOCALE_BY_LANG[lang] : 'es-ES';
}
