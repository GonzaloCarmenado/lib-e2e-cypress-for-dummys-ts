import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';

export default defineConfig({
  // Detectar si estamos en modo librería
  build: {
    outDir: './dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'terser',
    target: 'ES2020',
    // Configuración para librería
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'E2ECypressForDummysTS',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`
    },
    rollupOptions: {
      // Asegurar que las dependencias externas no se empaqueten
      external: ['bootstrap', 'lit', 'rxjs', '@lit/context'],
      output: {
        globals: {
          bootstrap: 'bootstrap',
          lit: 'lit',
          rxjs: 'rxjs',
          '@lit/context': '@lit/context'
        }
      }
    }
  },
  server: {
    port: 5173,
    open: false,
    cors: true,
  },
  preview: {
    port: 4173,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
      '@lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  assetsInclude: ['**/*.html'],
});
