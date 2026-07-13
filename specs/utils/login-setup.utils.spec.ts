import { describe, it, expect } from 'vitest';
import {
  extractExportedFunctions,
  buildLoginScaffold,
  buildLoginImportPath,
  buildLoginBlocks,
  hasLoginBlocks,
  injectLoginBlocksIntoExisting,
} from '../../src/utils/login-setup.utils';

describe('login-setup.utils', () => {

  // ── extractExportedFunctions ────────────────────────────────────────────

  describe('extractExportedFunctions', () => {
    it('detects export function declarations', () => {
      const src = `export function fetchAuthToken() { return 'token'; }`;
      expect(extractExportedFunctions(src)).toContain('fetchAuthToken');
    });

    it('detects export async function declarations', () => {
      const src = `export async function fetchAuthToken() {}`;
      expect(extractExportedFunctions(src)).toContain('fetchAuthToken');
    });

    it('detects export const arrow functions', () => {
      const src = `export const setupInterceptors = () => {};`;
      expect(extractExportedFunctions(src)).toContain('setupInterceptors');
    });

    it('detects export const async arrow functions', () => {
      const src = `export const fetchToken = async () => {};`;
      expect(extractExportedFunctions(src)).toContain('fetchToken');
    });

    it('detects multiple functions', () => {
      const src = `
        export function fetchAuthToken() {}
        export const setupInterceptors = () => {};
        export async function loginAsAdmin() {}
      `;
      const result = extractExportedFunctions(src);
      expect(result).toContain('fetchAuthToken');
      expect(result).toContain('setupInterceptors');
      expect(result).toContain('loginAsAdmin');
      expect(result).toHaveLength(3);
    });

    it('ignores non-exported functions', () => {
      const src = `function privateHelper() {} export function publicFn() {}`;
      const result = extractExportedFunctions(src);
      expect(result).toContain('publicFn');
      expect(result).not.toContain('privateHelper');
    });

    it('ignores export const for non-function values', () => {
      const src = `export const NAME = 'value'; export function doLogin() {}`;
      const result = extractExportedFunctions(src);
      expect(result).toContain('doLogin');
      expect(result).not.toContain('NAME');
    });

    it('returns empty array for empty file', () => {
      expect(extractExportedFunctions('')).toEqual([]);
    });

    it('returns empty array when no exports exist', () => {
      const src = `function localFn() { const x = 1; }`;
      expect(extractExportedFunctions(src)).toEqual([]);
    });

    it('ignores commented-out exports', () => {
      const src = `// export function commented() {}\nexport function active() {}`;
      const result = extractExportedFunctions(src);
      expect(result).toContain('active');
      expect(result).not.toContain('commented');
    });
  });

  // ── buildLoginScaffold ──────────────────────────────────────────────────

  describe('buildLoginScaffold', () => {
    it('returns a non-empty string', () => {
      expect(buildLoginScaffold().length).toBeGreaterThan(0);
    });

    it('contains two exported functions', () => {
      const scaffold = buildLoginScaffold();
      const fns = extractExportedFunctions(scaffold);
      expect(fns).toHaveLength(2);
    });

    it('exported functions are named fetchAuthToken and setupRequestInterceptors', () => {
      const scaffold = buildLoginScaffold();
      const fns = extractExportedFunctions(scaffold);
      expect(fns).toContain('fetchAuthToken');
      expect(fns).toContain('setupRequestInterceptors');
    });

    it('contains a TODO comment inside each function', () => {
      const scaffold = buildLoginScaffold();
      expect(scaffold.match(/TODO/g)?.length).toBeGreaterThanOrEqual(2);
    });

    it('does not contain hardcoded credentials or URLs', () => {
      const scaffold = buildLoginScaffold();
      expect(scaffold).not.toMatch(/https?:\/\//);
      expect(scaffold).not.toMatch(/'[^']{4,}'|"[^"]{4,}"/); // no string literals with real values
    });
  });

  // ── buildLoginImportPath ────────────────────────────────────────────────

  describe('buildLoginImportPath', () => {
    it('returns relative path from sibling directory', () => {
      const from = 'cypress/e2e/login.cy.ts';
      const to   = 'cypress/common-services/login.service.ts';
      expect(buildLoginImportPath(from, to)).toBe('../common-services/login.service');
    });

    it('handles files in the same directory', () => {
      const from = 'cypress/e2e/login.cy.ts';
      const to   = 'cypress/e2e/login.service.ts';
      expect(buildLoginImportPath(from, to)).toBe('./login.service');
    });

    it('handles deeper nesting', () => {
      const from = 'cypress/e2e/integration/request/create.cy.ts';
      const to   = 'cypress/common-services/login.service.ts';
      expect(buildLoginImportPath(from, to)).toBe('../../../common-services/login.service');
    });

    it('strips the .ts extension from the import path', () => {
      const result = buildLoginImportPath('cypress/e2e/test.cy.ts', 'cypress/common-services/auth.service.ts');
      expect(result).not.toMatch(/\.ts$/);
    });
  });

  // ── buildLoginBlocks ────────────────────────────────────────────────────

  describe('buildLoginBlocks', () => {
    it('returns importLine, beforeBlock and beforeEachBlock', () => {
      const result = buildLoginBlocks('../common-services/login.service', 'fetchAuthToken', 'setupRequestInterceptors');
      expect(result).toHaveProperty('importLine');
      expect(result).toHaveProperty('beforeBlock');
      expect(result).toHaveProperty('beforeEachBlock');
    });

    it('importLine contains both function names and the import path', () => {
      const result = buildLoginBlocks('../common-services/login.service', 'fetchAuthToken', 'setupRequestInterceptors');
      expect(result.importLine).toContain('fetchAuthToken');
      expect(result.importLine).toContain('setupRequestInterceptors');
      expect(result.importLine).toContain('../common-services/login.service');
    });

    it('importLine only includes beforeFn when beforeEachFn is null', () => {
      const result = buildLoginBlocks('../common-services/login.service', 'fetchAuthToken', null);
      expect(result.importLine).toContain('fetchAuthToken');
      expect(result.importLine).not.toContain('setupRequestInterceptors');
    });

    it('beforeBlock calls the before function', () => {
      const result = buildLoginBlocks('../svc', 'fetchAuthToken', null);
      expect(result.beforeBlock).toContain('before(');
      expect(result.beforeBlock).toContain('fetchAuthToken');
    });

    it('beforeEachBlock calls the beforeEach function', () => {
      const result = buildLoginBlocks('../svc', null, 'setupRequestInterceptors');
      expect(result.beforeEachBlock).toContain('beforeEach(');
      expect(result.beforeEachBlock).toContain('setupRequestInterceptors');
    });

    it('beforeBlock is empty string when beforeFn is null', () => {
      const result = buildLoginBlocks('../svc', null, 'setupRequestInterceptors');
      expect(result.beforeBlock).toBe('');
    });

    it('beforeEachBlock is empty string when beforeEachFn is null', () => {
      const result = buildLoginBlocks('../svc', 'fetchAuthToken', null);
      expect(result.beforeEachBlock).toBe('');
    });

    it('all blocks are empty when both fns are null', () => {
      const result = buildLoginBlocks('../svc', null, null);
      expect(result.importLine).toBe('');
      expect(result.beforeBlock).toBe('');
      expect(result.beforeEachBlock).toBe('');
    });

    it('importLine deduplicates when before and beforeEach use the same function', () => {
      const result = buildLoginBlocks('../svc', 'doLogin', 'doLogin');
      const matches = (result.importLine.match(/doLogin/g) ?? []).length;
      expect(matches).toBe(1);
    });
  });

  // ── hasLoginBlocks ──────────────────────────────────────────────────────

  describe('hasLoginBlocks', () => {
    it('returns true when a function name appears as a call in the content', () => {
      const content = `import { fetchAuthToken } from '../login.service';\ndescribe('x', () => {\n  before(() => { fetchAuthToken(); });\n});`;
      expect(hasLoginBlocks(content, ['fetchAuthToken'])).toBe(true);
    });

    it('returns false when no function name appears', () => {
      const content = `describe('x', () => {\n  it('y', () => {});\n});`;
      expect(hasLoginBlocks(content, ['fetchAuthToken'])).toBe(false);
    });

    it('returns true when any of the provided names is found', () => {
      const content = `setupInterceptors();\n`;
      expect(hasLoginBlocks(content, ['fetchAuthToken', 'setupInterceptors'])).toBe(true);
    });
  });

  // ── injectLoginBlocksIntoExisting ───────────────────────────────────────

  describe('injectLoginBlocksIntoExisting', () => {
    const base = `describe('suite', () => {\n  it('test', () => {});\n});\n`;

    it('prepends the import line', () => {
      const importLine = `import { fn } from './svc';`;
      const result = injectLoginBlocksIntoExisting(base, importLine, '', '');
      expect(result.startsWith(`${importLine}\n\n`)).toBe(true);
    });

    it('injects before block after describe opening', () => {
      const beforeBlock = '  before(() => { fn(); });\n';
      const result = injectLoginBlocksIntoExisting(base, '', beforeBlock, '');
      expect(result).toContain(`describe('suite', () => {\n${beforeBlock}`);
    });

    it('injects both before and beforeEach blocks', () => {
      const beforeBlock = '  before(() => { a(); });\n';
      const beforeEachBlock = '  beforeEach(() => { b(); });\n';
      const result = injectLoginBlocksIntoExisting(base, '', beforeBlock, beforeEachBlock);
      expect(result).toContain(`${beforeBlock}${beforeEachBlock}`);
    });

    it('does not duplicate the import if already present', () => {
      const importLine = `import { fn } from './svc';`;
      const withImport = `${importLine}\n\n${base}`;
      const result = injectLoginBlocksIntoExisting(withImport, importLine, '', '');
      const count = (result.match(/import \{ fn \}/g) ?? []).length;
      expect(count).toBe(1);
    });
  });
});
