import { describe, it, expect } from 'vitest';
import { SUPPORTED_LANGS, isLang, localeForLang } from '../src/models/lang.model';
import { INPUT_TYPES } from '../src/models/input-types.model';
import { DB_SCHEMA, DB_STORE_NAMES } from '../src/models/db-schema.model';
import {
  ACTIVE_SESSION_BREADCRUMB_KEY,
  RESUME_TTL_CONFIG_KEY,
  DEFAULT_RESUME_TTL_MINUTES,
} from '../src/models/active-session.model';

describe('Phase 1 — Models', () => {

  describe('lang.model', () => {
    it('SUPPORTED_LANGS contains exactly 5 languages', () => {
      expect(SUPPORTED_LANGS).toHaveLength(5);
    });

    it('SUPPORTED_LANGS contains es, en, fr, it, de', () => {
      expect(SUPPORTED_LANGS).toEqual(expect.arrayContaining(['es', 'en', 'fr', 'it', 'de']));
    });

    it('isLang returns true for each valid language', () => {
      for (const lang of ['es', 'en', 'fr', 'it', 'de']) {
        expect(isLang(lang)).toBe(true);
      }
    });

    it('isLang returns false for unknown codes', () => {
      expect(isLang('xx')).toBe(false);
      expect(isLang('')).toBe(false);
      expect(isLang('ES')).toBe(false);
      expect(isLang('english')).toBe(false);
    });

    it('localeForLang maps each language to its BCP-47 locale', () => {
      expect(localeForLang('es')).toBe('es-ES');
      expect(localeForLang('en')).toBe('en-GB');
      expect(localeForLang('fr')).toBe('fr-FR');
      expect(localeForLang('it')).toBe('it-IT');
      expect(localeForLang('de')).toBe('de-DE');
    });

    it('localeForLang falls back to es-ES for an unknown code', () => {
      expect(localeForLang('xx')).toBe('es-ES');
    });
  });

  describe('input-types.model', () => {
    it('INPUT_TYPES contains exactly 8 types', () => {
      expect(INPUT_TYPES).toHaveLength(8);
    });

    it('INPUT_TYPES contains all expected types', () => {
      expect(INPUT_TYPES).toEqual(
        expect.arrayContaining(['text', 'password', 'email', 'search', 'tel', 'url', 'number', 'textarea'])
      );
    });
  });

  describe('db-schema.model', () => {
    it('DB name is E2ECypressDB', () => {
      expect(DB_SCHEMA.name).toBe('E2ECypressDB');
    });

    it('DB version is 11', () => {
      expect(DB_SCHEMA.version).toBe(11);
    });

    it('defines exactly 5 stores', () => {
      expect(DB_SCHEMA.stores).toHaveLength(5);
    });

    it('all stores keyPath is id', () => {
      for (const store of DB_SCHEMA.stores) {
        expect(store.keyPath).toBe('id');
      }
    });

    it('data stores auto-increment; the single-record activeSession store does not', () => {
      for (const store of DB_SCHEMA.stores) {
        expect(store.autoIncrement).toBe(store.name !== 'activeSession');
      }
    });

    it('defines the activeSession store with no indexes', () => {
      const store = DB_SCHEMA.stores.find(s => s.name === 'activeSession');
      expect(store).toBeDefined();
      expect(store!.indexes).toHaveLength(0);
    });

    it('tests store has indexes: name, createdAt', () => {
      const store = DB_SCHEMA.stores.find(s => s.name === 'tests');
      expect(store).toBeDefined();
      const names = store!.indexes.map(i => i.name);
      expect(names).toContain('name');
      expect(names).toContain('createdAt');
    });

    it('commands store has indexes: command, testId, createdAt', () => {
      const store = DB_SCHEMA.stores.find(s => s.name === 'commands');
      expect(store).toBeDefined();
      const names = store!.indexes.map(i => i.name);
      expect(names).toContain('command');
      expect(names).toContain('testId');
      expect(names).toContain('createdAt');
    });

    it('interceptors store has indexes: interceptor, testId, createdAt', () => {
      const store = DB_SCHEMA.stores.find(s => s.name === 'interceptors');
      expect(store).toBeDefined();
      const names = store!.indexes.map(i => i.name);
      expect(names).toContain('interceptor');
      expect(names).toContain('testId');
      expect(names).toContain('createdAt');
    });

    it('configuration store has indexes: language, extendedHttpCommands, allowReadWriteFiles', () => {
      const store = DB_SCHEMA.stores.find(s => s.name === 'configuration');
      expect(store).toBeDefined();
      const names = store!.indexes.map(i => i.name);
      expect(names).toContain('language');
      expect(names).toContain('extendedHttpCommands');
      expect(names).toContain('allowReadWriteFiles');
    });

    it('each index keyPath matches its name (no keyPath/name mismatch)', () => {
      for (const store of DB_SCHEMA.stores) {
        for (const index of store.indexes) {
          expect(index.keyPath).toBe(index.name);
        }
      }
    });

    it('DB_STORE_NAMES contains the 5 store names', () => {
      expect(DB_STORE_NAMES).toEqual(
        expect.arrayContaining(['tests', 'commands', 'interceptors', 'configuration', 'activeSession'])
      );
      expect(DB_STORE_NAMES).toHaveLength(5);
    });
  });

  describe('active-session.model', () => {
    it('breadcrumb key is e2e-active-session', () => {
      expect(ACTIVE_SESSION_BREADCRUMB_KEY).toBe('e2e-active-session');
    });

    it('resume TTL config key is resumeRecencyTtlMinutes', () => {
      expect(RESUME_TTL_CONFIG_KEY).toBe('resumeRecencyTtlMinutes');
    });

    it('default resume TTL is 30 minutes', () => {
      expect(DEFAULT_RESUME_TTL_MINUTES).toBe(30);
    });
  });

});
