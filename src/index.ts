/**
 * E2E Cypress for Dummys - TypeScript Library
 * Punto de entrada principal de la librería
 */

// Exportar componentes
export { AppComponent } from '@components/app/app.component';

// Exportar componentes modales
export { ConfigurationComponent } from '@components/modals/configuration/configuration.component';

// Exportar servicios
export { PersistenceService } from '@services/persistence.service';
export type { Test, Command, Interceptor, Config } from '@services/persistence.service';

// Exportar servicio de traducción
export { AppTranslationService } from '@lib/services/app-translation.service';

// Exportar modelos de base de datos
export { databaseTablesModel, databaseConfiguration } from '@lib/models/database';
export type { StoreMetadata, StoreSchema, DatabaseConfiguration } from '@lib/models/database';

// Versión
export const VERSION = '1.0.0';
