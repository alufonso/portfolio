import { test, expect } from '@playwright/test';

test('home responds and has title', async ({ page, baseURL }) => {
  const urls: string[] = [];
  page.on('request', (r) => urls.push(r.url()));
  const res = await page.goto('/');
  expect(res?.status()).toBe(200);
  expect(await page.title()).toContain('Agustar Alfonso');
  expect(urls.length).toBeGreaterThan(0);
  for (const u of urls) expect(u.startsWith(baseURL!) || u.startsWith('data:')).toBe(true);
});
