/**
 * @file configuration.component.ts
 * @description Componente de configuración - Maneja idioma, configuración HTTP avanzada, y export/import de datos
 * 
 * Estructura:
 * - configuration.component.ts   (Lógica)
 * - configuration.component.html (Template)
 * - configuration.component.scss (Estilos)
 */

import template from './configuration.component.html?raw';
import styles from './configuration.component.scss?raw';
import { AppTranslationService } from '@lib/services/app-translation.service';

export interface ConfigData {
  tests?: any[];
  interceptors?: any[];
}

/**
 * Componente de configuración de la aplicación
 * Permite seleccionar idioma, configurar opciones HTTP avanzadas, y exportar/importar datos
 */
export class ConfigurationComponent {
  private container: HTMLElement;
  private translator: AppTranslationService;
  public unsubscribeLanguageChange: (() => void) | null = null;
  private state = {
    selectedLanguage: AppTranslationService.getInstance().getLanguage(),
    advancedHttpConfig: localStorage.getItem('extendedHttpCommands') === 'true',
    showGeneralSection: true,
    showExportSection: true,
  };

  constructor() {
    this.container = document.createElement('div');
    this.translator = AppTranslationService.getInstance();
  }

  /**
   * Renderiza el componente en el DOM
   */
  public render(): HTMLElement {
    this.injectStyles();
    this.container.innerHTML = template;
    this.setupUI();
    this.setupEventListeners();
    this.subscribeToLanguageChanges();
    return this.container;
  }

  /**
   * Configura el estado inicial de la UI
   * @private
   */
  private setupUI(): void {
    // Establecer valores iniciales
    const languageSelect = this.container.querySelector('[data-field="language"]') as HTMLSelectElement;
    if (languageSelect) {
      languageSelect.value = this.state.selectedLanguage;
    }

    const advancedHttpCheckbox = this.container.querySelector('[data-field="advancedHttp"]') as HTMLInputElement;
    if (advancedHttpCheckbox) {
      advancedHttpCheckbox.checked = this.state.advancedHttpConfig;
    }
  }

