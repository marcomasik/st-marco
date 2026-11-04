import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    // Uses the installed Google Chrome, so no browser download is needed.
    { name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    // Safari's engine, as a stand-in for the iPhone.
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    // A separate build with the demo mixes (tests/fixtures), served with its test audio.
    command: [
      'npm run media:test',
      'vite build --mode e2e --outDir dist-e2e --emptyOutDir',
      'mkdir -p dist-e2e/test-media',
      'cp tests/fixtures/media/* dist-e2e/test-media/',
      `vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    ].join(' && '),
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
