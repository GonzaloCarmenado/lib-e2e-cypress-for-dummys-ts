/**
 * @file database-configuration.model.ts
 * @description Configuración de la base de datos IndexedDB
 */

import { databaseTablesModel } from './database-tables.model';

export interface DatabaseConfiguration {
  name: string;
  version: number;
  objectStoresMeta: any[];
}

/**
 * Configuración de la base de datos IndexedDB
 * Nombre: E2ECypressDB
 * Versión: 1
 */
export const databaseConfiguration: DatabaseConfiguration = {
  name: 'E2ECypressDB',
  version: 1,
  objectStoresMeta: databaseTablesModel,
};
