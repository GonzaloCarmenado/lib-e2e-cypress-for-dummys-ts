/**
 * @file app.component.ts
 * @description Componente principal de la aplicación
 * 
 * Estructura:
 * - app.component.ts   (Lógica)
 * - app.component.html (Template)
 * - app.component.scss (Estilos)
 */

import template from './app.component.html?raw';
import styles from './app.component.scss?raw';
import Swal from 'sweetalert2';
import { ConfigurationComponent } from '@components/modals/configuration/configuration.component';
import { PersistenceService } from '@services/persistence.service';
import { AppTranslationService } from '@lib/services/app-translation.service';

export class AppComponent {
  private container: HTMLElement;
  private translator: AppTranslationService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public unsubscribeLanguageChange: (() => void) | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.translator = AppTranslationService.getInstance();
  }

  /**
   * Renderiza el componente en el DOM
   * 
   * @returns {HTMLElement} Elemento renderizado del componente
   */
  public render(): HTMLElement {
    // Inyectar estilos en el head si no existen
    this.injectStyles();
    
    this.container.innerHTML = template;
    this.setupEventListeners();
    
    // Suscribirse a cambios de idioma
    this.subscribeToLanguageChanges();
    
    // Inicializar base de datos
    this.initializeDatabase();
    
    return this.container;
  }

  /**
   * Inyecta los estilos SCSS compilados en el head
   * 
   * @private
   */
  private injectStyles(): void {
    // Compilar SCSS a CSS (convertir sintaxis SCSS a CSS válido)
    const css = this.compileSCSStoCSS(styles);
    
    // Crear elemento style
    const styleElement = document.createElement('style');
    styleElement.id = 'app-component-styles';
    styleElement.textContent = css;
    
    // Solo inyectar si no existe
    if (!document.getElementById('app-component-styles')) {
      document.head.appendChild(styleElement);
    }
  }

  /**
   * Convierte sintaxis SCSS a CSS válido
   * 
   * @param scss Código SCSS
   * @returns Código CSS compilado
   * @private
   */
  private compileSCSStoCSS(scss: string): string {
    let css = scss;
    
    // Remover comentarios // simples
    css = css.replace(/\/\/.*$/gm, '');
    
    // Expandir & en anidaciones
    css = css.replace(/&:/g, ':');
    css = css.replace(/&\s+\./g, '.');
    
    // Limpiar múltiples espacios/saltos de línea
    css = css.replace(/\s+/g, ' ');
    css = css.replace(/\s*[{}]/g, (match) => match.trim());
    
    return css;
  }

  /**
   * Configura los event listeners del componente
   * 
   * Maneja:
   * - Cambio de idioma
   * - Click en botón flotante
   * - Click en otros botones (settings, saved tests, etc.)
   * 
   * @private
   */
  private setupEventListeners(): void {
    // Obtener servicio de traducción
    const translator = AppTranslationService.getInstance();

    // Listener para botón flotante (grabar)
    const floatingButton = this.container.querySelector('.e2e-recorder-button');
    if (floatingButton) {
      floatingButton.textContent = translator.t('MAIN_FRAME.RECORD');
      floatingButton.addEventListener('click', () => {
        this.handleFloatingButtonClick();
      });
    }

    // Listener para botón de configuración
    const settingsButton = this.container.querySelector('.gear-icon-button');
    if (settingsButton) {
      const tooltipText = settingsButton.querySelector('.tooltip-text');
      if (tooltipText) {
        tooltipText.textContent = translator.t('MAIN_FRAME.SETTINGS');
      }
      settingsButton.addEventListener('click', () => {
        this.handleSettingsClick();
      });
    }

    // Listener para botón de tests guardados
    const savedTestsButton = this.container.querySelector('.saved-test-icon-button');
    if (savedTestsButton) {
      const tooltipText = savedTestsButton.querySelector('.tooltip-text');
      if (tooltipText) {
        tooltipText.textContent = translator.t('MAIN_FRAME.SHOW_SAVED_TESTS');
      }
      savedTestsButton.addEventListener('click', () => {
        this.handleSavedTestsClick();
      });
    }

    // Listener para botón de comandos
    const commandsButton = this.container.querySelector('.test-icon-button');
    if (commandsButton) {
      const tooltipText = commandsButton.querySelector('.tooltip-text');
      if (tooltipText) {
        tooltipText.textContent = translator.t('MAIN_FRAME.SHOW_COMMANDS');
      }
      commandsButton.addEventListener('click', () => {
        this.handleCommandsClick();
      });
    }

    // Listener para botón de editor avanzado
    const advancedButton = this.container.querySelector('.advanced-editor-icon-button');
    if (advancedButton) {
      const tooltipText = advancedButton.querySelector('.tooltip-text');
      if (tooltipText) {
        tooltipText.textContent = translator.t('MAIN_FRAME.SHOW_ADVANCED_EDITOR');
      }
      advancedButton.addEventListener('click', () => {
        this.handleAdvancedEditorClick();
      });
    }
  }

  /**
   * Se suscribe a cambios de idioma para actualizar todos los textos
   * 
   * @private
   */
  private subscribeToLanguageChanges(): void {
    this.unsubscribeLanguageChange = this.translator.onLanguageChange(() => {
      this.updateAllTexts();
    });
  }

  /**
   * Actualiza todos los textos del componente con las nuevas traducciones
   * 
   * @private
   */
  private updateAllTexts(): void {
    // Actualizar botón de grabar
    const floatingButton = this.container.querySelector('.e2e-recorder-button');
    if (floatingButton) {
      floatingButton.textContent = this.translator.t('MAIN_FRAME.RECORD');
    }

    // Actualizar tooltip de configuración
    const settingsButton = this.container.querySelector('.gear-icon-button');
    if (settingsButton) {
      const tooltipText = settingsButton.querySelector('.tooltip-text');
      if (tooltipText) {
        tooltipText.textContent = this.translator.t('MAIN_FRAME.SETTINGS');
      }
    }

    // Actualizar tooltip de tests guardados
    const savedTestsButton = this.container.querySelector('.saved-test-icon-button');
    if (savedTestsButton) {
      const tooltipText = savedTestsButton.querySelector('.tooltip-text');
      if (tooltipText) {
        tooltipText.textContent = this.translator.t('MAIN_FRAME.SHOW_SAVED_TESTS');
      }
    }

    // Actualizar tooltip de comandos
    const commandsButton = this.container.querySelector('.test-icon-button');
    if (commandsButton) {
      const tooltipText = commandsButton.querySelector('.tooltip-text');
      if (tooltipText) {
        tooltipText.textContent = this.translator.t('MAIN_FRAME.SHOW_COMMANDS');
      }
    }

    // Actualizar tooltip de editor avanzado
    const advancedButton = this.container.querySelector('.advanced-editor-icon-button');
    if (advancedButton) {
      const tooltipText = advancedButton.querySelector('.tooltip-text');
      if (tooltipText) {
        tooltipText.textContent = this.translator.t('MAIN_FRAME.SHOW_ADVANCED_EDITOR');
      }
    }

    console.log('🌐 Textos de AppComponent actualizados al idioma:', this.translator.getLanguage());
  }

  /**
   * Maneja el click del botón flotante (Grabar)
   * 
   * @private
   */
  private handleFloatingButtonClick(): void {
    console.log('🚀 Botón flotante clickeado - Iniciar grabación');
    
    Swal.fire({
      title: 'E2E Cypress Recorder',
      text: 'Iniciando grabación de test...',
      icon: 'info',
      confirmButtonText: 'OK',
      allowOutsideClick: true,
      allowEscapeKey: true,
    });
  }

  /**
   * Maneja el click del botón de configuración
   * 
   * @private
   */
  private handleSettingsClick(): void {
    console.log('⚙️ Abriendo configuración');
    
    const configComponent = new ConfigurationComponent();
    const configContent = configComponent.render();

    Swal.fire({
      title: 'Configuración',
      html: configContent,
      width: '700px',
      showConfirmButton: false,
      allowOutsideClick: true,
      allowEscapeKey: true,
      didOpen: () => {
        // El contenido ya está renderizado en configContent
      },
    });
  }

  /**
   * Maneja el click del botón de tests guardados
   * 
   * @private
   */
  private handleSavedTestsClick(): void {
    console.log('📋 Abriendo tests guardados');
    
    Swal.fire({
      title: 'Tests Guardados',
      text: 'Lista de tests guardados',
      icon: 'info',
      confirmButtonText: 'Cerrar',
      allowOutsideClick: true,
      allowEscapeKey: true,
    });
  }

  /**
   * Maneja el click del botón de comandos
   * 
   * @private
   */
  private handleCommandsClick(): void {
    console.log('📝 Abriendo comandos');
    
    Swal.fire({
      title: 'Comandos',
      text: 'Lista de comandos registrados',
      icon: 'info',
      confirmButtonText: 'Cerrar',
      allowOutsideClick: true,
      allowEscapeKey: true,
    });
  }

  /**
   * Maneja el click del botón de editor avanzado
   * 
   * @private
   */
  private handleAdvancedEditorClick(): void {
    console.log('🛠️ Abriendo editor avanzado');
    
    Swal.fire({
      title: 'Editor Avanzado',
      text: 'Editor de tests avanzado',
      icon: 'info',
      confirmButtonText: 'Cerrar',
      allowOutsideClick: true,
      allowEscapeKey: true,
    });
  }

  /**
   * Inicializa la base de datos y añade un registro de prueba
   * 
   * @private
   */
  private async initializeDatabase(): Promise<void> {
    try {
      const persistence = PersistenceService.getInstance();
      await persistence.init();
      
      // Verificar si ya existe un test de prueba
      const allTests = await persistence.getAllTests();
      
      if (allTests.length === 0) {
        // Si la BD está vacía, añadir un test de prueba
        const testId = await persistence.insertTest(
          'Test de Prueba - Generado Automáticamente',
          [],
          []
        );
        
        console.log('✅ Base de datos inicializada correctamente');
        console.log('📊 Test de prueba creado con ID:', testId);
      } else {
        console.log('✅ Base de datos ya contiene', allTests.length, 'test(s)');
      }
    } catch (error) {
      console.error('❌ Error inicializando la base de datos:', error);
    }
  }
}

