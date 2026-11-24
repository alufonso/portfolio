import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Reads dist/ built by the Playwright webServer (build + preview).
test('client JS has no private data', () => {
  const dir = join(process.cwd(), 'dist', '_astro');
  const files = readdirSync(dir).filter((f) => f.endsWith('.js'));
  expect(files.length, 'no JS found in dist/_astro; guard would pass vacuously').toBeGreaterThan(0);
  for (const f of files) {
    const src = readFileSync(join(dir, f), 'utf8');
    expect(src, f).not.toMatch(/["']phone["']\s*:|\bphone\s*:/);
    expect(src, f).not.toContain('PHONE_REDACTED');
    expect(src, f).not.toContain('alfonsoagustar');
  }
});

test('axe has no serious violations', async ({ page }) => {
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  for (const url of ['/', '/cv', '/projects/cvsight']) {
    await page.goto(url);
    const { violations } = await new AxeBuilder({ page }).analyze();
    const bad = violations
      .filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
      .map((v) => `${url} ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
    expect(bad).toEqual([]);
  }
});

test('no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const url of ['/', '/cv']) {
    await page.goto(url);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(sw, url).toBeLessThanOrEqual(320);
  }
  await page.goto('/');
  await expect(page.getByRole('link', { name: '⬇ CV' })).toBeInViewport();
});

test('long bullet wraps', async ({ page }) => {
  await page.goto('/#playlist/0');
  const a = page.locator('[data-panel="playlist"] article[aria-current="true"]');
  await expect(a).toBeVisible();
  const { sw, cw } = await a.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth }));
  expect(sw).toBeLessThanOrEqual(cw);
});
