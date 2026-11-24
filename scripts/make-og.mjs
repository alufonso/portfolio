// Builds the site with the /og-card route, screenshots it at 1200x630, writes public/og.png,
// then drops the route from dist again. Usage: npm run og
import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { preview } from 'astro';
import { chromium } from '@playwright/test';

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/;
const MOBILE = /(?:\+?62|\b0)[\s.-]?8\d{2}[\s.-]?\d{3,4}[\s.-]?\d{3,5}/; // same as tests/e2e/privacy.ts

execSync('npx astro build', { stdio: 'inherit', env: { ...process.env, OG_CARD: '1' } });
const server = await preview({ server: { port: 4329 }, logLevel: 'warn' });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto('http://localhost:4329/og-card');
  await page.evaluate(() => document.fonts.ready);
  const html = await page.content();
  if (EMAIL.test(html) || MOBILE.test(html)) throw new Error('og-card contains an email or phone number');
  await page.screenshot({ path: 'public/og.png', animations: 'disabled' });
  console.log('wrote public/og.png');
} finally {
  await browser.close();
  await server.stop();
  rmSync('dist/og-card', { recursive: true, force: true });
}
