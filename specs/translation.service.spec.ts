import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TranslationService } from '../src/services/translation.service';

describe('Phase 2 — TranslationService', () => {
  let service: TranslationService;

  beforeEach(() => {
    service = new TranslationService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setLang / getLang', () => {
    it('default language is detected from navigator (falls back to "es")', () => {
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('zh-CN');
      const s = new TranslationService();
      expect(s.getLang()).toBe('es');
    });

    it('setLang("en") → getLang() returns "en"', () => {
      service.setLang('en');
      expect(service.getLang()).toBe('en');
    });

    it('setLang("fr") → getLang() returns "fr"', () => {
      service.setLang('fr');
      expect(service.getLang()).toBe('fr');
    });

    it('setLang("it") → getLang() returns "it"', () => {
      service.setLang('it');
      expect(service.getLang()).toBe('it');
    });

    it('setLang("de") → getLang() returns "de"', () => {
      service.setLang('de');
      expect(service.getLang()).toBe('de');
    });
  });

  describe('translate', () => {
    it('translates a nested key in Spanish', () => {
      service.setLang('es');
      expect(service.translate('MAIN_FRAME.SETTINGS')).toBe('Configuración');
    });

    it('translates a nested key in English', () => {
      service.setLang('en');
      expect(service.translate('MAIN_FRAME.SETTINGS')).toBe('Settings');
    });

    it('translates a nested key in French', () => {
      service.setLang('fr');
      expect(service.translate('MAIN_FRAME.SETTINGS')).toBe('Paramètres');
    });

    it('translates a nested key in Italian', () => {
      service.setLang('it');
      expect(service.translate('MAIN_FRAME.SETTINGS')).toBe('Impostazioni');
    });

    it('translates a nested key in German', () => {
      service.setLang('de');
      expect(service.translate('MAIN_FRAME.SETTINGS')).toBe('Einstellungen');
    });

    it('translates a deeply nested key', () => {
      service.setLang('es');
      expect(service.translate('RECORDER.FS_PERMISSION_NOTE')).toBe(
        'El permiso se guarda en el navegador y no se vuelve a solicitar.'
      );
    });

    it('returns the key itself for a missing top-level key', () => {
      expect(service.translate('NONEXISTENT.KEY')).toBe('NONEXISTENT.KEY');
    });

    it('returns the key itself for a missing nested key', () => {
      expect(service.translate('MAIN_FRAME.NONEXISTENT')).toBe('MAIN_FRAME.NONEXISTENT');
    });

    it('does not throw for any missing key', () => {
      expect(() => service.translate('A.B.C.D.E')).not.toThrow();
    });
  });

  describe('detectLang', () => {
    it('detects "es" from "es-ES"', () => {
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('es-ES');
      expect(service.detectLang()).toBe('es');
    });

    it('detects "en" from "en-US"', () => {
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
      expect(service.detectLang()).toBe('en');
    });

    it('detects "fr" from "fr-FR"', () => {
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('fr-FR');
      expect(service.detectLang()).toBe('fr');
    });

    it('detects "it" from "it-IT"', () => {
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('it-IT');
      expect(service.detectLang()).toBe('it');
    });

    it('detects "de" from "de-DE"', () => {
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('de-DE');
      expect(service.detectLang()).toBe('de');
    });

    it('returns "es" (default) for an unsupported language', () => {
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('zh-CN');
      expect(service.detectLang()).toBe('es');
    });

    it('returns "es" (default) for an empty navigator language', () => {
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('');
      expect(service.detectLang()).toBe('es');
    });
  });
});
