import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents(_on, _config) {},
    baseUrl: 'http://localhost:5000',
    includeShadowDom: true,
    defaultCommandTimeout: 8000,
  },
});
