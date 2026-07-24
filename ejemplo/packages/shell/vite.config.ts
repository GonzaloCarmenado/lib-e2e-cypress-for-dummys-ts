import { defineConfig } from 'vite';
import federation from '@originjs/vite-plugin-federation';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [
    federation({
      name: 'shell',
      remotes: {
        store: isProd ? '/mfe-store/assets/remoteEntry.js' : 'http://localhost:5001/assets/remoteEntry.js',
        forms: isProd ? '/mfe-forms/assets/remoteEntry.js' : 'http://localhost:5002/assets/remoteEntry.js',
        admin: isProd ? '/mfe-admin/assets/remoteEntry.js' : 'http://localhost:5003/assets/remoteEntry.js',
      },
      shared: [],
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
  },
  server: { port: 5000 },
  preview: {
    port: 5000,
    proxy: {
      '/mfe-store': { target: 'http://localhost:5001', rewrite: (p) => p.replace(/^\/mfe-store/, '') },
      '/mfe-forms': { target: 'http://localhost:5002', rewrite: (p) => p.replace(/^\/mfe-forms/, '') },
      '/mfe-admin': { target: 'http://localhost:5003', rewrite: (p) => p.replace(/^\/mfe-admin/, '') },
    },
  },
});
