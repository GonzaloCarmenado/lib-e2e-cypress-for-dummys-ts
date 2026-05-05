export type Lang = 'es' | 'en' | 'fr' | 'it' | 'de';

export const SUPPORTED_LANGS: Lang[] = ['es', 'en', 'fr', 'it', 'de'];

export function isLang(value: string): value is Lang {
  return SUPPORTED_LANGS.includes(value as Lang);
}
