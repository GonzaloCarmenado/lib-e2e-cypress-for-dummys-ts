/**
 * @file persistence.service.ts
 * @description Servicio de persistencia usando IndexedDB nativa
 * 
 * Maneja:
 * - Tests (pruebas)
 * - Comandos asociados a tests
 * - Interceptores asociados a tests
 * - Configuración general
 */

export interface Test {
  id?: number;
  name: string;
  createdAt: number;
}

export interface Command {
  id?: number;
  command: string;
  testId: number;
  createdAt: number;
}

export interface Interceptor {
  id?: number;
  interceptor: string;
  testId: number;
  createdAt: number;
}

export interface Config {
  id?: number;
  language?: string;
  extendedHttpCommands?: string | boolean;
  [key: string]: any;
}

/**
 * Servicio de persistencia con IndexedDB nativa
 * Singleton - solo una instancia en toda la aplicación
 */
export class PersistenceService {
  private static instance: PersistenceService;
  private db: IDBDatabase | null = null;
  private readonly dbName = 'e2e-cypress-db';
  private readonly version = 1;

  private constructor() {}

  /**
   * Obtiene la instancia singleton del servicio
   */
  public static getInstance(): PersistenceService {
    if (!PersistenceService.instance) {
      PersistenceService.instance = new PersistenceService();
    }
    return PersistenceService.instance;
  }

