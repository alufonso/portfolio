import { test, expect } from '@playwright/test';

const scene = (page: import('@playwright/test').Page) => page.locator('svg[data-monitor]');

test('monitor follows tab', async ({ page }) => {
  await page.goto('/#singles');
  await expect(scene(page)).toHaveAttribute('data-monitor', 'singles');
  await page.getByRole('tab', { name: /Stickers/ }).click();
  await expect(scene(page)).toHaveAttribute('data-monitor', 'stickers');
});

test('reduced motion stops animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const name = await page.locator('.rain').first().evaluate((el) => getComputedStyle(el).animationName);
  expect(name).toBe('none');
});

test('scene is hidden from screen readers', async ({ page }) => {
  await page.goto('/');
  await expect(scene(page)).toHaveAttribute('aria-hidden', 'true');
  await expect(page.getByText('Pixel art: Agustar coding at night by a rainy window')).toHaveCount(1);
});

test('singles monitor shows the selected cover', async ({ page }) => {
  await page.goto('/#singles/2');
  await expect(scene(page)).toHaveAttribute('data-cover', 'cover-cvsight');
  await page.getByRole('button', { name: 'Next item' }).click();
  await expect(scene(page)).toHaveAttribute('data-cover', 'cover-indobert-lyrics');
});
