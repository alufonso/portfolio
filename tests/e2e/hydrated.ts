import { expect, type Page } from '@playwright/test';

// goto, then wait for the Player island to hydrate (it sets data-js on #deck).
export async function gotoHydrated(page: Page, url: string) {
  await page.goto(url);
  await expect(page.locator('#deck[data-js]')).toBeAttached();
}
