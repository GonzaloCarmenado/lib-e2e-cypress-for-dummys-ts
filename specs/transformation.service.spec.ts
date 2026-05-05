import { describe, it, expect, vi } from 'vitest';
import { TransformationService } from '../src/services/transformation.service';
import { AdvancedTestTransformationService } from '../src/services/advanced-test.transformation.service';

// ─── helpers ────────────────────────────────────────────────────────────────

function mockDirHandle(name: string, entries: Array<{ name: string; kind: 'file' | 'directory'; children?: any[] }>): any {
  return {
    name,
    kind: 'directory',
    values: async function* () {
      for (const entry of entries) {
        if (entry.kind === 'directory') {
          yield mockDirHandle(entry.name, entry.children ?? []);
        } else {
          yield { name: entry.name, kind: 'file' };
        }
      }
    },
  };
}

const SAMPLE_FILE = `describe('my suite', () => {
  it('existing test', () => {
    cy.visit('/');
  });
});`;

// ─── TransformationService ───────────────────────────────────────────────────

describe('Phase 3 — TransformationService', () => {
  const service = new TransformationService();

  describe('toLang', () => {
    it('returns valid lang as-is', () => {
      expect(service.toLang('es')).toBe('es');
      expect(service.toLang('en')).toBe('en');
      expect(service.toLang('fr')).toBe('fr');
      expect(service.toLang('it')).toBe('it');
      expect(service.toLang('de')).toBe('de');
    });

    it('returns "en" for an unknown language code', () => {
      expect(service.toLang('xx')).toBe('en');
      expect(service.toLang('')).toBe('en');
      expect(service.toLang('ES')).toBe('en');
    });
  });

  describe('generateItDescription', () => {
    it('wraps commands in an it() block', () => {
      const result = service.generateItDescription('should login', [
        "cy.get('[data-cy=\"user\"]').type('admin')",
        "cy.get('[data-cy=\"submit\"]').click()",
      ]);
      expect(result).toContain("it('should login', () => {");
      expect(result).toContain("cy.get('[data-cy=\"user\"]').type('admin')");
      expect(result).toContain("cy.get('[data-cy=\"submit\"]').click()");
      expect(result).toMatch(/\}\s*\)\s*;?\s*$/);
    });

    it('indents each command with two spaces', () => {
      const result = service.generateItDescription('test', ['cy.visit("/")']);
      expect(result).toContain('  cy.visit("/")');
    });

    it('generates an empty it() block when commands array is empty', () => {
      const result = service.generateItDescription('empty test', []);
      expect(result).toContain("it('empty test', () => {");
      expect(result).toContain('});');
    });
  });
});

// ─── AdvancedTestTransformationService ──────────────────────────────────────

describe('Phase 3 — AdvancedTestTransformationService', () => {
  const service = new AdvancedTestTransformationService();

  describe('isFile', () => {
    it('returns true when kind is "file"', () => {
      expect(service.isFile({ kind: 'file', name: 'test.cy.ts' })).toBe(true);
    });

    it('returns false when kind is "directory"', () => {
      expect(service.isFile({ kind: 'directory', name: 'e2e' })).toBe(false);
    });

    it('returns false for null / undefined', () => {
      expect(service.isFile(null)).toBe(false);
      expect(service.isFile(undefined)).toBe(false);
    });
  });

  describe('insertBeforeEach', () => {
    it('inserts a beforeEach block right after the describe opening', () => {
      const interceptors = "    cy.intercept('GET', '**/api').as('api');\n";
      const result = service.insertBeforeEach(SAMPLE_FILE, interceptors);
      expect(result).toContain('beforeEach');
      expect(result).toContain(interceptors.trim());
      const describeIdx = result.indexOf('describe(');
      const beforeEachIdx = result.indexOf('beforeEach');
      expect(beforeEachIdx).toBeGreaterThan(describeIdx);
    });

    it('calls alertFn and returns "" when no describe block is found', () => {
      const alertFn = vi.fn();
      const result = service.insertBeforeEach('no describe here', 'interceptors', alertFn);
      expect(result).toBe('');
      expect(alertFn).toHaveBeenCalledWith('ADVANCED_EDITOR.NO_DESCRIBE');
    });

    it('works without alertFn (no throw)', () => {
      expect(() => service.insertBeforeEach('no describe', 'interceptors')).not.toThrow();
    });
  });

  describe('insertItBlock', () => {
    it('inserts the it() block before the last })', () => {
      const itBlock = "  it('new test', () => { cy.visit('/'); });";
      const result = service.insertItBlock(SAMPLE_FILE, itBlock);
      expect(result).toContain(itBlock);
      const itIdx = result.indexOf(itBlock);
      const lastClose = result.lastIndexOf('})');
      expect(itIdx).toBeLessThan(lastClose);
    });

    it('calls alertFn and returns "" when no }) is found', () => {
      const alertFn = vi.fn();
      const result = service.insertItBlock('no closing brace', 'it block', alertFn);
      expect(result).toBe('');
      expect(alertFn).toHaveBeenCalledWith('ADVANCED_EDITOR.NO_END');
    });

    it('works without alertFn (no throw)', () => {
      expect(() => service.insertItBlock('no closing brace', 'it block')).not.toThrow();
    });
  });

  describe('scanDirectory', () => {
    it('returns a node with name and kind=directory', async () => {
      const handle = mockDirHandle('e2e', []);
      const result = await service.scanDirectory(handle);
      expect(result.name).toBe('e2e');
      expect(result.kind).toBe('directory');
    });

    it('lists file children correctly', async () => {
      const handle = mockDirHandle('e2e', [
        { name: 'login.cy.ts', kind: 'file' },
        { name: 'home.cy.ts', kind: 'file' },
      ]);
      const result = await service.scanDirectory(handle);
      expect(result.children).toHaveLength(2);
      expect(result.children[0]).toMatchObject({ name: 'login.cy.ts', kind: 'file' });
    });

    it('recursively scans nested directories', async () => {
      const handle = mockDirHandle('e2e', [
        {
          name: 'auth',
          kind: 'directory',
          children: [{ name: 'login.cy.ts', kind: 'file' }],
        },
      ]);
      const result = await service.scanDirectory(handle);
      expect(result.children[0].kind).toBe('directory');
      expect(result.children[0].children[0].name).toBe('login.cy.ts');
    });

    it('returns empty children array for an empty directory', async () => {
      const handle = mockDirHandle('e2e', []);
      const result = await service.scanDirectory(handle);
      expect(result.children).toEqual([]);
    });
  });
});
