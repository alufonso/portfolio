# Lofi Pixel Portfolio — Design Spec

- **Date:** 2026-11-23
- **Owner:** Agustar Alfonso
- **Status:** Approved in brainstorming; revised after independent spec review (2026-11-23); awaiting owner review

## 1. Goal

This spec describes a new personal portfolio site for **recruiters and HR**. In 30 seconds a visitor should learn who Agustar is and what he has shipped, and be able to download his CV. The site should feel unique and memorable without slowing that reader down.

The old site (`alufonso/portofolio`, portofolio-eta-one-66.vercel.app) is currently offline (Vercel `404 DEPLOYMENT_NOT_FOUND`), and its design was judged weak. This spec replaces it. The old repo stays as an archive.

### Success criteria
- A recruiter can find role, current company, experience, and a CV download within 30 seconds, on desktop or phone.
- All content is readable without JavaScript, by bots, and in a plain printable view.
- The theme is original: no copied characters (e.g. not "Lofi Girl"), no third-party art or music.
- Updating content means editing one JSON file and redeploying, plus re-exporting `public/cv.pdf` (see §10 release checklist).

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
- **Interactive islands (React):** only two. Both hydrate with `client:load`, because the URL hash must open the right tab right away.
  - `Player`: tab state, ⏮/⏭ item navigation, keyboard handling, URL hash sync, audio control.
  - `PixelScene`: animated SVG scene whose monitor content follows the active tab.
- **Everything else is static HTML** rendered by Astro. That includes all five tab panels and their items.

### Shared state: the URL hash
The two islands are separate React roots and share no memory. The **URL hash** is the single source of truth for the active tab and item, in the form `#<tab>` or `#<tab>/<index>`, e.g. `#playlist/2`.
- `Player` writes it with `history.replaceState` and then dispatches a `hashchange` event.
- `PixelScene` and `Player` both listen for `hashchange`, and both read the hash on mount.
- No state library is needed.

### How Player controls the static panels
The panels are **not** children of the Player island. They are static HTML inside a wrapper `<div id="deck">`. Each panel has `data-panel="<tab>"` and each item has `data-item="<index>"`.
- On hydration, Player adds `data-js` to `#deck`. From then on it sets `data-active-tab` and `data-active-item` on `#deck`, and `aria-selected`/`hidden`/`aria-expanded` on the matching elements.
- CSS shows only the active panel: `#deck[data-js] [data-panel]:not(.is-active){display:none}`. Without JS, `data-js` is never added, so every panel stays visible.
- Player renders its own controls: the tablist, ⏮ ▶ ⏭, volume, and the track label. The tab buttons point at the panels with `aria-controls`.

### Data access and privacy
- `src/data/profile.ts` imports `profile.json` and validates it with a **zod** schema at module load. Every page imports this module, so invalid data throws and fails `astro build`. Astro content collections are not used: the `file()` loader treats a single JSON object's top-level keys as separate entries, which doesn't suit one profile object.
- Islands receive **only the props they need** (tab ids, item labels, counts), never the whole profile. That way profile data isn't bundled into client JS.
- `profile.json` contains **no phone number** and no other field that isn't shown on the site. The repo may be public.

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
  data/profile.json        # single content source (no phone number)
  data/profile.ts          # imports profile.json + zod schema; throws on invalid data (fails the build)
  art/                     # hand-made SVG pixel art (scene parts, covers, badges)
  components/              # Astro components (static) + islands/Player.tsx, islands/PixelScene.tsx
  audio/lofi-engine.ts     # generative lofi music (Web Audio API)
  pages/index.astro, cv.astro, projects/[slug].astro
public/fonts/              # self-hosted fonts (all OFL): pixel font for labels, serif for headings, sans for body — no Google Fonts requests
public/cv.pdf              # CV download, supplied by the owner (see §5 Open content items)
tests/                     # Playwright + axe
```

## 4. Player behaviour

- **Tabs:** clicking a tab switches the panel and sets the URL hash (`/#playlist`). Opening a URL with a hash opens that tab.
- **⏮ / ⏭:** select the previous or next item inside the open tab (job, project, certificate). The selected item expands to show its details. On Singles, the selected cover links to its case study.
- **Keyboard:** the ← / → keys have one job per context.
  - When focus is **inside the tablist**, they move between tabs (WAI-ARIA tabs pattern), with Home/End for the first and last tab.
  - **Anywhere else** on `/` (but not in a text field), they move to the previous or next item, like ⏮ / ⏭.
