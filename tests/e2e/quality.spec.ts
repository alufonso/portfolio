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
