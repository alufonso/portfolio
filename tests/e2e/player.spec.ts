import { test, expect } from '@playwright/test';

test('clicking a tab shows only that panel and sets hash', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: /Playlist/ }).click();
  await expect(page.locator('#panel-playlist')).toBeVisible();
  await expect(page.locator('#panel-singles')).toBeHidden();
  expect(page.url()).toMatch(/#playlist$/);
});

test('deep link selects item', async ({ page }) => {
  await page.goto('/#playlist/2');
  await expect(page.getByRole('tab', { name: /Playlist/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-panel=playlist] [data-item="2"]')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('[data-panel=playlist] [data-item="1"]')).toHaveAttribute('aria-expanded', 'false');
});

test('next button and arrow keys move items', async ({ page }) => {
  await page.goto('/#playlist');
  await page.getByRole('button', { name: 'Next item' }).click();
  expect(page.url()).toMatch(/#playlist\/1$/);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press('ArrowRight');
  expect(page.url()).toMatch(/#playlist\/2$/);
  await expect(page.getByTestId('track-label')).toContainText('Playlist · 03');
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '3');
});

test('arrows in tablist move tabs', async ({ page }) => {
  await page.goto('/#playlist');
  await page.locator('#tab-playlist').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tab-singles')).toBeFocused();
  await expect(page.locator('#tab-singles')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(page.locator('#tab-stickers')).toHaveAttribute('aria-selected', 'true');
});

test('global keys ignore inputs and modifiers; external hashchange applies', async ({ page }) => {
  await page.goto('/#playlist');
  await page.evaluate(() => {
    const i = document.createElement('input');
    i.id = 'tmp';
    document.body.append(i);
  });
  await page.locator('#tmp').focus();
  await page.keyboard.press('ArrowRight');
  expect(page.url()).toMatch(/#playlist$/);
  await page.evaluate(() =>
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', altKey: true, bubbles: true })),
  );
  await page.evaluate(() =>
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true })),
  );
  expect(page.url()).toMatch(/#playlist$/);
  await page.evaluate(() => { location.hash = '#singles/1'; });
  await expect(page.locator('[data-panel=singles] [data-item="1"]')).toHaveAttribute('aria-expanded', 'true');
});
