import { openDB, type IDBPDatabase } from 'idb';
import { DB_SCHEMA } from '../models/db-schema.model';
import type { ActiveSessionState } from '../models/active-session.model';
import { isLoginSetupConfig, type LoginSetupConfig } from '../models/login-setup.model';
import { normalizeBlock, escapeSingleQuotes } from '../utils/code-format.utils';
import { buildTicketComment } from '../utils/ticket.utils';

/** Fixed primary key for the single active-session record. */
const ACTIVE_SESSION_ID = 1;

type TestRecord        = { id: number; name: string; createdAt: number; tags?: string[]; notes?: string; ticketId?: string; };
type CommandRecord     = { id: number; command: string; testId: number; createdAt: number; };
type InterceptorRecord = { id: number; interceptor: string; testId: number; createdAt: number; };
type ConfigRecord      = { id: number; [key: string]: unknown; };

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
    return this._db as Promise<IDBPDatabase>;
  }

  // ── Tests ─────────────────────────────────────────────────────────────────

  async insertTest(name: string, commands: string[] = [], interceptors: string[] = [], tags: string[] = [], notes?: string, ticketId?: string): Promise<number> {
    const db = await this.getDB();
    const record: Omit<TestRecord, 'id'> = { name, createdAt: Date.now(), ...(tags.length ? { tags } : {}), ...(notes ? { notes } : {}), ...(ticketId ? { ticketId } : {}) };
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
    const ticketComment = record.ticketId ? buildTicketComment(record.ticketId) + '\n' : '';
    const itBlock = `${ticketComment}it('${escapeSingleQuotes(record.name)}', () => {\n${commands.map(c => normalizeBlock(c, '  ')).join('\n')}\n});`;
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

  // ── Login setup config ───────────────────────────────────────────────────

  private static readonly LOGIN_SETUP_KEY = 'loginSetupConfig';

  async saveLoginSetup(config: LoginSetupConfig): Promise<void> {
    await this.setConfigKey(PersistenceService.LOGIN_SETUP_KEY, JSON.stringify(config));
  }

  async getLoginSetup(): Promise<LoginSetupConfig | null> {
    const record = await this.getConfig(PersistenceService.LOGIN_SETUP_KEY);
    if (!record) return null;
    const raw = record[PersistenceService.LOGIN_SETUP_KEY];
    if (typeof raw !== 'string') return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      return isLoginSetupConfig(parsed) ? parsed : null;
    } catch { return null; }
  }

  async clearLoginSetup(): Promise<void> {
    const db      = await this.getDB();
    const records = await db.getAll('configuration') as ConfigRecord[];
    if (!records.length) return;
    const current = { ...records[0] };
    delete current[PersistenceService.LOGIN_SETUP_KEY];
    await db.put('configuration', current);
  }

  // ── Active recording session ──────────────────────────────────────────────

  /** Upserts the live recording session (single record, fixed key). */
  async saveActiveSession(state: ActiveSessionState): Promise<void> {
    const db = await this.getDB();
    await db.put('activeSession', { ...state, id: ACTIVE_SESSION_ID });
  }

  /** Returns the persisted live session, or null when none is stored. */
  async getActiveSession(): Promise<ActiveSessionState | null> {
    const db     = await this.getDB();
    const record = await db.get('activeSession', ACTIVE_SESSION_ID) as (ActiveSessionState & { id: number }) | undefined;
    if (!record) return null;
    const { id: _id, ...state } = record;
    return state as ActiveSessionState;
  }

  /** Removes the live session record. Safe to call when none exists. */
  async clearActiveSession(): Promise<void> {
    const db = await this.getDB();
    await db.delete('activeSession', ACTIVE_SESSION_ID);
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
    if (Array.isArray(tests)) {
      const db = await this.getDB();
      for (const test of tests) {
        // Split the nested commands/interceptors back into their own stores,
        // keyed by the freshly-assigned testId — otherwise they would be stored
        // as stray fields and silently lost on read (getAllTests reads them by
        // testId from the commands/interceptors stores).
        const { id: _id, commands, interceptors: testInterceptors, ...record } = test;
        const newId = await db.add('tests', record) as number;
        const cmds = Array.isArray(commands) ? commands as string[] : [];
        const icps = Array.isArray(testInterceptors) ? testInterceptors as string[] : [];
        if (cmds.length) await this.insertCommands(cmds, newId);
        if (icps.length) await this.insertInterceptors(icps, newId);
      }
    }
    // Back-compat: legacy files may carry top-level interceptors with their own testId.
    await this.bulkInsertWithoutId('interceptors', interceptors);
  }

  async hasDirectoryAccess(): Promise<boolean> {
    const config = await this.getGeneralConfig();
    return !!config?.['cypressDirectoryHandle'];
  }

  async writeUploadedFile(filename: string, bytes: ArrayBuffer): Promise<void> {
    const config = await this.getGeneralConfig();
    const dirHandle = config?.['cypressDirectoryHandle'] as FileSystemDirectoryHandle | undefined;
    if (!dirHandle) throw new Error('No Cypress folder configured');

    const perm = dirHandle as unknown as FileSystemHandleWithPermission;
    let state = await perm.queryPermission({ mode: 'readwrite' });
    if (state !== 'granted') state = await perm.requestPermission({ mode: 'readwrite' });
    if (state !== 'granted') throw new Error('Write permission denied');

    const fixturesDir = await dirHandle.getDirectoryHandle('fixtures', { create: true });
    const fileHandle = await fixturesDir.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(bytes);
    await writable.close();
  }

  async requestDirectoryPermissions(): Promise<void> {
    if (!('showDirectoryPicker' in window)) {
      throw new Error('File System Access API not supported');
    }
    const dirHandle = await window.showDirectoryPicker();
    await this.setConfigKey('cypressDirectoryHandle', dirHandle);
    await this.setConfigKey('allowReadWriteFiles', 'true');
  }

  /**
   * Writes captured fixtures into `cypress/fixtures/` using the configured Cypress
   * folder handle (spec 012). Returns the number written. Throws if no folder is
   * configured or write permission is denied.
   */
  async writeFixtures(fixtures: Array<{ name: string; content: string }>): Promise<number> {
    if (!fixtures.length) return 0;
    const config = await this.getGeneralConfig();
    const dirHandle = config?.['cypressDirectoryHandle'] as FileSystemDirectoryHandle | undefined;
    if (!dirHandle) throw new Error('No Cypress folder configured');

    const perm = dirHandle as unknown as FileSystemHandleWithPermission;
    let state = await perm.queryPermission({ mode: 'readwrite' });
    if (state !== 'granted') state = await perm.requestPermission({ mode: 'readwrite' });
    if (state !== 'granted') throw new Error('Write permission denied');

    const fixturesDir = await dirHandle.getDirectoryHandle('fixtures', { create: true });
    let written = 0;
    for (const fx of fixtures) {
      const fileHandle = await fixturesDir.getFileHandle(fx.name, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(fx.content);
      await writable.close();
      written++;
    }
    return written;
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