  /**
   * Configura los event listeners
   * @private
   */
  private setupEventListeners(): void {
    // Listeners para toggles de secciones
    const headers = this.container.querySelectorAll('.collapsible-header');
    headers.forEach((header) => {
      header.addEventListener('click', (e) => this.handleSectionToggle(e));
      header.addEventListener('keyup', (e) => {
        if ((e as KeyboardEvent).key === ' ') {
          this.handleSectionToggle(e);
        }
      });
    });

    // Listener para cambio de idioma
    const languageSelect = this.container.querySelector('[data-field="language"]') as HTMLSelectElement;
    if (languageSelect) {
      languageSelect.addEventListener('change', (e) => this.handleLanguageChange(e));
    }

    // Listener para configuración HTTP avanzada
    const advancedHttpCheckbox = this.container.querySelector('[data-field="advancedHttp"]') as HTMLInputElement;
    if (advancedHttpCheckbox) {
      advancedHttpCheckbox.addEventListener('change', (e) => this.handleAdvancedHttpChange(e));
    }

    // Listener para botón de exportar
    const exportBtn = this.container.querySelector('[data-action="export"]') as HTMLButtonElement;
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.handleExport());
    }

    // Listener para input de importar
    const importInput = this.container.querySelector('[data-action="import"]') as HTMLInputElement;
    if (importInput) {
      importInput.addEventListener('change', (e) => this.handleImport(e));
    }
  }

  /**
   * Maneja el toggle de secciones colapsibles
   * @private
   */
  private handleSectionToggle(event: Event): void {
    const header = event.target as HTMLElement;
    const toggle = header.getAttribute('data-toggle');
    
    if (!toggle) return;

    const content = this.container.querySelector(`.${toggle}`) as HTMLElement;
    if (content) {
      const isShown = content.style.display !== 'none';
      content.style.display = isShown ? 'none' : 'block';
      
      const icon = header.querySelector('.collapsible-icon') as HTMLElement;
      if (icon) {
        icon.textContent = isShown ? '▼' : '▲';
      }
    }
  }

  /**
   * Maneja el cambio de idioma
   * @private
   */
  private handleLanguageChange(event: Event): void {
    const lang = (event.target as HTMLSelectElement).value as 'es' | 'en';
    this.state.selectedLanguage = lang;
    this.translator.setLanguage(lang);
    console.log('📝 Idioma cambiado a:', lang);
  }

  /**
   * Maneja el cambio de configuración HTTP avanzada
   * @private
   */
  private handleAdvancedHttpChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.state.advancedHttpConfig = checked;
    localStorage.setItem('extendedHttpCommands', checked ? 'true' : 'false');
    console.log('⚙️ Configuración HTTP avanzada:', checked);
    // TODO: Integrar con servicio de configuración
  }

  /**
   * Maneja la exportación de datos
   * @private
   */
  private handleExport(): void {
    try {
      // TODO: Obtener tests e interceptors del servicio de persistencia
      const exportData: ConfigData = {
        tests: [],
        interceptors: [],
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'e2e-cypress-export.json';
      link.click();
      URL.revokeObjectURL(url);
      
      console.log('✅ Datos exportados correctamente');
      alert('Datos exportados correctamente.');
    } catch (error) {
      console.error('❌ Error al exportar:', error);
      alert('Error al exportar los datos.');
    }
  }

  /**
   * Maneja la importación de datos
   * @private
   */
  private handleImport(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data: ConfigData = JSON.parse(content);

        // Validar estructura
        if (!data || !Array.isArray(data.tests) || !Array.isArray(data.interceptors)) {
          throw new Error('El archivo no tiene el formato esperado.');
        }

        console.log('✅ Datos importados correctamente');
        alert('Datos importados correctamente.');
        // TODO: Procesar los datos con el servicio de persistencia
      } catch (error) {
        console.error('❌ Error al importar:', error);
        alert(`Error al importar: ${error instanceof Error ? error.message : 'JSON inválido'}`);
      }
    };

    reader.onerror = () => {
      alert('Error al leer el archivo.');
    };

    reader.readAsText(file);
    input.value = '';
  }

  /**GB
   * Inyecta los estilos SCSS compilados en el head
   * @private
   */
  private injectStyles(): void {
    const css = this.compileSCSStoCSS(styles);
    const styleElement = document.createElement('style');
    styleElement.id = 'configuration-component-styles';
    styleElement.textContent = css;

    if (!document.getElementById('configuration-component-styles')) {
      document.head.appendChild(styleElement);
    }
  }

  /**
   * Se suscribe a cambios de idioma para actualizar todos los textos
   * @private
   */
  private subscribeToLanguageChanges(): void {
    this.unsubscribeLanguageChange = this.translator.onLanguageChange(() => {
      this.updateAllTexts();
    });
  }

  /**
   * Actualiza todos los textos del componente con las nuevas traducciones
   * @private
   */
  private updateAllTexts(): void {
    // Actualizar etiquetas principales
    const generalHeader = this.container.querySelector('[data-toggle="general-section"]');
    if (generalHeader) {
      generalHeader.textContent = this.translator.t('CONFIG.GENERAL');
    }

    const exportHeader = this.container.querySelector('[data-toggle="export-section"]');
    if (exportHeader) {
      exportHeader.textContent = this.translator.t('CONFIG.EXPORT_IMPORT');
    }

    // Actualizar labels
    const languageLabel = this.container.querySelector('label[for="language-select"]');
    if (languageLabel) {
      languageLabel.textContent = this.translator.t('CONFIG.LANGUAGE');
    }

    const httpConfigLabel = this.container.querySelector('label[for="advanced-http-checkbox"]');
    if (httpConfigLabel) {
      httpConfigLabel.textContent = this.translator.t('CONFIG.ADVANCED_HTTP_CONFIG');
    }

    // Actualizar botones
    const exportButton = this.container.querySelector('[data-action="export"]');
    if (exportButton) {
      exportButton.textContent = this.translator.t('CONFIG.EXPORT_DATA');
    }

    const importButton = this.container.querySelector('[data-action="import-data"]');
    if (importButton) {
      importButton.textContent = this.translator.t('CONFIG.IMPORT_DATA');
    }

    console.log('🌐 Textos de ConfigurationComponent actualizados al idioma:', this.translator.getLanguage());
  }

  /**
   * Convierte SCSS a CSS válido
   * @private
   */
  private compileSCSStoCSS(scss: string): string {
    let css = scss;
    
    // Remover comentarios
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    css = css.replace(/\/\/.*$/gm, '');
    
    // Expandir & en pseudo-clases
    css = css.replace(/&:/g, ':');
    css = css.replace(/&\s+\./g, '.');
    
    // Limpiar espacios
    css = css.replace(/\n\s+/g, '\n');
    
    return css;
  }
}

