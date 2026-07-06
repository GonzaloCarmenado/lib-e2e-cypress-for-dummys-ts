import { defineConfig } from 'vite';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    federation({
      name: 'shell',
      remotes: {
        store: 'http://localhost:5001/assets/remoteEntry.js',
        forms: 'http://localhost:5002/assets/remoteEntry.js',
        admin: 'http://localhost:5003/assets/remoteEntry.js',
      },
      shared: [],
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
  },
  server: { port: 5000 },
  preview: { port: 5000 },
});
