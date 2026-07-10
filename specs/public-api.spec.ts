import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as publicApi from '../src/index';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── helpers ────────────────────────────────────────────────────────────────

function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectTsFiles(full));
    } else if (entry.endsWith('.ts')) {
      results.push(full);
    }
  }
  return results;
}

// ─── suite ──────────────────────────────────────────────────────────────────

describe('Phase 9 — Public API & Build', () => {

  // ── public API surface ───────────────────────────────────────────────────

  describe('Public API exports from src/index.ts', () => {
    it('exports VERSION matching package.json', () => {
      const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));
      expect((publicApi as any).VERSION).toBe(pkg.version);
    });

    it('exports RecordingService class', () => {
      expect(typeof publicApi.RecordingService).toBe('function');
    });

    it('exports PersistenceService class', () => {
      expect(typeof publicApi.PersistenceService).toBe('function');
    });

    it('exports HttpMonitor class', () => {
      expect(typeof publicApi.HttpMonitor).toBe('function');
    });

    it('exports TranslationService class', () => {
      expect(typeof publicApi.TranslationService).toBe('function');
    });

    it('exports TransformationService class', () => {
      expect(typeof publicApi.TransformationService).toBe('function');
    });

    it('exports generateAlias function', () => {
      expect(typeof publicApi.generateAlias).toBe('function');
    });

    it('exports injectStyles function', () => {
      expect(typeof publicApi.injectStyles).toBe('function');
    });

    it('exports showToast function', () => {
      expect(typeof publicApi.showToast).toBe('function');
    });

    it('exports makeModalResizable function', () => {
      expect(typeof publicApi.makeModalResizable).toBe('function');
    });

    it('exports makeSwalDraggable function', () => {
      expect(typeof publicApi.makeSwalDraggable).toBe('function');
    });

    it('exports SCROLLBAR_STYLES constant', () => {
      expect(typeof (publicApi as any).SCROLLBAR_STYLES).toBe('string');
    });

    it('exports LIB_E2E_CYPRESS_FOR_DUMMYS_SWAL2_STYLES constant', () => {
      expect(typeof (publicApi as any).LIB_E2E_CYPRESS_FOR_DUMMYS_SWAL2_STYLES).toBe('string');
    });

    it('exports LibE2eRecorderElement class', () => {
      expect(typeof publicApi.LibE2eRecorderElement).toBe('function');
    });

    it('exports TestPrevisualizerElement class', () => {
      expect(typeof publicApi.TestPrevisualizerElement).toBe('function');
    });

    it('exports SaveTestElement class', () => {
      expect(typeof publicApi.SaveTestElement).toBe('function');
    });

    it('exports TestEditorElement class', () => {
      expect(typeof publicApi.TestEditorElement).toBe('function');
    });

    it('exports ConfigurationElement class', () => {
      expect(typeof publicApi.ConfigurationElement).toBe('function');
    });

    it('exports AdvancedTestEditorElement class', () => {
      expect(typeof (publicApi as any).AdvancedTestEditorElement).toBe('function');
    });

    it('exports FilePreviewElement class', () => {
      expect(typeof (publicApi as any).FilePreviewElement).toBe('function');
    });

    it('exports SelectorPickerElement class', () => {
      expect(typeof (publicApi as any).SelectorPickerElement).toBe('function');
    });

    it('exports HelpPanelElement class', () => {
      expect(typeof (publicApi as any).HelpPanelElement).toBe('function');
    });
  });

  // ── Custom Elements ──────────────────────────────────────────────────────

  describe('Custom Elements', () => {
    it('LibE2eRecorderElement extends HTMLElement', () => {
      expect(publicApi.LibE2eRecorderElement.prototype instanceof HTMLElement).toBe(true);
    });

    it('<lib-e2e-recorder> is registered in customElements registry', () => {
      expect(customElements.get('lib-e2e-recorder')).toBeDefined();
    });

    it('<test-previsualizer> is registered in customElements registry', () => {
      expect(customElements.get('lib-e2e-test-previsualizer')).toBeDefined();
    });

    it('<save-test> is registered in customElements registry', () => {
      expect(customElements.get('lib-e2e-save-test')).toBeDefined();
    });

    it('<test-editor> is registered in customElements registry', () => {
      expect(customElements.get('lib-e2e-test-editor')).toBeDefined();
    });

    it('<e2e-configuration> is registered in customElements registry', () => {
      expect(customElements.get('lib-e2e-configuration')).toBeDefined();
    });

    it('<advanced-test-editor> is registered in customElements registry', () => {
      expect(customElements.get('lib-e2e-advanced-test-editor')).toBeDefined();
    });

    it('<file-preview> is registered in customElements registry', () => {
      expect(customElements.get('lib-e2e-file-preview')).toBeDefined();
    });

    it('<selector-picker> is registered in customElements registry', () => {
      expect(customElements.get('lib-e2e-selector-picker')).toBeDefined();
    });

    it('<help-panel> is registered in customElements registry', () => {
      expect(customElements.get('lib-e2e-help-panel')).toBeDefined();
    });
  });

  // ── zero Angular dependencies ────────────────────────────────────────────

  describe('zero Angular dependencies', () => {
    it('no source file in src/ imports from @angular/', () => {
      const srcDir = resolve(ROOT, 'src');
      const violations = collectTsFiles(srcDir).filter((file) =>
        readFileSync(file, 'utf-8').includes('@angular/')
      );
      expect(violations).toEqual([]);
    });

    it('package.json dependencies do not include @angular/', () => {
      const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));
      const allDeps = {
        ...(pkg.dependencies ?? {}),
        ...(pkg.peerDependencies ?? {}),
      };
      const angularDeps = Object.keys(allDeps).filter((k) => k.startsWith('@angular/'));
      expect(angularDeps).toEqual([]);
    });
  });

  // ── dist bundle ──────────────────────────────────────────────────────────

  describe('dist bundle (requires npm run build first)', () => {
    const distJs  = resolve(ROOT, 'dist', 'index.js');
    const distCjs = resolve(ROOT, 'dist', 'index.cjs');
    const distDts = resolve(ROOT, 'dist', 'index.d.ts');

    it('dist/index.js (ESM) exists', () => {
      expect(existsSync(distJs)).toBe(true);
    });

    it('dist/index.cjs (CJS) exists', () => {
      expect(existsSync(distCjs)).toBe(true);
    });

    it('dist/index.d.ts (types) exists', () => {
      expect(existsSync(distDts)).toBe(true);
    });

    it('dist/index.js does not contain @angular/ references', () => {
      if (!existsSync(distJs)) return;
      expect(readFileSync(distJs, 'utf-8')).not.toContain('@angular/');
    });

    it('dist/index.d.ts declares RecordingService', () => {
      if (!existsSync(distDts)) return;
      expect(readFileSync(distDts, 'utf-8')).toContain('RecordingService');
    });

    it('dist/index.d.ts declares PersistenceService', () => {
      if (!existsSync(distDts)) return;
      expect(readFileSync(distDts, 'utf-8')).toContain('PersistenceService');
    });

    it('dist/index.d.ts declares HttpMonitor', () => {
      if (!existsSync(distDts)) return;
      expect(readFileSync(distDts, 'utf-8')).toContain('HttpMonitor');
    });

    it('dist/index.d.ts declares LibE2eRecorderElement', () => {
      if (!existsSync(distDts)) return;
      expect(readFileSync(distDts, 'utf-8')).toContain('LibE2eRecorderElement');
    });
  });

  // ── package.json ─────────────────────────────────────────────────────────

  describe('package.json', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));

    it('exports field has types entry first', () => {
      const keys = Object.keys(pkg.exports['.']);
      expect(keys[0]).toBe('types');
    });

    it('exports["."].import points to .js file', () => {
      expect(pkg.exports['.'].import).toMatch(/\.js$/);
    });

    it('exports["."].require points to .cjs file', () => {
      expect(pkg.exports['.'].require).toMatch(/\.cjs$/);
    });

    it('main field points to CJS bundle', () => {
      expect(pkg.main).toMatch(/\.cjs$/);
    });

    it('module field points to ESM bundle', () => {
      expect(pkg.module).toMatch(/\.js$/);
    });

    it('types field points to .d.ts file', () => {
      expect(pkg.types).toMatch(/\.d\.ts$/);
    });

    it('files field includes "dist"', () => {
      expect(pkg.files).toContain('dist');
    });
  });
});
