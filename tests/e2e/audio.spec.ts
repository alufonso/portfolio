import { test, expect } from '@playwright/test';
import { gotoHydrated } from './hydrated';

const count = `(() => {
  window.__ac = 0;
  const Orig = window.AudioContext;
  if (Orig) window.AudioContext = class extends Orig { constructor(...a) { super(...a); window.__ac++; } };
})();`;

test.beforeEach(async ({ page }) => { await page.addInitScript(count); });

test('no audio context before click', async ({ page }) => {
  await gotoHydrated(page, '/');
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => (window as any).__ac)).toBe(0);
});

test('play creates context and toggles label', async ({ page }) => {
  await gotoHydrated(page, '/');
  await page.getByRole('button', { name: 'Play music' }).click();
  await expect(page.getByRole('button', { name: 'Pause music' })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__ac)).toBe(1);
});

test('hidden tab stops and does not resume', async ({ page }) => {
  await gotoHydrated(page, '/');
  await page.getByRole('button', { name: 'Play music' }).click();
  await expect(page.getByRole('button', { name: 'Pause music' })).toBeVisible();
  const fire = (state: string) => page.evaluate((s) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => s });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);
  await fire('hidden');
  await expect(page.getByRole('button', { name: 'Play music' })).toBeVisible();
  await fire('visible');
  await expect(page.getByRole('button', { name: 'Play music' })).toBeVisible();
});

test('blocked audio shows unavailable', async ({ page }) => {
  await page.addInitScript(() => { (window as any).AudioContext = undefined; (window as any).webkitAudioContext = undefined; });
  await gotoHydrated(page, '/');
  await page.getByRole('button', { name: 'Play music' }).click();
  await expect(page.getByText('Audio unavailable')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play music' })).toBeDisabled();
});

test('volume slider arrows do not move items', async ({ page }) => {
  await gotoHydrated(page, '/#playlist/1');
  await page.getByRole('slider', { name: 'Volume' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('[data-panel=playlist] [data-item="1"]')).toHaveAttribute('aria-current', 'true');
});

test('hidden while resume is pending never starts music', async ({ page }) => {
  await page.addInitScript(() => {
    const r = AudioContext.prototype.resume;
    AudioContext.prototype.resume = function () { return new Promise((ok) => setTimeout(ok, 300)).then(() => r.call(this)); };
  });
  await gotoHydrated(page, '/');
  await page.getByRole('button', { name: 'Play music' }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(700);
  await expect(page.getByRole('button', { name: 'Play music' })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__ac)).toBeLessThanOrEqual(1);
});
