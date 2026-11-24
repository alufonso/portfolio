import { test, expect } from '@playwright/test';

// Simulate the moment before the islands hydrate: JS is on, but island bundles never load.
test.beforeEach(async ({ page }) => {
  await page.route('**/_astro/*.js', (route) => route.abort());
});

test('only the active panel shows before hydration (no stacked flash)', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#panel-now-playing')).toBeVisible();
  await expect(page.locator('#panel-playlist')).toBeHidden();
  await expect(page.locator('#panel-stickers')).toBeHidden();
});

test('deep link is applied before hydration', async ({ page }) => {
  await page.goto('/#playlist/2');
  await expect(page.locator('#panel-playlist')).toBeVisible();
  await expect(page.locator('#panel-now-playing')).toBeHidden();
  await expect(page.locator('[data-panel=playlist] [data-item="2"]')).toHaveAttribute('aria-current', 'true');
});

test('garbage hash falls back to now-playing before hydration', async ({ page }) => {
  await page.goto('/#xyz/abc');
  await expect(page.locator('#panel-now-playing')).toBeVisible();
});
