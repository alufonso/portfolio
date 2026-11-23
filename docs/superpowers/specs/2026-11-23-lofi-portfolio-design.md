# Lofi Pixel Portfolio — Design Spec

- **Date:** 2026-11-23
- **Owner:** Agustar Alfonso
- **Status:** Approved in brainstorming; awaiting spec review

## 1. Goal

This spec describes a new personal portfolio site for **recruiters and HR**. In 30 seconds a visitor should learn who Agustar is and what he has shipped, and be able to download his CV. The site should feel unique and memorable without slowing that reader down.

The old site (`alufonso/portofolio`, portofolio-eta-one-66.vercel.app) is currently offline (Vercel `404 DEPLOYMENT_NOT_FOUND`), and its design was judged weak. This spec replaces it. The old repo stays as an archive.

### Success criteria
- A recruiter can find role, current company, experience, and a CV download within 30 seconds, on desktop or phone.
- All content is readable without JavaScript, by bots, and in a plain printable view.
- The theme is original: no copied characters (e.g. not "Lofi Girl"), no third-party art or music.
- Updating content means editing one JSON file and redeploying.

### Out of scope
- CMS or admin panel, database, contact form backend.
- Blog or writing section.
- Multiple languages (English only).
- Real screenshots in case studies (they can be added later).

## 2. Concept

The site is a **lofi music player app** built in a **warm editorial** style. It uses a paper background `#f6f1e9`, ink `#2b2520`, brick accent `#b5532a`, a night-scene palette (`#2a2238`, lamp `#f2b45c`), serif headings, and a clean sans-serif body. Pixel art sets the mood; CV content always uses readable type.

The left panel holds an animated pixel scene of Agustar, seen from behind, coding at night: rain on the window, a desk lamp, coffee steam, and a monitor glow. Player controls sit below the scene. The right panel holds five tabs. Each tab has a music "twin" name plus a plain label:

| Tab (twin) | Plain label | Content |
|---|---|---|
| Now Playing | About | Headline, short bio, location, open-to, LinkedIn/GitHub |
| Playlist | Experience | Jobs as tracks |
| Singles | Projects | Pixel "album covers" → case study pages |
| Liner Notes | Education & Publication | Degree, thesis, IndoBERT paper |
| Stickers | Certificates | Pixel badges |

The monitor inside the pixel scene changes per tab: code for Playlist, the album cover of the selected project for Singles, a paper page for Liner Notes, badges for Stickers, and the name and headline for Now Playing.

## 3. Architecture

- **Framework:** Astro (static output) with React islands. Deploy target: Vercel, static, on a free `*.vercel.app` subdomain.
- **Repo:** new `alufonso/portfolio`, local folder `C:\Users\M S I\Projects\portfolio`.
- **Interactive islands (React):** only two.
  - `Player`: tab state, ⏮/⏭ item navigation, keyboard handling, URL hash sync, audio control.
  - `PixelScene`: animated SVG scene whose monitor content follows the active tab.
- **Everything else is static HTML** rendered by Astro.

### Pages
| Route | Purpose |
|---|---|
| `/` | Player app: scene and controls on the left, tabs on the right |
| `/projects/<slug>` | One case study per project, with a mini player header |
| `/cv` | Plain CV view: one page, no art, print-friendly (`@media print`) |

### No-JS fallback
`/` renders all five tab panels in the HTML. CSS shows only the active one when the `Player` island hydrates. Without JS, every panel is visible as a scrolling page with section headings. The links CV / Plain CV / Contact are plain anchors.

### Source layout
```
src/
  data/profile.json        # single content source
  content.config.ts        # schema for profile.json (build fails on invalid data)
  art/                     # hand-made SVG pixel art (scene parts, covers, badges)
  components/              # Astro components (static) + islands/Player.tsx, islands/PixelScene.tsx
  audio/lofi-engine.ts     # generative lofi music (Web Audio API)
  pages/index.astro, cv.astro, projects/[slug].astro
public/fonts/              # self-hosted pixel font (OFL) — no Google Fonts requests
public/cv.pdf              # CV download (exported from /cv or supplied by owner)
tests/                     # Playwright + axe
```

## 4. Player behaviour

- **Tabs:** clicking a tab switches the panel and sets the URL hash (`/#playlist`). Opening a URL with a hash opens that tab.
- **⏮ / ⏭:** select the previous or next item inside the open tab (job, project, certificate). The ← and → keys do the same when focus is not in a text field. The selected item expands to show its details. On Singles, the selected cover links to its case study.
- **▶ / ❚❚:** starts or stops the music. Audio is muted until the visitor clicks. Volume and mute are remembered in `localStorage`, wrapped in try/catch so the site still works if storage is blocked.
- **Track label and progress bar** show the active tab and item ("Playlist · 01 AI Engineer — Global Collabo Tech") and the position in the list.
- **Always-visible actions:** ⬇ CV (PDF), ≡ Plain CV, ✉ Contact (mailto + LinkedIn).

### Responsive
- **Desktop (≥ 900px):** two columns, scene on the left at ~42% width, tabs on the right.
- **Phone:** the scene shrinks into a top strip with controls beside the name. Tabs scroll horizontally. CV / Plain / Contact form a sticky bottom bar.

