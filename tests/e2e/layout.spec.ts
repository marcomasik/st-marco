import { expect, test, type Page } from '@playwright/test';
import { contextFor, VIEWPORTS } from './viewports';

const PAGES = ['/', '/mix/sandbar-sunset-session'];

/** Decorations drawn in front of the panel content. */
const FRONT_DECORATIONS = '.panel-ornaments > *, .panel-header__star, .panel-header__clouds';

async function settle(page: Page, path: string) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
}

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name}px`, () => {
    test.use(contextFor(viewport));

    for (const path of PAGES) {
      test(`layout rules on ${path}`, async ({ page }) => {
        await settle(page, path);

        // No sideways scrolling, whatever hangs over the edges.
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(0);

        // Every control is at least 44 x 44. The card title link is excluded: its tap
        // area is the whole card (a stretched ::after), checked through the card.
        const small = await page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>('a[href], button, input')]
            .filter((el) => !el.matches('.mix-card__link'))
            .map((el) => {
              const box = el.getBoundingClientRect();
              const name = el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 30);
              return { name, width: Math.round(box.width), height: Math.round(box.height) };
            })
            .filter(({ width, height }) => width > 0 && (width < 44 || height < 44)),
        );
        expect(small, 'controls smaller than 44px').toEqual([]);

        const cards = await page.evaluate(() =>
          [...document.querySelectorAll('.mix-card')].map((card) => {
            const box = card.getBoundingClientRect();
            return Math.min(box.width, box.height);
          }),
        );
        expect(cards.every((size) => size >= 44)).toBe(true);

        // Decorations never cover anything tappable. On phones the palm frond is in front
        // too; from 600px it hangs behind the panel.
        const frontSelector =
          viewport.width < 600 ? `${FRONT_DECORATIONS}, .palm-frond` : FRONT_DECORATIONS;
        const overlaps = await page.evaluate((selector) => {
          const decorations = [...document.querySelectorAll(selector)];
          const controls = [
            ...document.querySelectorAll<HTMLElement>('a[href], button, input'),
          ].filter((el) => !el.closest('.boombox'));
          const hits: string[] = [];
          for (const decoration of decorations) {
            const d = decoration.getBoundingClientRect();
            for (const control of controls) {
              const c = control.getBoundingClientRect();
              const x = Math.min(d.right, c.right) - Math.max(d.left, c.left);
              const y = Math.min(d.bottom, c.bottom) - Math.max(d.top, c.top);
              if (x > 2 && y > 2) {
                const name = control.getAttribute('aria-label') ?? control.textContent?.trim();
                hits.push(`${decoration.getAttribute('class')} over "${name}"`);
              }
            }
          }
          return hits;
        }, frontSelector);
        expect(overlaps).toEqual([]);

        // From the boombox breakpoint on, the boombox never overlaps the panel.
        if (viewport.width >= 760) {
          const gap = await page.evaluate(() => {
            const panel = document.querySelector('.panel')!.getBoundingClientRect();
            const boombox = document.querySelector('.boombox')!.getBoundingClientRect();
            return boombox.left - panel.right;
          });
          expect(gap, 'space between panel and boombox').toBeGreaterThan(0);
        }
      });
    }

    test('the end of the page is not hidden behind the player', async ({ page }) => {
      await settle(page, '/');
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(200);
      const covered = await page.evaluate(() => {
        const cards = [...document.querySelectorAll('.mix-card')];
        const last = cards.at(-1)!.getBoundingClientRect();
        const player = document.querySelector('.boombox')!.getBoundingClientRect();
        const sameColumn = last.right > player.left && last.left < player.right;
        return sameColumn && last.bottom > player.top;
      });
      expect(covered).toBe(false);
    });
  });
}

test('the panel swings on load, and stays still with reduced motion', async ({ page }) => {
  await page.goto('/');
  const angles: string[] = [];
  for (let i = 0; i < 5; i++) {
    angles.push(
      await page.evaluate(() => getComputedStyle(document.querySelector('.hanging')!).rotate),
    );
    await page.waitForTimeout(200);
  }
  expect(new Set(angles).size, `angles seen: ${angles.join(', ')}`).toBeGreaterThan(1);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const animation = await page.evaluate(
    () => getComputedStyle(document.querySelector('.hanging')!).animationName,
  );
  expect(animation).toBe('none');
});
