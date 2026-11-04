import { test, type Page } from '@playwright/test';
import { contextFor, VIEWPORTS } from './viewports';

// `npm run screenshots` writes screenshots/<browser>-<width>-<view>.png (gitignored).
// Reduced motion keeps the panel still, so shots are comparable between runs.

async function open(page: Page, path: string) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(path);
  await page.evaluate(() => {
    localStorage.clear();
    return document.fonts.ready;
  });
  await page.waitForTimeout(400);
}

/** The UI is in its playing state once the audio is playing and has data (no need to wait
 * for the clock: screenshots only need the look). */
async function waitForPlayback(page: Page) {
  await page.waitForFunction(() => {
    const audio = document.querySelector('audio');
    return !!audio && !audio.paused && audio.readyState >= 2;
  });
  await page.waitForTimeout(300);
}

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name}px @screenshots`, () => {
    test.use(contextFor(viewport));

    test('list, detail and playing', async ({ page }, info) => {
      const shot = (view: string) =>
        page.screenshot({ path: `screenshots/${info.project.name}-${viewport.name}-${view}.png` });

      await open(page, '/');
      await shot('list');

      await page.getByRole('button', { name: 'Play: Low Tide Disco' }).click();
      await waitForPlayback(page);
      await page.evaluate(() =>
        document.querySelector('.mix-list__items')?.scrollIntoView({ block: 'start' }),
      );
      await page.waitForTimeout(200);
      await shot('playing');

      await page.goto('/mix/sandbar-sunset-session');
      await page.getByRole('button', { name: /^Play from 18:00/ }).click();
      await waitForPlayback(page);
      await page.evaluate(() =>
        document.querySelector('.mix-detail')?.scrollIntoView({ block: 'start' }),
      );
      await page.waitForTimeout(200);
      await shot('detail');
    });
  });
}
