import { test, expect, type Page } from '@playwright/test';
import { gotoHydrated } from './hydrated';

const scene = (page: Page) => page.locator('svg[data-monitor]');
const crt = (page: Page) => page.getByRole('button', { name: 'CRT effect' });

for (const [hour, phase, rain] of [[17, 'dusk', false], [2, 'night', true], [10, 'morning', false]] as const) {
  test(`${hour}:00 is ${phase}`, async ({ page }) => {
    await page.clock.setFixedTime(new Date(2026, 10, 24, hour));
    await gotoHydrated(page, '/');
    await expect(scene(page)).toHaveAttribute('data-phase', phase);
    if (rain) await expect(page.locator('.rain')).toBeVisible();
    else await expect(page.locator('.rain')).toBeHidden();
  });
}

test('CRT toggle flips, shows overlay and persists', async ({ page }) => {
  await gotoHydrated(page, '/');
  await expect(crt(page)).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.crt')).toBeHidden();
  await crt(page).click();
  await expect(crt(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.crt')).toBeVisible();
  await page.reload();
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
  await expect(crt(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.crt')).toBeVisible();
});

test('CRT falls back to off when storage throws', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new Error('denied'); } });
  });
  await gotoHydrated(page, '/');
  await expect(crt(page)).toHaveAttribute('aria-pressed', 'false');
  await crt(page).click();
  await expect(crt(page)).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

test('stickers are tilted', async ({ page }) => {
  await gotoHydrated(page, '/#stickers');
  const t = await page.locator('[data-panel=stickers] .cover').first().evaluate((el) => getComputedStyle(el).transform);
  const b = Number(t.match(/matrix\(([^)]+)\)/)?.[1].split(',')[1] ?? 0);
  expect(Math.abs(b)).toBeGreaterThan(0);
});

test('grain is static under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoHydrated(page, '/');
  await crt(page).click();
  await expect(page.locator('.crt .grain')).toBeAttached();
  expect(await page.locator('.crt .grain').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
});

test('/cv is not pixelated', async ({ page }) => {
  await page.goto('/cv');
  await expect(page.locator('.px-corners')).toHaveCount(0);
  const body = await page.locator('body').evaluate((el) => {
    const s = getComputedStyle(el);
    return { cursor: s.cursor, bg: s.backgroundImage };
  });
  expect(body.cursor).toBe('auto');
  expect(body.bg).not.toContain('data:image');
});

// Part 2: scene reacts to music, cassette, cat.
const html = (page: Page) => page.locator('html');
const reel = (page: Page) => page.locator('.cassette .reel').first();
const play = (page: Page) => page.getByRole('button', { name: 'Play music' });
const pause = (page: Page) => page.getByRole('button', { name: 'Pause music' });
const anim = (page: Page, sel: string) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).animationName);

test('playing sets data-playing, spins reels, shows bars; pause and hidden clear it', async ({ page }) => {
  await gotoHydrated(page, '/');
  await expect(html(page)).not.toHaveAttribute('data-playing');
  await expect(page.locator('.scene .viz')).toBeHidden();
  await play(page).click();
  await expect(html(page)).toHaveAttribute('data-playing');
  expect(await anim(page, '.cassette .reel')).not.toBe('none');
  await expect(page.locator('.scene .viz')).toBeVisible();
  await pause(page).click();
  await expect(html(page)).not.toHaveAttribute('data-playing');
  expect(await anim(page, '.cassette .reel')).toBe('none');
  await play(page).click();
  await expect(html(page)).toHaveAttribute('data-playing');
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(html(page)).not.toHaveAttribute('data-playing');
});

test('blocked audio never sets data-playing', async ({ page }) => {
  await page.addInitScript(() => { (window as any).AudioContext = undefined; (window as any).webkitAudioContext = undefined; });
  await gotoHydrated(page, '/');
  await play(page).click();
  await expect(page.getByText('Audio unavailable')).toBeVisible();
  await expect(html(page)).not.toHaveAttribute('data-playing');
});

test('petting the cat wakes it for about 3 s', async ({ page }) => {
  await page.clock.install();
  await gotoHydrated(page, '/');
  const cat = page.getByRole('button', { name: 'Pet the cat' });
  await cat.click();
  await expect(scene(page)).toHaveAttribute('data-cat', 'awake');
  await page.clock.runFor(1500);
  await cat.click(); // restarts the timer
  await page.clock.runFor(2000);
  await expect(scene(page)).toHaveAttribute('data-cat', 'awake');
  await page.clock.runFor(1500);
  await expect(scene(page)).not.toHaveAttribute('data-cat', 'awake');
});

test('reduced motion: reels, cat and bob are still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoHydrated(page, '/');
  await play(page).click();
  await expect(html(page)).toHaveAttribute('data-playing');
  for (const sel of ['.cassette .reel', '.scene .cat-body', '.scene .head', '.scene .viz rect']) {
    expect(await anim(page, sel), sel).toBe('none');
  }
  await page.getByRole('button', { name: 'Pet the cat' }).click();
  await expect(scene(page)).toHaveAttribute('data-cat', 'awake');
  expect(await anim(page, '.scene .cat-eyes-open')).toBe('none');
  await expect(page.locator('.scene .cat-eyes-open')).toBeVisible();
});

test('print drops pixel corners', async ({ page }) => {
  await gotoHydrated(page, '/');
  await page.emulateMedia({ media: 'print' });
  const clips = await page.locator('.px-corners').evaluateAll((els) => els.map((el) => getComputedStyle(el).clipPath));
  expect(clips.filter((c) => c !== 'none')).toEqual([]);
});
