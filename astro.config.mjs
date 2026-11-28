import { defineConfig } from 'astro/config';
import { rmSync } from 'node:fs';
import react from '@astrojs/react';

export default defineConfig({
  output: 'static',
  // Absolute URL for og:image/og:url. Set to the Vercel URL at deploy time (or via SITE); unset = tags omitted.
  site: process.env.SITE || 'https://agustaralfonso.is-a.dev',
  integrations: [
    react(),
    {
      // /og-card is only the source of public/og.png (npm run og); keep it out of every normal build.
      name: 'drop-og-card',
      hooks: {
        'astro:build:done': ({ dir }) => {
          if (!process.env.OG_CARD) rmSync(new URL('og-card/', dir), { recursive: true, force: true });
        },
      },
    },
  ],
});
