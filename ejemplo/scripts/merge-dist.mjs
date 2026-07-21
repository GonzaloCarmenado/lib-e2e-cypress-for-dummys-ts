import { cpSync } from 'fs';

const remotes = ['mfe-store', 'mfe-forms', 'mfe-admin'];

for (const remote of remotes) {
  cpSync(`packages/${remote}/dist`, `packages/shell/dist/${remote}`, { recursive: true });
  console.log(`✓ merged ${remote}/dist → shell/dist/${remote}`);
}