### Accessibility
- Tabs follow the WAI-ARIA tabs pattern (`role="tablist"`, arrow keys, `aria-selected`).
- All controls have accessible names. The pixel scene is `aria-hidden` and has a text equivalent.
- `prefers-reduced-motion: reduce` stops all scene animation.
- Text contrast meets WCAG AA.

## 5. Content

### Data file
`src/data/profile.json` follows the cv-reviewer Master Profile shape (`basic_info`, `skills`, `education`, `work_experience`, `org_experience`, `projects`, `publications`, `certificates`). It adds portfolio-only fields:
- `basic_info.headline`, `basic_info.open_to`
- `projects[].slug`, `projects[].featured`, `projects[].cover` (art id), `projects[].case_study` = `{ summary, role, problem, built[], result?, architecture?, links[] }`
- `certificates[].badge` (art id)

The initial content is copied from the current Master Profile, which was itself copied from LinkedIn on 2026-11-23.

### Tabs
- **Now Playing:** headline "Full-stack & AI Engineer", a 2–3 sentence bio condensed from the LinkedIn About, location (Cikarang Selatan, West Java), LinkedIn, GitHub (`github.com/alufonso`).
- **Playlist:** Global Collabo Tech (AI Engineer, apprenticeship), Petak-app (Full-stack & AI, contract), Haloop.AI (Full-stack & AI, contract), Bank Riau Kepri Syariah (intern), UIN Suska (lab assistant). Each entry shows role, company, dates, type, bullets, and tech.
- **Singles (5):** Haloop.AI, Petak-app, CVSight (cv-reviewer-agent), IndoBERT lyric-emotion research, JankenpoVision.
- **Liner Notes:** B.Eng. Informatics Engineering, UIN Suska Riau (2022–2026, GPA 3.76), thesis, the SINTECHCOM paper (75.73% accuracy, 75.85% macro-F1) with link, and the KKN volunteering role.
- **Stickers:** 9 certificates (8 Dicoding, 1 freeCodeCamp). Each badge shows name, issuer, and date, plus the credential link once the owner supplies it.

### Case study page structure
1. One-line summary and role.
2. Problem.
3. What was built (3–5 bullets) and an optional simple architecture diagram (SVG).
4. Result: only real, verifiable facts. No invented metrics. Omit the section if there is nothing real to say.
5. Tech stack and links (demo, repo, paper).

The Haloop.AI and Petak-app case studies are drafted **only from the owner's public LinkedIn bullets**: no client names, internal numbers, or details beyond that. The owner reviews them before the site is published.

### Open content items (owner to provide or confirm)
- Lab Assistant end date: Jan 2025 (old site) vs Jul 2025 (LinkedIn).
- Credential links for certificates and the paper link.
- Public links for Haloop.AI and Petak-app, if any.
- Whether to show the phone number on the site (default: **not shown**; email + LinkedIn only).

## 6. Pixel art

- All art is **original**, hand-made by Claude as SVG on a pixel grid (`shape-rendering: crispEdges`), using the palette in §2.
- **Assets:** the room scene with animated layers (rain, steam, lamp flicker, monitor content per tab), 5 project covers, 9 certificate badges, small UI touches (button shadows, tab corners).
- Animation uses CSS keyframes on SVG groups, with no animation library.
- All art files live in the repo and on local disk only. Nothing is published to Artifacts or other cloud services during development. The only public copy is the deployed site, after the owner approves the deploy.

## 7. Music

- **Generative lofi** in the browser using the Web Audio API (`src/audio/lofi-engine.ts`). It plays a soft drum loop (synthesized kick, snare, and hat), a looping jazzy chord progression (e.g. ii–V–I voicings with low-pass filter and vinyl-style noise), and an optional rain noise layer.
- Original and license-free; no audio files to ship.
- Off by default. It starts only on a ▶ click and stops when the tab is hidden (`visibilitychange`).
- The engine sits behind a small interface (`start()`, `stop()`, `setVolume()`), so an owner-supplied audio file can replace it later.

## 8. Error handling

- **Audio blocked or unsupported:** ▶ shows a "can't play audio" state and the site keeps working.
- **Invalid `profile.json`:** the build fails with the schema error, so nothing broken gets deployed.
- **Unknown hash (`/#foo`):** falls back to Now Playing.
- **Unknown project slug:** Astro 404 page in the same theme, with a link back.

## 9. Testing

- **Schema validation** of `profile.json` runs at build time.
- **Playwright** (desktop and mobile viewports) checks that:
  - every tab opens by click and by keyboard, and the hash updates;
  - ⏭/⏮ and the ←/→ keys move through items;
  - `/cv` renders all sections **with JavaScript disabled**;
  - `/` with JavaScript disabled shows all panels;
  - every `/projects/<slug>` link returns 200;
  - no audio context starts before the first ▶ click;
  - `prefers-reduced-motion` stops the animations.
- **axe-core** runs in the same suite on `/`, `/cv`, and one case study page and fails on serious violations.

## 10. Deployment

- Push to the new GitHub repo `alufonso/portfolio`, then import it in Vercel (framework preset: Astro, static). The subdomain name is chosen by the owner at setup time.
- Each push to `main` deploys. Pull requests get preview deployments.
- Every push and the first deploy need the owner's explicit OK.
