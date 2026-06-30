export interface DBStoreIndex {
  name: string;
  keyPath: string;
  unique: boolean;
}

export interface DBStore {
  name: string;
  keyPath: string;
  autoIncrement: boolean;
  indexes: DBStoreIndex[];
}

export interface DBSchema {
  name: string;
  version: number;
  stores: DBStore[];
}

export const DB_SCHEMA: DBSchema = {
  name: 'E2ECypressDB',
  version: 11,
  stores: [
    {
      name: 'tests',
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'name',      keyPath: 'name',      unique: false },
        { name: 'createdAt', keyPath: 'createdAt', unique: false },
      ],
    },
    {
      name: 'commands',
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'command',   keyPath: 'command',   unique: false },
        { name: 'testId',    keyPath: 'testId',    unique: false },
        { name: 'createdAt', keyPath: 'createdAt', unique: false },
      ],
    },
    {
      name: 'interceptors',
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'interceptor', keyPath: 'interceptor', unique: false },
        { name: 'testId',      keyPath: 'testId',      unique: false },
        { name: 'createdAt',   keyPath: 'createdAt',   unique: false },
      ],
    },
    {
      name: 'configuration',
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'language',             keyPath: 'language',             unique: false },
        { name: 'extendedHttpCommands', keyPath: 'extendedHttpCommands', unique: false },
        { name: 'allowReadWriteFiles',  keyPath: 'allowReadWriteFiles',  unique: false },
      ],
    },
    {
      // Single-record store (fixed key id=1) holding the live, in-progress
      // recording session so it survives a micro-frontend crossing or reload.
      // See docs/specs/006-cross-app-recording-continuity.md.
      name: 'activeSession',
      keyPath: 'id',
      autoIncrement: false,
      indexes: [],
    },
  ],
};

export const DB_STORE_NAMES = DB_SCHEMA.stores.map(s => s.name) as [
  'tests',
  'commands',
  'interceptors',
  'configuration',
  'activeSession',
];
