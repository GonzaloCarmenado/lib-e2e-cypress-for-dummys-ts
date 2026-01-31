/**
 * @file app-translation.service.ts
 * @description Servicio de traducción i18n para la librería
 */

import { I18N_ES } from '@lib/i18n/translations.es';
import { I18N_EN } from '@lib/i18n/translations.en';

type LanguageCode = 'es' | 'en';

interface TranslationMap {
  [key: string]: any;
}

type LanguageChangeListener = (language: LanguageCode) => void;

/**
 * Servicio singleton para gestionar traducciones
 * Proporciona métodos para cambiar idioma y obtener textos traducidos
 * Permite suscribirse a cambios de idioma para actualizar la UI
 */
export class AppTranslationService {
  private static instance: AppTranslationService;
  private currentLanguage: LanguageCode = 'es';
  private translations: Record<LanguageCode, TranslationMap> = {
    es: I18N_ES,
    en: I18N_EN,
  };
  private languageChangeListeners: Set<LanguageChangeListener> = new Set();

  private constructor() {
    // Cargar idioma guardado en localStorage o usar español por defecto
    const savedLanguage = localStorage.getItem('app-language') as LanguageCode;
    if (savedLanguage && this.translations[savedLanguage]) {
      this.currentLanguage = savedLanguage;
    }
  }

  /**
   * Obtiene la instancia singleton del servicio
   */
  public static getInstance(): AppTranslationService {
    if (!AppTranslationService.instance) {
      AppTranslationService.instance = new AppTranslationService();
    }
    return AppTranslationService.instance;
  }

  /**
   * Suscribe un listener a cambios de idioma
   * 
   * @param listener Función a ejecutar cuando cambie el idioma
   * @returns Función para desuscribirse
   */
  public onLanguageChange(listener: LanguageChangeListener): () => void {
    this.languageChangeListeners.add(listener);
    
    // Retornar función para desuscribirse
    return () => {
      this.languageChangeListeners.delete(listener);
    };
  }

  /**
   * Notifica a todos los listeners de cambio de idioma
   * 
   * @private
   */
  private notifyLanguageChange(): void {
    this.languageChangeListeners.forEach(listener => {
      listener(this.currentLanguage);
    });
  }

  /**
   * Cambia el idioma actual y notifica a los listeners
   *
   * @param language Código de idioma ('es' o 'en')
   */
  public setLanguage(language: LanguageCode): void {
    if (this.translations[language]) {
      this.currentLanguage = language;
      localStorage.setItem('app-language', language);
      this.notifyLanguageChange();
    }
  }

  /**
   * Obtiene el idioma actual
   */
  public getLanguage(): LanguageCode {
    return this.currentLanguage;
  }

  /**
   * Obtiene una traducción utilizando notación de punto
   * Ejemplo: t('MAIN_FRAME.RECORD') -> "Grabar"
   *
   * @param key Clave de traducción con notación de punto
   * @param defaultValue Valor por defecto si no se encuentra la clave
   * @returns Texto traducido
   */
  public t(key: string, defaultValue: string = key): string {
    const keys = key.split('.');
    let value: any = this.translations[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return typeof value === 'string' ? value : defaultValue;
  }

  /**
   * Obtiene todas las traducciones del idioma actual
   */
  public getTranslations(): TranslationMap {
    return this.translations[this.currentLanguage];
  }

  /**
   * Obtiene los idiomas disponibles
   */
  public getAvailableLanguages(): LanguageCode[] {
    return Object.keys(this.translations) as LanguageCode[];
  }
}
