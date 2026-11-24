import { test, expect } from '@playwright/test';

test.use({ javaScriptEnabled: false });

test('all five panels visible', async ({ page }) => {
  await page.goto('/');
  const heads = [
    'Now Playing — About', 'Playlist — Experience', 'Singles — Projects',
    'Liner Notes — Education & Publication', 'Stickers — Certificates',
  ];
  const panels = page.locator('[data-panel]');
  await expect(panels).toHaveCount(5);
  for (let i = 0; i < 5; i++) {
    await expect(panels.nth(i)).toBeVisible();
    await expect(panels.nth(i).locator('h2').first()).toHaveText(heads[i]);
  }
});

test('playlist lists 5 jobs in order', async ({ page }) => {
  await page.goto('/');
  const a = page.locator('[data-panel="playlist"] article');
  await expect(a).toHaveCount(5);
  await expect(a.first()).toContainText('Global Collabo Tech');
  await expect(a.last()).toContainText('Universitas Islam Negeri Sultan Syarif Kasim Riau');
});

test('singles link to 5 case studies', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a[href^="/projects/"]')).toHaveCount(5);
});

test('action links work without JS', async ({ page }) => {
  await page.goto('/');
  const nav = page.locator('nav[aria-label="Actions"]');
  await expect(nav.locator('a[href="/cv"]').first()).toBeVisible();
  await expect(nav.locator('a[href^="mailto:"]')).toHaveCount(1);
});

test('no phone number anywhere', async ({ page }) => {
  await page.goto('/');
  expect(await page.content()).not.toContain('PHONE_REDACTED');
});
