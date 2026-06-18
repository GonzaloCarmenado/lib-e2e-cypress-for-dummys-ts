import { describe, it, expect } from 'vitest';
import { selectTestsForExport } from '../../src/utils/export-selection.utils';
import type { TestWithDetails } from '../../src/services/persistence.service';

function makeTest(id: number, tags?: string[]): TestWithDetails {
  return { id, name: `test-${id}`, createdAt: id, tags, commands: [], interceptors: [] };
}

describe('selectTestsForExport', () => {
  const tests: TestWithDetails[] = [
    makeTest(1, ['smoke', 'login']),
    makeTest(2, ['login']),
    makeTest(3, ['regression']),
    makeTest(4),                       // no tags
  ];

  describe('all mode', () => {
    it('returns every test', () => {
      expect(selectTestsForExport(tests, 'all')).toHaveLength(4);
    });

    it('returns a shallow copy (does not return the same array reference)', () => {
      const result = selectTestsForExport(tests, 'all');
      expect(result).not.toBe(tests);
      expect(result).toEqual(tests);
    });
  });

  describe('manual mode', () => {
    it('returns only tests whose id is selected (Set)', () => {
      const result = selectTestsForExport(tests, 'manual', { ids: new Set([1, 3]) });
      expect(result.map((t) => t.id)).toEqual([1, 3]);
    });

    it('accepts an array of ids', () => {
      const result = selectTestsForExport(tests, 'manual', { ids: [2, 4] });
      expect(result.map((t) => t.id)).toEqual([2, 4]);
    });

    it('returns empty when no ids are given', () => {
      expect(selectTestsForExport(tests, 'manual')).toEqual([]);
      expect(selectTestsForExport(tests, 'manual', { ids: [] })).toEqual([]);
    });

    it('ignores ids that do not match any test', () => {
      const result = selectTestsForExport(tests, 'manual', { ids: [99] });
      expect(result).toEqual([]);
    });
  });

  describe('tags mode (OR)', () => {
    it('returns tests carrying at least one selected tag', () => {
      const result = selectTestsForExport(tests, 'tags', { tags: ['login'] });
      expect(result.map((t) => t.id)).toEqual([1, 2]);
    });

    it('unions tests across multiple tags (OR, no duplicates)', () => {
      const result = selectTestsForExport(tests, 'tags', { tags: ['login', 'regression'] });
      expect(result.map((t) => t.id)).toEqual([1, 2, 3]);
    });

    it('returns empty when no tags are given', () => {
      expect(selectTestsForExport(tests, 'tags')).toEqual([]);
      expect(selectTestsForExport(tests, 'tags', { tags: [] })).toEqual([]);
    });

    it('returns empty when no test matches the selected tags', () => {
      expect(selectTestsForExport(tests, 'tags', { tags: ['nope'] })).toEqual([]);
    });

    it('never includes tests without tags', () => {
      const result = selectTestsForExport(tests, 'tags', { tags: ['smoke', 'login', 'regression'] });
      expect(result.map((t) => t.id)).not.toContain(4);
    });
  });

  it('does not mutate the input array', () => {
    const input = [...tests];
    selectTestsForExport(input, 'manual', { ids: [1] });
    expect(input).toEqual(tests);
  });
});
