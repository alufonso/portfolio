import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const profile = JSON.parse(readFileSync('src/data/profile.json', 'utf8'));

const projects = profile.projects;

test('every case study returns 200', async ({ page }) => {
  for (const p of projects) {
    const res = await page.goto(`/projects/${p.slug}`);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveText(p.name);
  }
});

test('no result section when result missing', async ({ page }) => {
  const p = projects.find((x) => !(x.case_study as any).result)!;
  await page.goto(`/projects/${p.slug}`);
  await expect(page.getByRole('heading', { name: 'Result' })).toHaveCount(0);
});

test('unknown route is themed 404', async ({ page }) => {
  const res = await page.goto('/projects/nope');
  expect(res?.status()).toBe(404);
  await expect(page.getByText('Track not found')).toBeVisible();
  await expect(page.locator('a[href="/"]').first()).toBeVisible();
});
