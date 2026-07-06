import { defineConfig } from 'vite';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    federation({
      name: 'mfe-forms',
      filename: 'remoteEntry.js',
      exposes: { './mount': './src/mount.ts' },
      shared: [],
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
    outDir: 'dist',
  },
  server: { port: 5002, cors: true },
  preview: { port: 5002, cors: true },
});
