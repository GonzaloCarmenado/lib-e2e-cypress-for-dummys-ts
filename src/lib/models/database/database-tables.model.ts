/**
 * @file database-tables.model.ts
 * @description Configuración de las tablas de la base de datos IndexedDB
 */

export interface StoreSchema {
  name: string;
  keypath: string;
  options: {
    unique: boolean;
  };
}

export interface StoreMetadata {
  store: string;
  storeConfig: {
    keyPath: string;
    autoIncrement: boolean;
  };
  storeSchema: StoreSchema[];
}

/**
 * Modelo de configuración de las tablas de la base de datos
 */
export const databaseTablesModel: StoreMetadata[] = [
  {
    store: 'tests',
    storeConfig: { keyPath: 'id', autoIncrement: true },
    storeSchema: [
      {
        name: 'name',
        keypath: 'name',
        options: { unique: false },
      },
      {
        name: 'createdAt',
        keypath: 'createdAt',
        options: { unique: false },
      },
    ],
  },
  {
    store: 'commands',
    storeConfig: { keyPath: 'id', autoIncrement: true },
    storeSchema: [
      { name: 'command', keypath: 'command', options: { unique: false } },
      { name: 'testId', keypath: 'testId', options: { unique: false } },
      { name: 'createdAt', keypath: 'createdAt', options: { unique: false } },
    ],
  },
  {
    store: 'interceptors',
    storeConfig: { keyPath: 'id', autoIncrement: true },
    storeSchema: [
      {
        name: 'interceptor',
        keypath: 'interceptor',
        options: { unique: false },
      },
      { name: 'testId', keypath: 'testId', options: { unique: false } },
      { name: 'createdAt', keypath: 'createdAt', options: { unique: false } },
    ],
  },
  {
    store: 'configuration',
    storeConfig: { keyPath: 'id', autoIncrement: true },
    storeSchema: [
      {
        name: 'language',
        keypath: 'language',
        options: { unique: false },
      },
      {
        name: 'extendedHttpCommands',
        keypath: 'extendedHttpCommands',
        options: { unique: false },
      },
      {
        name: 'allowReadWriteFiles',
        keypath: 'allowReadWriteFiles',
        options: { unique: false },
      },
    ],
  },
];
