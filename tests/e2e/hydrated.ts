import { expect, type Page } from '@playwright/test';

// goto, then wait until every Astro island has hydrated. Astro drops the `ssr` attribute from
// <astro-island> once its component mounts. (#deck[data-js] is no longer a signal: the inline
// pre-hydration script sets it before first paint.)
export async function gotoHydrated(page: Page, url: string) {
  await page.goto(url);
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
}
