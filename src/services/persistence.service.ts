import { openDB, type IDBPDatabase } from 'idb';
import { DB_SCHEMA } from '../models/db-schema.model';
import { normalizeBlock } from '../utils/code-format.utils';

interface TestRecord        { id: number; name: string; createdAt: number; tags?: string[]; notes?: string; }
interface CommandRecord     { id: number; command: string; testId: number; createdAt: number; }
interface InterceptorRecord { id: number; interceptor: string; testId: number; createdAt: number; }
interface ConfigRecord      { id: number; [key: string]: unknown; }

export interface TestWithDetails extends TestRecord {
  commands: string[];
  interceptors: string[];
}

export interface TestDetail extends TestWithDetails {
  cypressCommands: string[];
  itBlock: string;
  interceptorsBlock: string;
}

export class PersistenceService {
  private _db: Promise<IDBPDatabase> | null = null;

  // dbName is overridable so tests can use unique names for isolation.
  constructor(private readonly dbName: string = DB_SCHEMA.name) {}

  private getDB(): Promise<IDBPDatabase> {
    if (!this._db) {
      this._db = openDB(this.dbName, DB_SCHEMA.version, {
        upgrade(database) {
          for (const store of DB_SCHEMA.stores) {
            if (!database.objectStoreNames.contains(store.name)) {
              const os = database.createObjectStore(store.name, {
                keyPath: store.keyPath,
                autoIncrement: store.autoIncrement,
              });
              for (const index of store.indexes) {
                os.createIndex(index.name, index.keyPath, { unique: index.unique });
              }
            }
          }
        },
      });
    }
    return this._db;
  }

  // ── Tests ─────────────────────────────────────────────────────────────────

  async insertTest(name: string, commands: string[] = [], interceptors: string[] = [], tags: string[] = [], notes?: string): Promise<number> {
    const db = await this.getDB();
    const record: Omit<TestRecord, 'id'> = { name, createdAt: Date.now(), ...(tags.length ? { tags } : {}), ...(notes ? { notes } : {}) };
    const id = await db.add('tests', record) as number;
    if (commands.length)     await this.insertCommands(commands, id);
    if (interceptors.length) await this.insertInterceptors(interceptors, id);
    return id;
  }

  async getAllTests(): Promise<TestWithDetails[]> {
    const db    = await this.getDB();
    const tests = await db.getAll('tests') as TestRecord[];
    return Promise.all(
      tests.map(async (test) => ({
        ...test,
        commands:     await this.getCommandStrings(test.id),
        interceptors: await this.getInterceptorStrings(test.id),
      }))
    );
  }

  async getTestById(testId: number): Promise<TestDetail | null> {
    const db     = await this.getDB();
    const record = await db.get('tests', testId) as TestRecord | undefined;
    if (!record) return null;

    const commands     = await this.getCommandStrings(testId);
    const interceptors = await this.getInterceptorStrings(testId);
    const itBlock = `it('${record.name}', () => {\n${commands.map(c => normalizeBlock(c, '  ')).join('\n')}\n});`;
    const interceptorsBlock = interceptors.length
      ? '  // Auto-generated Cypress interceptors\n' +
        interceptors.map(i => normalizeBlock(i, '  ')).join('\n') + '\n'
      : '';

    return { ...record, commands, interceptors, cypressCommands: commands, itBlock, interceptorsBlock };
  }

  async deleteTest(id: number): Promise<void> {
    const db = await this.getDB();
    await db.delete('tests', id);
    await this.deleteCommandsByTestId(id);
    await this.deleteInterceptorsByTestId(id);
  }

  // ── Commands ──────────────────────────────────────────────────────────────

  async insertCommands(commands: string[], testId: number): Promise<void> {
    const db = await this.getDB();
    await Promise.all(
      commands.map((command) => db.add('commands', { command, testId, createdAt: Date.now() }))
    );
  }

