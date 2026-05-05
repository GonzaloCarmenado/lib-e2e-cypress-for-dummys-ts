import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

describe('Phase 0 — Project setup', () => {

  describe('package.json', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));

    it('has a name', () => {
      expect(pkg.name).toBeTruthy();
    });

    it('exports field has ESM entry (.js)', () => {
      expect(pkg.exports['.'].import).toMatch(/\.js$/);
    });

    it('exports field has CJS entry (.cjs)', () => {
      expect(pkg.exports['.'].require).toMatch(/\.cjs$/);
    });

    it('exports field has types entry (.d.ts)', () => {
      expect(pkg.exports['.'].types).toMatch(/\.d\.ts$/);
    });

    it('has build script', () => {
      expect(pkg.scripts?.build).toBeTruthy();
    });

    it('has test script', () => {
      expect(pkg.scripts?.test).toBeTruthy();
    });
  });

  describe('tsconfig.json', () => {
    const tsconfig = JSON.parse(readFileSync(resolve(ROOT, 'tsconfig.json'), 'utf-8'));

    it('targets ES2022', () => {
      expect(tsconfig.compilerOptions.target).toBe('ES2022');
    });

    it('includes DOM lib', () => {
      expect(tsconfig.compilerOptions.lib).toContain('DOM');
    });

    it('strict mode is enabled', () => {
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });

    it('declaration generation is enabled', () => {
      expect(tsconfig.compilerOptions.declaration).toBe(true);
    });
  });

  describe('src/index.ts', () => {
    it('exists', () => {
      expect(existsSync(resolve(ROOT, 'src', 'index.ts'))).toBe(true);
    });
  });

  describe('dist output (requires npm run build)', () => {
    it('ESM bundle exists', () => {
      expect(existsSync(resolve(ROOT, 'dist', 'index.js'))).toBe(true);
    });

    it('CJS bundle exists', () => {
      expect(existsSync(resolve(ROOT, 'dist', 'index.cjs'))).toBe(true);
    });

    it('type declarations exist', () => {
      expect(existsSync(resolve(ROOT, 'dist', 'index.d.ts'))).toBe(true);
    });
  });

});
