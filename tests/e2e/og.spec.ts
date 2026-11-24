import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('public/og.png is a 1200x630 PNG', () => {
  const buf = readFileSync(join(process.cwd(), 'public', 'og.png'));
  expect(buf.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  expect(buf.toString('ascii', 12, 16)).toBe('IHDR');
  expect([buf.readUInt32BE(16), buf.readUInt32BE(20)]).toEqual([1200, 630]);
});

test('default site: absolute og tags on the Vercel URL, og-card route not deployed', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://agustaralfonso.vercel.app/og.png');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://agustaralfonso.vercel.app/');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  expect((await request.get('/og-card')).status()).toBe(404);
});

test('with site: absolute og:image and og:url', ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'one build is enough');
  test.setTimeout(120_000);
  const out = mkdtempSync(join(tmpdir(), 'og-site-'));
  try {
    execSync(`npx astro build --outDir "${out}"`, { env: { ...process.env, SITE: 'https://example.test' }, stdio: 'pipe' });
    const html = readFileSync(join(out, 'index.html'), 'utf8');
    expect(html).toContain('<meta property="og:image" content="https://example.test/og.png">');
    expect(html).toContain('<meta property="og:url" content="https://example.test/">');
    expect(html).toContain('<meta property="og:image:width" content="1200">');
    expect(html).toContain('<meta property="og:image:height" content="630">');
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