  /**
   * Inicializa la base de datos
   */
  public async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Error abriendo IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB inicializada');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Crear object stores
        if (!db.objectStoreNames.contains('tests')) {
          db.createObjectStore('tests', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('commands')) {
          const commandsStore = db.createObjectStore('commands', {
            keyPath: 'id',
            autoIncrement: true,
          });
          commandsStore.createIndex('testId', 'testId', { unique: false });
        }
        if (!db.objectStoreNames.contains('interceptors')) {
          const interceptorsStore = db.createObjectStore('interceptors', {
            keyPath: 'id',
            autoIncrement: true,
          });
          interceptorsStore.createIndex('testId', 'testId', { unique: false });
        }
        if (!db.objectStoreNames.contains('configuration')) {
          db.createObjectStore('configuration', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  /**
   * Ejecuta una transacción de lectura
   */
  private readTransaction(stores: string[], callback: (tx: IDBTransaction) => Promise<any>): Promise<any> {
    if (!this.db) throw new Error('BD no inicializada');
    const tx = this.db.transaction(stores, 'readonly');
    return callback(tx);
  }

  /**
   * Ejecuta una transacción de escritura
   */
  private writeTransaction(stores: string[], callback: (tx: IDBTransaction) => Promise<any>): Promise<any> {
    if (!this.db) throw new Error('BD no inicializada');
    const tx = this.db.transaction(stores, 'readwrite');
    return callback(tx);
  }

  // ============ TESTS ============

  /**
   * Inserta un test con sus comandos e interceptadores
   */
  public async insertTest(
    name: string,
    commands: string[] = [],
    interceptors: string[] = []
  ): Promise<number> {
    const test: Test = {
      name,
      createdAt: Date.now(),
    };

    return this.writeTransaction(['tests', 'commands', 'interceptors'], async (tx) => {
      const testId = await this.dbAdd('tests', test, tx);

      if (commands.length > 0) {
        for (const cmd of commands) {
          await this.dbAdd('commands', { command: cmd, testId, createdAt: Date.now() }, tx);
        }
      }
      if (interceptors.length > 0) {
        for (const interceptor of interceptors) {
          await this.dbAdd('interceptors', { interceptor, testId, createdAt: Date.now() }, tx);
        }
      }

      return testId;
    });
  }

  /**
   * Obtiene todos los tests con sus comandos e interceptadores
   */
  public async getAllTests(): Promise<any[]> {
    return this.readTransaction(['tests', 'commands', 'interceptors'], async (tx) => {
      const tests = await this.dbGetAll('tests', tx);

      if (!tests.length) return [];

      const testWithDetails = await Promise.all(
        tests.map(async (test) => {
          const commands = await this.dbGetByIndex('commands', 'testId', test.id, tx);
          const interceptors = await this.dbGetByIndex('interceptors', 'testId', test.id, tx);

          return {
            ...test,
            commands: commands.map((c: Command) => c.command),
            interceptors: interceptors.map((i: Interceptor) => i.interceptor),
          };
        })
      );

      return testWithDetails;
    });
  }

  /**
   * Obtiene todos los comandos
   */
  public async getAllCommands(): Promise<Command[]> {
    return this.readTransaction(['commands'], async (tx) => {
      return this.dbGetAll('commands', tx);
    });
  }

  /**
   * Obtiene comandos por test ID
   */
  public async getCommandsByTestId(testId: number): Promise<Command[]> {
    return this.readTransaction(['commands'], async (tx) => {
      return this.dbGetByIndex('commands', 'testId', testId, tx);
    });
  }

  /**
   * Elimina un test y sus datos asociados
   */
  public async deleteTest(id: number): Promise<void> {
    return this.writeTransaction(['tests', 'commands', 'interceptors'], async (tx) => {
      await this.dbDelete('tests', id, tx);

      // Eliminar comandos asociados
      const commands = await this.dbGetByIndex('commands', 'testId', id, tx);
      for (const cmd of commands) {
        await this.dbDelete('commands', cmd.id, tx);
      }

      // Eliminar interceptadores asociados
      const interceptors = await this.dbGetByIndex('interceptors', 'testId', id, tx);
      for (const inter of interceptors) {
        await this.dbDelete('interceptors', inter.id, tx);
      }
    });
  }

  // ============ INTERCEPTADORES ============

  /**
   * Obtiene todos los interceptadores
   */
  public async getAllInterceptors(): Promise<Interceptor[]> {
    return this.readTransaction(['interceptors'], async (tx) => {
      return this.dbGetAll('interceptors', tx);
    });
  }

  /**
   * Obtiene interceptadores por test ID
   */
  public async getInterceptorsByTestId(testId: number): Promise<Interceptor[]> {
    return this.readTransaction(['interceptors'], async (tx) => {
      return this.dbGetByIndex('interceptors', 'testId', testId, tx);
    });
  }

  /**
   * Inserta interceptadores asociados a un test
   */
  public async insertInterceptors(interceptors: string[], testId: number): Promise<void> {
    if (!interceptors.length) return;

    return this.writeTransaction(['interceptors'], async (tx) => {
      for (const interceptor of interceptors) {
        await this.dbAdd('interceptors', { interceptor, testId, createdAt: Date.now() }, tx);
      }
    });
  }

  // ============ CONFIGURACIÓN ============

  /**
   * Establece valores de configuración (merge)
   */
  public async setConfig(config: Record<string, any>): Promise<void> {
    return this.writeTransaction(['configuration'], async (tx) => {
      const records = await this.dbGetAll('configuration', tx);
      const current = records.length > 0 ? records[0] : {};
      const merged: Config = { ...current, ...config };

      if (current.id) {
        await this.dbPut('configuration', { ...merged, id: current.id }, tx);
      } else {
        await this.dbAdd('configuration', merged, tx);
      }
    });
  }

  /**
   * Obtiene la configuración general
   */
  public async getConfig(): Promise<Config | null> {
    return this.readTransaction(['configuration'], async (tx) => {
      const records = await this.dbGetAll('configuration', tx);
      return records.length > 0 ? records[0] : null;
    });
  }

  /**
   * Obtiene un valor específico de configuración
   */
  public async getConfigKey(key: string): Promise<any> {
    const config = await this.getConfig();
    return config?.[key] ?? null;
  }

  // ============ UTILIDADES ============

  /**
   * Limpia todos los datos
   */
  public async clearAllData(): Promise<void> {
    return this.writeTransaction(['tests', 'commands', 'interceptors', 'configuration'], async (tx) => {
      await this.dbClear('tests', tx);
      await this.dbClear('commands', tx);
      await this.dbClear('interceptors', tx);
      console.log('✅ Todos los datos eliminados');
    });
  }

  /**
   * Exporta todos los datos
   */
  public async exportAllData(): Promise<{ tests: any[]; interceptors: any[] }> {
    const tests = await this.getAllTests();
    const interceptors = await this.getAllInterceptors();
    return { tests, interceptors };
  }

  /**
   * Importa datos desde un archivo
   */
  public async importData(data: { tests?: any[]; interceptors?: any[] }): Promise<void> {
    if (!data.tests || !Array.isArray(data.tests)) {
      throw new Error('Formato de datos inválido');
    }

    await this.clearAllData();

    // Importar tests con sus comandos e interceptadores
    for (const test of data.tests) {
      await this.insertTest(test.name, test.commands || [], test.interceptors || []);
    }

    console.log('✅ Datos importados correctamente');
  }

  // ============ MÉTODOS PRIVADOS - HELPERS ============

  private dbAdd(store: string, data: any, tx: IDBTransaction): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(store).add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private dbPut(store: string, data: any, tx: IDBTransaction): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(store).put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private dbDelete(store: string, key: any, tx: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(store).delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private dbGetAll(store: string, tx: IDBTransaction): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(store).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  private dbGetByIndex(store: string, index: string, value: any, tx: IDBTransaction): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(store).index(index).getAll(value);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  private dbClear(store: string, tx: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(store).clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
