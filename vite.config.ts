import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { findMixDataProblems } from './src/data/validateMixes.ts';

const realMixes = fileURLToPath(new URL('./src/data/mixes.json', import.meta.url));
/** Demo mixes for the Playwright tests only (`--mode e2e`), never in a real build. */
const demoMixes = fileURLToPath(new URL('./tests/fixtures/mixes.json', import.meta.url));

/** Fails `vite build` when the mixes data is broken, so bad data never deploys. */
function validateMixes(file: string): Plugin {
  return {
    name: 'stmarco:validate-mixes',
    buildStart() {
      this.addWatchFile(file);
      let data: unknown;
      try {
        data = JSON.parse(readFileSync(file, 'utf8'));
      } catch (error) {
        this.error(`${file} is not valid JSON: ${(error as Error).message}`);
      }
      const problems = findMixDataProblems(data);
      if (problems.length > 0) {
        this.error(`${file} is invalid:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
      }
    },
  };
}

// Lets a temporary HTTPS tunnel (npx cloudflared tunnel --url ...) reach the dev and
// preview servers, so the site can be tested on a phone over HTTPS.
const tunnelHosts = ['.trycloudflare.com'];

export default defineConfig(({ mode }) => {
  const e2e = mode === 'e2e';
  return {
    plugins: [react(), validateMixes(e2e ? demoMixes : realMixes)],
    // The e2e build swaps the real mixes for the demo mixes.
    resolve: e2e ? { alias: [{ find: /^\.\/mixes\.json$/, replacement: demoMixes }] } : {},
    server: { allowedHosts: tunnelHosts },
    preview: { allowedHosts: tunnelHosts },
    test: {
      include: ['src/**/*.test.ts'],
      environment: 'node',
    },
  };
});
