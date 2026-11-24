import { test, expect } from '@playwright/test';

test.use({ javaScriptEnabled: false });

// "9 headings" = the <h1> (name) plus 8 <h2> sections.
test('cv has all 9 headings in order', async ({ page }) => {
  await page.goto('/cv');
  await expect(page.locator('h1')).toHaveText('Agustar Alfonso');
  await expect(page.locator('h2')).toHaveText([
    'Summary', 'Skills', 'Experience', 'Projects', 'Education',
    'Publication', 'Certificates', 'Volunteering',
  ]);
});

test('cv lists all 32 skills, projects link to case studies, no JS', async ({ page }) => {
  await page.goto('/cv');
  await expect(page.locator('#skills li')).toHaveCount(32);
  await expect(page.locator('a[href^="/projects/"]')).toHaveCount(5);
  await expect(page.locator('script')).toHaveCount(0);
  await expect(page).toHaveTitle('Agustar Alfonso — CV');
});

test('cv has mailto and external links, never the phone', async ({ page }) => {
  await page.goto('/cv');
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(1);
  await expect(page.locator('a[href^="https://"]').first()).toBeVisible();
  expect(await page.content()).not.toContain('PHONE_REDACTED');
});

test('print media has no panels or monitor', async ({ page }) => {
  await page.goto('/cv');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('[data-panel]')).toHaveCount(0);
  await expect(page.locator('svg[data-monitor]')).toHaveCount(0);
});
