import { describe, it, expect } from 'vitest';
import { SUPPORTED_LANGS, isLang } from '../src/models/lang.model';
import { INPUT_TYPES } from '../src/models/input-types.model';
import { DB_SCHEMA, DB_STORE_NAMES } from '../src/models/db-schema.model';

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

    it('DB version is 10', () => {
      expect(DB_SCHEMA.version).toBe(10);
    });

    it('defines exactly 4 stores', () => {
      expect(DB_SCHEMA.stores).toHaveLength(4);
    });

    it('all stores use autoIncrement with keyPath id', () => {
      for (const store of DB_SCHEMA.stores) {
        expect(store.autoIncrement).toBe(true);
        expect(store.keyPath).toBe('id');
      }
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

    it('DB_STORE_NAMES contains the 4 store names', () => {
      expect(DB_STORE_NAMES).toEqual(
        expect.arrayContaining(['tests', 'commands', 'interceptors', 'configuration'])
      );
      expect(DB_STORE_NAMES).toHaveLength(4);
    });
  });

});
