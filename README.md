# Portfolio

Static recruiter portfolio: Astro + React islands, lofi pixel-art music-player theme.
Requires Node 22.23.4+ (Astro 7).

## Commands

- `npm run dev` - dev server
- `npm run build` - static build into `dist/`
- `npm run preview` - serve the build
- `npm run test:unit` - Vitest
- `npm run test:e2e` - Playwright (builds and serves on port 4321)
- `npm test` - unit then e2e

## Release checklist

After content changes, run `npm run build && npm run preview`, open `/cv`, print it to PDF, and save it as `public/cv.pdf`.

`public/cv.pdf` must never include the phone number unless the owner decides otherwise.

After changing the name, headline or scene art, run `npm run og` to regenerate the link-preview image `public/og.png` (1200x630). It builds the site with the `/og-card` route (normal builds drop that route), screenshots it with Playwright chromium, and fails if the card contains an email or phone number.

The site URL is `https://agustaralfonso.is-a.dev` (`agustaralfonso.vercel.app` still works as a fallback) (`site` in `astro.config.mjs`; override with the `SITE` env var). `og:image` and `og:url` use it, because crawlers need absolute URLs.