- **▶ / ❚❚:** starts or stops the music. No audio plays until the visitor clicks ▶.
- **Volume:** a small slider next to ▶. Volume is remembered in `localStorage`, wrapped in try/catch so the site still works if storage is blocked.
- **Hidden tab:** when the browser tab is hidden (`visibilitychange`), the music stops. It does **not** resume by itself when the tab becomes visible again; the visitor presses ▶.
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
`src/data/profile.json` follows the cv-reviewer Master Profile shape (`basic_info`, `skills`, `education`, `work_experience`, `org_experience`, `projects`, `publications`, `certificates`). Two differences:
- `basic_info.phone` is **left out**.
- Every `description` field is stored as an **array of bullet strings** (`bullets[]`) instead of the Master Profile's newline-joined `"- "` string. The copy step splits them once.

Portfolio-only fields:
- `basic_info.headline` (= "Full-stack & AI Engineer"), `basic_info.open_to`
- `work_experience[].type` (`"Apprenticeship" | "Contract" | "Internship" | "Part-time" | "Full-time"`), taken out of the title string, so `title` becomes the bare role. Also `work_experience[].tech[]`, the technologies named in that job's bullets.
- `projects[].slug`, `projects[].featured`, `projects[].cover` (art id), `projects[].case_study` = `{ summary, role, problem, built[], result?, architecture?, links[] }`
- `certificates[].badge` (art id)

Most content is copied from the current Master Profile, which was itself copied from LinkedIn on 2026-11-23. The exception is **`projects[]`**. The Master Profile has only one project (JankenpoVision), so four new entries are written for the portfolio. Each has a named source:

| Single | Source for its text |
|---|---|
| Haloop.AI | The Haloop.AI `work_experience` bullets (LinkedIn) |
| Petak-app | The Petak-app `work_experience` bullets (LinkedIn) |
| CVSight | The `alufonso/cv-reviewer-agent` README and the audit fixes in PR #1 |
| IndoBERT research | The SINTECHCOM `publications` entry and the About text (thesis) |
| JankenpoVision | The existing Master Profile `projects[]` entry |

The Playlist and Liner Notes still show the job and publication themselves. The Singles are separate project-focused write-ups of the same work.

### Tabs
- **Now Playing:** headline "Full-stack & AI Engineer", a 2–3 sentence bio condensed from the LinkedIn About, location (Cikarang Selatan, West Java), LinkedIn, GitHub (`github.com/alufonso`), and a short **"Top skills"** line of 8–10 items picked from `skills[]`.
- **Playlist:** Global Collabo Tech (Artificial Intelligence Engineer, apprenticeship), Petak-app (Full-stack & AI Engineer, contract), Haloop.AI (Full-stack & AI Engineer, contract), Bank Riau Kepri Syariah (intern), UIN Suska (lab assistant). Each entry shows role, company, dates, type, bullets, and tech chips, from the `type` and `tech[]` fields above.
- **`/cv`:** all sections, including the **full skills list** (`skills[]`).
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
- Public links for Haloop.AI and Petak-app, if any. The CVSight links default to the GitHub repo `alufonso/cv-reviewer-agent`; there is no live demo.
- **`public/cv.pdf`:** the owner supplies it, e.g. by printing `/cv` to PDF after the first build. It is a manual file, so it can **go stale** after a JSON edit. The release checklist in §10 says to re-export it whenever content changes. Generating it automatically at build time is out of scope for v1.
- Phone number: **not shown** on the site and not stored in the repo. Contact is email + LinkedIn only.

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
- **Unknown project slug or route:** a themed `src/pages/404.astro`, which builds to `404.html`. Vercel serves it automatically for static sites. It links back to `/`.

## 9. Testing

- **Schema validation** of `profile.json` runs at build time, through `src/data/profile.ts`.
- **Playwright** (desktop and mobile viewports) checks that:
  - every tab opens by click, and the hash updates;
  - ←/→ move between tabs while focus is in the tablist;
  - ⏭/⏮, and ←/→ outside the tablist, move through items;
  - opening `/#playlist/2` selects that item, and the pixel scene's monitor follows the tab;
  - the built client JS does not contain the email's local part or any `phone` key (a data-leak guard);
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
- **Release checklist:** after any content change, re-export `/cv` to `public/cv.pdf`.
