import { test, expect } from '@playwright/test';
import { gotoHydrated } from './hydrated';

const scene = (page: import('@playwright/test').Page) => page.locator('svg[data-monitor]');

test('monitor follows tab', async ({ page }) => {
  await gotoHydrated(page, '/#singles');
  await expect(scene(page)).toHaveAttribute('data-monitor', 'singles');
  await page.getByRole('tab', { name: /Stickers/ }).click();
  await expect(scene(page)).toHaveAttribute('data-monitor', 'stickers');
});

test('reduced motion stops animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoHydrated(page, '/');
  const names = await page.locator('.rain, .steam, .lamp, .screen-flicker')
    .evaluateAll((els) => els.map((el) => getComputedStyle(el).animationName));
  expect(names.length).toBeGreaterThan(0);
  expect(names.filter((n) => n !== 'none')).toEqual([]);
});

test('scene is hidden from screen readers', async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 10, 24, 2)); // night
  await gotoHydrated(page, '/');
  await expect(scene(page)).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.scene .sr-only')).toHaveText('Pixel art: Agustar coding at night by a rainy window');
});

test('singles monitor shows the selected cover', async ({ page }) => {
  await gotoHydrated(page, '/#singles/2');
  await expect(scene(page)).toHaveAttribute('data-cover', 'cover-cvsight');
  await page.getByRole('button', { name: 'Next item' }).click();
  await expect(scene(page)).toHaveAttribute('data-cover', 'cover-indobert-lyrics');
});

test('scene text follows the phase', async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 10, 24, 17));
  await gotoHydrated(page, '/');
  await expect(page.locator('.scene .sr-only')).toHaveText('Pixel art: Agustar coding at dusk by a window');
});
