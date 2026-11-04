import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { findMixDataProblems } from './src/data/validateMixes.ts';

const mixesFile = fileURLToPath(new URL('./src/data/mixes.json', import.meta.url));

/** Fails `vite build` when src/data/mixes.json is broken, so bad data never deploys. */
function validateMixes(): Plugin {
  return {
    name: 'stmarco:validate-mixes',
    configResolved(config) {
      if (config.command === 'build' && !config.env.VITE_MEDIA_BASE_URL) {
        config.logger.warn(
          'VITE_MEDIA_BASE_URL is not set: audio will load from /mixes (fine locally, wrong in production).',
        );
      }
    },
    buildStart() {
      this.addWatchFile(mixesFile);
      let data: unknown;
      try {
        data = JSON.parse(readFileSync(mixesFile, 'utf8'));
      } catch (error) {
        this.error(`src/data/mixes.json is not valid JSON: ${(error as Error).message}`);
      }
      const problems = findMixDataProblems(data);
      if (problems.length > 0) {
        this.error(
          `src/data/mixes.json is invalid:\n${problems.map((p) => `  - ${p}`).join('\n')}`,
        );
      }
    },
  };
}

// Lets a temporary HTTPS tunnel (npx cloudflared tunnel --url ...) reach the dev and
// preview servers, so the site can be tested on a phone over HTTPS.
const tunnelHosts = ['.trycloudflare.com'];

export default defineConfig({
  plugins: [react(), validateMixes()],
  server: { allowedHosts: tunnelHosts },
  preview: { allowedHosts: tunnelHosts },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
