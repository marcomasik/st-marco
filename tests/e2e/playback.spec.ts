import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __firstAudio?: HTMLAudioElement | null;
  }
}

async function audioState(page: Page) {
  return page.evaluate(() => {
    const audio = document.querySelector('audio');
    return {
      count: document.querySelectorAll('audio').length,
      paused: audio?.paused ?? true,
      currentTime: audio?.currentTime ?? 0,
      sameElement: audio === window.__firstAudio,
    };
  });
}

async function waitUntilPlaying(page: Page, after = 0) {
  await expect
    .poll(async () => {
      const state = await audioState(page);
      return !state.paused && state.currentTime > after;
    })
    .toBe(true);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('playback keeps going across route changes on the same audio element', async ({ page }) => {
  await page.evaluate(() => {
    window.__firstAudio = document.querySelector('audio');
  });

  await page.getByRole('button', { name: 'Play: Low Tide Disco' }).click();
  await waitUntilPlaying(page, 0.3);

  await page.getByRole('link', { name: 'Frigate Birds at Dawn' }).click();
  await expect(page).toHaveURL(/\/mix\/frigate-birds-at-dawn$/);
  const onDetail = await audioState(page);
  expect(onDetail).toMatchObject({ count: 1, paused: false, sameElement: true });

  await page.getByRole('link', { name: 'All mixes', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await waitUntilPlaying(page, onDetail.currentTime);
  expect(await audioState(page)).toMatchObject({ count: 1, sameElement: true });

  // The player shows the mix that is playing.
  await expect(page.getByRole('region', { name: 'Player' })).toContainText('Low Tide Disco');
});

test('tracklist timestamps start the mix there and highlight the track', async ({ page }) => {
  await page.goto('/mix/sandbar-sunset-session');
  await page.getByRole('button', { name: /^Play from 18:00/ }).click();
  await waitUntilPlaying(page, 1079);

  const current = page.locator('.tracklist__item[aria-current="true"]');
  await expect(current).toHaveCount(1);
  await expect(current).toContainText('Trade Winds');

  // Jump to another track of the same mix.
  await page.getByRole('button', { name: /^Play from 38:20/ }).click();
  await expect(current).toContainText('Horizon Line');
  const { currentTime } = await audioState(page);
  expect(currentTime).toBeGreaterThanOrEqual(2299);
});

test('remembers the position per mix and resumes after a reload', async ({ page }) => {
  await page.goto('/mix/frigate-birds-at-dawn');
  await page.getByRole('button', { name: /^Play from 11:30/ }).click();
  await waitUntilPlaying(page, 690);

  await page.getByRole('region', { name: 'Player' }).getByRole('button', { name: 'Pause' }).click();
  const saved = await page.evaluate(() => {
    const raw = localStorage.getItem('stmarco:positions:v1');
    return raw ? (JSON.parse(raw) as Record<string, { t: number }>) : {};
  });
  expect(saved['sm-003']?.t).toBeGreaterThanOrEqual(690);

  await page.reload();
  // After a reload the player shows the last mix, paused, at the saved spot.
  const player = page.getByRole('region', { name: 'Player' });
  await expect(player).toContainText('Frigate Birds at Dawn');
  await expect(
    page.getByRole('button', { name: /^Resume at 11:3\d: Frigate Birds at Dawn$/ }),
  ).toBeVisible();

  await player.getByRole('button', { name: 'Play' }).click();
  await waitUntilPlaying(page, 689);
});

test('skip buttons move 30 seconds', async ({ page }) => {
  await page.goto('/mix/low-tide-disco');
  await page.getByRole('button', { name: /^Play from 5:00/ }).click();
  await waitUntilPlaying(page, 299);

  const player = page.getByRole('region', { name: 'Player' });
  const before = (await audioState(page)).currentTime;
  await player.getByRole('button', { name: 'Forward 30 seconds' }).click();
  await expect.poll(async () => (await audioState(page)).currentTime).toBeGreaterThan(before + 29);
  await player.getByRole('button', { name: 'Back 30 seconds' }).click();
  await expect.poll(async () => (await audioState(page)).currentTime).toBeLessThan(before + 10);
});

test('sets Media Session metadata with the avatar as artwork', async ({ page }) => {
  await page.getByRole('button', { name: 'Play: Frigate Birds at Dawn' }).click();
  await waitUntilPlaying(page, 0.2);
  const metadata = await page.evaluate(() => {
    const data = navigator.mediaSession?.metadata;
    return data
      ? { title: data.title, artist: data.artist, artwork: data.artwork.map((a) => a.src) }
      : null;
  });
  expect(metadata?.title).toBe('Frigate Birds at Dawn');
  expect(metadata?.artist).toBe('St. Marco');
  expect(metadata?.artwork.at(-1)).toMatch(/\/icons\/artwork-512\.png$/);
});

test('next and previous mix follow the list order', async ({ page }) => {
  const player = page.getByRole('region', { name: 'Player' });
  await page.getByRole('button', { name: 'Play: Low Tide Disco' }).click();
  await waitUntilPlaying(page, 0.2);
  await expect(player.getByRole('button', { name: 'Previous mix' })).toBeDisabled();

  await player.getByRole('button', { name: 'Next mix' }).click();
  await expect(player).toContainText('Frigate Birds at Dawn');
  await waitUntilPlaying(page, 0.2);

  await player.getByRole('button', { name: 'Previous mix' }).click();
  await expect(player).toContainText('Low Tide Disco');
});

test('when a mix ends, the next one starts and the finished one starts over', async ({ page }) => {
  await page.goto('/mix/low-tide-disco');
  await page.getByRole('button', { name: /^Play from 52:30/ }).click();
  await waitUntilPlaying(page, 3149);
  await page.evaluate(() => {
    const audio = document.querySelector('audio');
    if (audio) audio.currentTime = audio.duration - 2;
  });

  const player = page.getByRole('region', { name: 'Player' });
  await expect(player).toContainText('Frigate Birds at Dawn', { timeout: 15_000 });
  await waitUntilPlaying(page, 0.2);
  const saved = await page.evaluate(() => localStorage.getItem('stmarco:positions:v1') ?? '');
  expect(saved).not.toContain('sm-004');
});

test('unknown slugs show the not found page', async ({ page }) => {
  await page.goto('/mix/does-not-exist');
  await expect(page.getByRole('heading', { name: 'Lost at sea' })).toBeVisible();
});