  async getCommandsByTestId(testId: number): Promise<CommandRecord[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('commands', 'testId', testId) as Promise<CommandRecord[]>;
  }

  private async getCommandStrings(testId: number): Promise<string[]> {
    return (await this.getCommandsByTestId(testId)).map((r) => r.command).filter(Boolean);
  }

  private async deleteCommandsByTestId(testId: number): Promise<void> {
    const db   = await this.getDB();
    const rows = await this.getCommandsByTestId(testId);
    const tx   = db.transaction('commands', 'readwrite');
    await Promise.all(rows.map((r) => tx.store.delete(r.id)));
    await tx.done;
  }

  // ── Interceptors ──────────────────────────────────────────────────────────

  async insertInterceptors(interceptors: string[], testId: number): Promise<void> {
    const db = await this.getDB();
    await Promise.all(
      interceptors.map((interceptor) => db.add('interceptors', { interceptor, testId, createdAt: Date.now() }))
    );
  }

  async getInterceptorsByTestId(testId: number): Promise<InterceptorRecord[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('interceptors', 'testId', testId) as Promise<InterceptorRecord[]>;
  }

  private async getInterceptorStrings(testId: number): Promise<string[]> {
    return (await this.getInterceptorsByTestId(testId)).map((r) => r.interceptor).filter(Boolean);
  }

  async deleteInterceptorsByTestId(testId: number): Promise<void> {
    const db   = await this.getDB();
    const rows = await this.getInterceptorsByTestId(testId);
    const tx   = db.transaction('interceptors', 'readwrite');
    await Promise.all(rows.map((r) => tx.store.delete(r.id)));
    await tx.done;
  }

  // ── Configuration ─────────────────────────────────────────────────────────

  async setConfig(config: Record<string, unknown>): Promise<void> {
    const db      = await this.getDB();
    const records = await db.getAll('configuration') as ConfigRecord[];
    const current = records[0] ?? {};
    const merged  = { ...current, ...config };
    if ((current as ConfigRecord).id) {
      await db.put('configuration', merged);
    } else {
      await db.add('configuration', merged);
    }
  }

  async setConfigKey(key: string, value: unknown): Promise<void> {
    return this.setConfig({ [key]: value });
  }

  async getConfig(key: string): Promise<Record<string, unknown> | null> {
    const db      = await this.getDB();
    const records = await db.getAll('configuration') as ConfigRecord[];
    if (!records.length) return null;
    const config = records[0];
    return Object.prototype.hasOwnProperty.call(config, key) ? { [key]: config[key] } : null;
  }

  async getGeneralConfig(): Promise<ConfigRecord | null> {
    const db      = await this.getDB();
    const records = await db.getAll('configuration') as ConfigRecord[];
    return records[0] ?? null;
  }

  // ── Bulk operations ───────────────────────────────────────────────────────

  async clearAllData(): Promise<void> {
    const db = await this.getDB();
    await Promise.all([
      db.clear('tests'),
      db.clear('commands'),
      db.clear('interceptors'),
    ]);
  }

  async ingestFileData(tests: Record<string, unknown>[], interceptors: Record<string, unknown>[]): Promise<void> {
    await Promise.all([
      this.bulkInsertWithoutId('tests', tests),
      this.bulkInsertWithoutId('interceptors', interceptors),
    ]);
  }

  async requestDirectoryPermissions(): Promise<void> {
    if (!('showDirectoryPicker' in window)) {
      throw new Error('File System Access API not supported');
    }
    const dirHandle = await window.showDirectoryPicker();
    await this.setConfigKey('cypressDirectoryHandle', dirHandle);
    await this.setConfigKey('allowReadWriteFiles', 'true');
  }

  private async bulkInsertWithoutId(store: string, items: Record<string, unknown>[]): Promise<void> {
    if (!Array.isArray(items)) return;
    const db = await this.getDB();
    for (const item of items) {
      const { id: _id, ...rest } = item;
      await db.add(store, rest);
    }
  }
}

export const persistenceService = new PersistenceService();
