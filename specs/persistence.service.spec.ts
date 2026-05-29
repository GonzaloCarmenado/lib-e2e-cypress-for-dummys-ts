import { describe, it, expect, beforeEach } from 'vitest';
import { PersistenceService } from '../src/services/persistence.service';

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

    it('returns a non-empty interceptorsBlock when interceptors exist', async () => {
      const id = await service.insertTest('with ints', [], ["cy.intercept('GET', '**/api').as('api')"]);
      const test = await service.getTestById(id);
      expect(test.interceptorsBlock).toContain("cy.intercept");
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
