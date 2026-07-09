import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PersistenceService } from '../src/services/persistence.service';
import type { ActiveSessionState } from '../src/models/active-session.model';

function makeSession(overrides: Partial<ActiveSessionState> = {}): ActiveSessionState {
  return {
    sessionId: 'sess-1',
    isRecording: true,
    isPaused: false,
    commands: ["cy.visit('/')", "cy.get('#x').click()"],
    interceptors: ["cy.intercept('GET', '**/api').as('a')"],
    selectorStrategy: 'data-cy',
    startedAt: 1000,
    updatedAt: 2000,
    ...overrides,
  };
}

// Each test gets a unique DB name — no shared state, no cleanup needed.
let dbCounter = 0;

describe('Phase 5 — PersistenceService', () => {
  let service: PersistenceService;

  beforeEach(() => {
    service = new PersistenceService(`test_db_${++dbCounter}`);
  });

  // ── insertTest / getAllTests ──────────────────────────────────────────────

  describe('insertTest', () => {
    it('returns a numeric id greater than 0', async () => {
      const id = await service.insertTest('my test');
      expect(typeof id).toBe('number');
      expect(id).toBeGreaterThan(0);
    });

    it('test is retrievable via getAllTests', async () => {
      await service.insertTest('login flow');
      const tests = await service.getAllTests();
      expect(tests).toHaveLength(1);
      expect(tests[0].name).toBe('login flow');
    });

    it('commands are stored and returned inside the test object', async () => {
      await service.insertTest('with cmds', ["cy.visit('/')", "cy.get('[data-cy=\"btn\"]').click()"]);
      const tests = await service.getAllTests();
      expect(tests[0].commands).toHaveLength(2);
      expect(tests[0].commands).toContain("cy.visit('/')");
    });

    it('interceptors are stored and returned inside the test object', async () => {
      await service.insertTest('with ints', [], ["cy.intercept('GET', '**/api').as('api')"]);
      const tests = await service.getAllTests();
      expect(tests[0].interceptors).toHaveLength(1);
    });

    it('multiple tests are all returned by getAllTests', async () => {
      await service.insertTest('test A');
      await service.insertTest('test B');
      const tests = await service.getAllTests();
      expect(tests).toHaveLength(2);
    });
  });

  // ── getTestById ──────────────────────────────────────────────────────────

  describe('getTestById', () => {
    it('returns null for a non-existent id', async () => {
      const result = await service.getTestById(999);
      expect(result).toBeNull();
    });

    it('returns the test with an itBlock containing the description', async () => {
      const id = await service.insertTest('login flow', ["cy.visit('/login')"]);
      const test = await service.getTestById(id);
      expect(test.itBlock).toContain("it('login flow'");
      expect(test.itBlock).toContain("cy.visit('/login')");
    });

    it('itBlock indents each command with two spaces', async () => {
      const id = await service.insertTest('indent test', ["cy.visit('/')"]);
      const test = await service.getTestById(id);
      expect(test.itBlock).toContain("  cy.visit('/')");
    });

    it('escapes single quotes in the test name so the itBlock is valid JS', async () => {
      const id = await service.insertTest("User's login", ["cy.visit('/')"]);
      const test = await service.getTestById(id);
      expect(test!.itBlock).toContain("it('User\\'s login', () => {");
    });

    it('returns a non-empty interceptorsBlock when interceptors exist', async () => {
      const id = await service.insertTest('with ints', [], ["cy.intercept('GET', '**/api').as('api')"]);
      const test = await service.getTestById(id);
      expect(test.interceptorsBlock).toContain('cy.intercept');
    });

    it('returns an empty interceptorsBlock when no interceptors', async () => {
      const id = await service.insertTest('no ints', ["cy.visit('/')"]);
      const test = await service.getTestById(id);
      expect(test.interceptorsBlock).toBe('');
    });
  });

  // ── deleteTest ───────────────────────────────────────────────────────────

  describe('deleteTest', () => {
    it('removes the test from getAllTests', async () => {
      const id = await service.insertTest('to delete');
      await service.deleteTest(id);
      expect(await service.getAllTests()).toHaveLength(0);
    });

    it('also deletes associated commands', async () => {
      const id = await service.insertTest('to delete', ["cy.visit('/')"]);
      await service.deleteTest(id);
      expect(await service.getCommandsByTestId(id)).toHaveLength(0);
    });

    it('also deletes associated interceptors', async () => {
      const id = await service.insertTest('to delete', [], ["cy.intercept('GET', '**/api').as('api')"]);
      await service.deleteTest(id);
      expect(await service.getInterceptorsByTestId(id)).toHaveLength(0);
    });
  });

  // ── insertCommands / getCommandsByTestId ─────────────────────────────────

  describe('insertCommands / getCommandsByTestId', () => {
    it('links commands to a test and retrieves them', async () => {
      const id = await service.insertTest('cmd test');
      await service.insertCommands(["cy.visit('/')", "cy.get('.btn').click()"], id);
      const cmds = await service.getCommandsByTestId(id);
      expect(cmds).toHaveLength(2);
    });

    it('returns empty array for a test with no commands', async () => {
      const id = await service.insertTest('empty test');
      expect(await service.getCommandsByTestId(id)).toHaveLength(0);
    });
  });

  // ── insertInterceptors / getInterceptorsByTestId ─────────────────────────

  describe('insertInterceptors / getInterceptorsByTestId', () => {
    it('links interceptors to a test and retrieves them', async () => {
      const id = await service.insertTest('int test');
      await service.insertInterceptors(["cy.intercept('GET', '**/api').as('api')"], id);
      const ints = await service.getInterceptorsByTestId(id);
      expect(ints).toHaveLength(1);
    });
  });

  // ── setConfig / getConfig ────────────────────────────────────────────────

  describe('setConfig / getConfig', () => {
    it('stores a value and retrieves it', async () => {
      await service.setConfig({ language: 'en' });
      const result = await service.getConfig('language');
      expect(result).toMatchObject({ language: 'en' });
    });

    it('merges successive setConfig calls (does not overwrite)', async () => {
      await service.setConfig({ language: 'en' });
      await service.setConfig({ extendedHttpCommands: 'true' });
      expect(await service.getConfig('language')).toMatchObject({ language: 'en' });
      expect(await service.getConfig('extendedHttpCommands')).toMatchObject({ extendedHttpCommands: 'true' });
    });

    it('returns null for a key that has never been set', async () => {
      expect(await service.getConfig('nonexistent')).toBeNull();
    });

    it('setConfigKey stores a single key', async () => {
      await service.setConfigKey('language', 'fr');
      expect(await service.getConfig('language')).toMatchObject({ language: 'fr' });
    });
  });

  // ── clearAllData ─────────────────────────────────────────────────────────

  describe('clearAllData', () => {
    it('empties the tests store', async () => {
      await service.insertTest('to clear');
      await service.clearAllData();
      expect(await service.getAllTests()).toHaveLength(0);
    });

    it('also clears commands and interceptors', async () => {
      const id = await service.insertTest('to clear', ["cy.visit('/')"], ["cy.intercept('GET', '**/api').as('api')"]);
      await service.clearAllData();
      expect(await service.getCommandsByTestId(id)).toHaveLength(0);
      expect(await service.getInterceptorsByTestId(id)).toHaveLength(0);
    });
  });

  // ── ingestFileData ───────────────────────────────────────────────────────

  describe('ingestFileData', () => {
    it('inserts imported tests', async () => {
      await service.ingestFileData(
        [{ name: 'imported test', createdAt: Date.now() }],
        []
      );
      const tests = await service.getAllTests();
      expect(tests).toHaveLength(1);
      expect(tests[0].name).toBe('imported test');
    });

    it('strips the original id so a new one is auto-assigned', async () => {
      await service.ingestFileData(
        [{ id: 999, name: 'with id', createdAt: Date.now() }],
        []
      );
      const tests = await service.getAllTests();
      expect(tests[0].id).not.toBe(999);
    });

    it('splits nested commands and interceptors into their own stores', async () => {
      await service.ingestFileData(
        [{
          id: 5, name: 'login', createdAt: 111, tags: ['smoke'], notes: 'note',
          commands: ["cy.visit('/')", "cy.get('#x').click()"],
          interceptors: ["cy.intercept('GET', '*').as('a')"],
        }],
        []
      );
      const tests = await service.getAllTests();
      expect(tests).toHaveLength(1);
      expect(tests[0].commands).toEqual(["cy.visit('/')", "cy.get('#x').click()"]);
      expect(tests[0].interceptors).toEqual(["cy.intercept('GET', '*').as('a')"]);
      expect(tests[0].tags).toEqual(['smoke']);
      expect(tests[0].notes).toBe('note');
    });

    it('does not store the nested arrays as stray fields on the test record', async () => {
      await service.ingestFileData(
        [{ id: 1, name: 't', createdAt: 1, commands: ["cy.visit('/')"], interceptors: [] }],
        []
      );
      const tests = await service.getAllTests();
      // getAllTests rebuilds commands/interceptors from their stores; the raw
      // record must not carry a leftover nested array that shadows them.
      const id = tests[0].id;
      expect(await service.getCommandsByTestId(id)).toHaveLength(1);
    });

    it('preserves the original createdAt of imported tests', async () => {
      await service.ingestFileData(
        [{ id: 1, name: 't', createdAt: 999, commands: [], interceptors: [] }],
        []
      );
      const tests = await service.getAllTests();
      expect(tests[0].createdAt).toBe(999);
    });

    it('round-trips a full export back through getAllTests', async () => {
      const original = await service.insertTest('flow', ["cy.visit('/')"], ["cy.intercept('GET', '*').as('a')"], ['smoke'], 'notes');
      const exported = await service.getAllTests();
      await service.clearAllData();
      await service.ingestFileData(exported as unknown as Record<string, unknown>[], []);
      const restored = await service.getAllTests();
      expect(restored).toHaveLength(1);
      expect(restored[0].name).toBe('flow');
      expect(restored[0].commands).toEqual(["cy.visit('/')"]);
      expect(restored[0].interceptors).toEqual(["cy.intercept('GET', '*').as('a')"]);
      expect(original).toBeGreaterThan(0);
    });
  });

  // ── notes ────────────────────────────────────────────────────────────────

  describe('insertTest with notes', () => {
    it('stores notes and returns it in getAllTests', async () => {
      await service.insertTest('noted test', [], [], [], 'This test validates the login flow.');
      const tests = await service.getAllTests();
      expect(tests[0].notes).toBe('This test validates the login flow.');
    });

    it('stores notes and returns it in getTestById', async () => {
      const id = await service.insertTest('noted test', [], [], [], 'Multi-line\nnotes here.');
      const test = await service.getTestById(id);
      expect(test!.notes).toBe('Multi-line\nnotes here.');
    });

    it('test without notes has undefined or absent notes', async () => {
      await service.insertTest('no notes test');
      const tests = await service.getAllTests();
      expect(tests[0].notes == null).toBe(true);
    });
  });

  // ── active recording session ───────────────────────────────────────────────

  describe('active session', () => {
    it('getActiveSession returns null when none is stored', async () => {
      expect(await service.getActiveSession()).toBeNull();
    });

    it('saveActiveSession then getActiveSession round-trips the state', async () => {
      const session = makeSession();
      await service.saveActiveSession(session);
      const stored = await service.getActiveSession();
      expect(stored).toEqual(session);
    });

    it('does not leak the internal fixed id onto the returned state', async () => {
      await service.saveActiveSession(makeSession());
      const stored = await service.getActiveSession() as Record<string, unknown>;
      expect('id' in stored).toBe(false);
    });

    it('saveActiveSession upserts (single record, last write wins)', async () => {
      await service.saveActiveSession(makeSession({ commands: ['a'] }));
      await service.saveActiveSession(makeSession({ commands: ['a', 'b', 'c'] }));
      const stored = await service.getActiveSession();
      expect(stored!.commands).toEqual(['a', 'b', 'c']);
    });

    it('clearActiveSession removes the stored session', async () => {
      await service.saveActiveSession(makeSession());
      await service.clearActiveSession();
      expect(await service.getActiveSession()).toBeNull();
    });

    it('clearActiveSession is safe to call when none exists', async () => {
      await expect(service.clearActiveSession()).resolves.toBeUndefined();
    });
  });

  // ── writeFixtures (spec 012) ────────────────────────────────────────────────

  describe('writeFixtures', () => {
    it('returns 0 for an empty list', async () => {
      expect(await service.writeFixtures([])).toBe(0);
    });

    it('throws when no Cypress folder is configured', async () => {
      await expect(service.writeFixtures([{ name: 'a.json', content: '{}' }])).rejects.toThrow();
    });

    it('writes each fixture into cypress/fixtures via the folder handle', async () => {
      const writes: Record<string, string> = {};
      const fixturesDir = {
        getFileHandle: vi.fn(async (name: string) => ({
          createWritable: async () => ({
            write: async (c: string) => { writes[name] = c; },
            close: async () => { /* noop */ },
          }),
        })),
      };
      const dirHandle = {
        queryPermission: async () => 'granted',
        requestPermission: async () => 'granted',
        getDirectoryHandle: vi.fn(async () => fixturesDir),
      };
      vi.spyOn(service, 'getGeneralConfig').mockResolvedValue({ id: 1, cypressDirectoryHandle: dirHandle } as never);

      const n = await service.writeFixtures([
        { name: 'a.json', content: '{"a":1}' },
        { name: 'b.json', content: '[]' },
      ]);

      expect(n).toBe(2);
      expect(dirHandle.getDirectoryHandle).toHaveBeenCalledWith('fixtures', { create: true });
      expect(writes['a.json']).toBe('{"a":1}');
      expect(writes['b.json']).toBe('[]');
    });

    it('requests permission when it is not already granted', async () => {
      const request = vi.fn(async () => 'granted');
      const dirHandle = {
        queryPermission: async () => 'prompt',
        requestPermission: request,
        getDirectoryHandle: async () => ({
          getFileHandle: async () => ({
            createWritable: async () => ({ write: async () => { /* noop */ }, close: async () => { /* noop */ } }),
          }),
        }),
      };
      vi.spyOn(service, 'getGeneralConfig').mockResolvedValue({ id: 1, cypressDirectoryHandle: dirHandle } as never);

      await service.writeFixtures([{ name: 'a.json', content: '{}' }]);
      expect(request).toHaveBeenCalled();
    });

    it('throws when write permission is denied', async () => {
      const dirHandle = {
        queryPermission: async () => 'denied',
        requestPermission: async () => 'denied',
        getDirectoryHandle: async () => ({ getFileHandle: async () => ({}) }),
      };
      vi.spyOn(service, 'getGeneralConfig').mockResolvedValue({ id: 1, cypressDirectoryHandle: dirHandle } as never);
      await expect(service.writeFixtures([{ name: 'a.json', content: '{}' }])).rejects.toThrow();
    });
  });

  // ── login setup config ───────────────────────────────────────────────────

  describe('login setup config', () => {
    const cfg = {
      enabled: true,
      filePath: 'cypress/common-services/login.service.ts',
      fileContent: 'export function fetchAuthToken() {}',
      detectedFunctions: ['fetchAuthToken'],
      beforeFn: 'fetchAuthToken',
      beforeEachFn: null,
    };

    it('getLoginSetup returns null when nothing is stored', async () => {
      expect(await service.getLoginSetup()).toBeNull();
    });

    it('saveLoginSetup then getLoginSetup round-trips the config', async () => {
      await service.saveLoginSetup(cfg);
      const stored = await service.getLoginSetup();
      expect(stored).toEqual(cfg);
    });

    it('saveLoginSetup overwrites a previous config', async () => {
      await service.saveLoginSetup(cfg);
      const updated = { ...cfg, beforeFn: null };
      await service.saveLoginSetup(updated);
      const stored = await service.getLoginSetup();
      expect(stored!.beforeFn).toBeNull();
    });

    it('clearLoginSetup removes the stored config', async () => {
      await service.saveLoginSetup(cfg);
      await service.clearLoginSetup();
      expect(await service.getLoginSetup()).toBeNull();
    });

    it('clearLoginSetup is safe to call when nothing is stored', async () => {
      await expect(service.clearLoginSetup()).resolves.toBeUndefined();
    });
  });

  // ── tags ─────────────────────────────────────────────────────────────────

  describe('insertTest with tags', () => {
    it('stores tags and returns them in getAllTests', async () => {
      await service.insertTest('tagged test', [], [], ['smoke', 'login']);
      const tests = await service.getAllTests();
      expect(tests[0].tags).toEqual(['smoke', 'login']);
    });

    it('test without tags has no tags field or empty tags', async () => {
      await service.insertTest('no tags test');
      const tests = await service.getAllTests();
      expect(tests[0].tags == null || tests[0].tags!.length === 0).toBe(true);
    });

    it('tags are preserved through getTestById', async () => {
      const id = await service.insertTest('tagged', [], [], ['regression']);
      const test = await service.getTestById(id);
      expect(test!.tags).toEqual(['regression']);
    });
  });
});
