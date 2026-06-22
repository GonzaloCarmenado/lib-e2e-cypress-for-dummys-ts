import { defineConfig } from 'tsup';

export default defineConfig([
  // Browser library (framework-agnostic, custom elements).
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    target: 'es2022',
    external: ['idb', 'sweetalert2'],
  },
  // Node-only CLI runner (separate target; never imported by the browser bundle).
  {
    entry: { runner: 'src/runner/index.ts' },
    format: ['esm'],
    platform: 'node',
    target: 'node18',
    clean: false,
    sourcemap: false,
    dts: false,
    banner: { js: '#!/usr/bin/env node' },
  },
]);
