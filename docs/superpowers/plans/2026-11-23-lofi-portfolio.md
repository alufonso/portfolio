# Lofi Pixel Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static recruiter-facing portfolio, styled as a lofi pixel-art music player with tabs, from one validated `profile.json`.

**Architecture:** Astro renders every page and all tab panels as static HTML. Two React islands sit on top: `Player` (tabs, item navigation, audio controls) and `PixelScene` (animated SVG). They share state only through the URL hash and toggle the static panels through data attributes on `#deck`. Content comes from `src/data/profile.json`, which a zod schema validates at build time.

**Tech Stack:** Astro 6.4.x (static) with `@astrojs/react` 5.0.x, React 19, TypeScript, zod, Vitest, Playwright, `@axe-core/playwright`, and `@fontsource/*` packages (self-hosted OFL fonts).

**Spec:** `docs/superpowers/specs/2026-11-23-lofi-portfolio-design.md` (read it alongside this plan).

## Global Constraints

- Node on the dev machine is **22.20.0**. Pin `astro@~6.4.8` and `@astrojs/react@~5.0.7`; Astro 7 needs Node ≥ 22.23.4.
- Output is **static** (`output: 'static'`). No server code and no Vercel adapter.
- English only.
- Palette tokens, exact values: paper `#f6f1e9`, ink `#2b2520`, accent `#b5532a`, night `#2a2238`, lamp `#f2b45c`, muted `#6b6058`, line `#e3d9cc`.
- Tab ids, in order: `now-playing`, `playlist`, `singles`, `liner-notes`, `stickers`. Hash format: `#<tab>` or `#<tab>/<index>`, with a 0-based index.
- `profile.json` must not contain `phone`. Islands receive only the props listed in their Interfaces, never the profile object.
- No network font, analytics, or CDN requests. Fonts come from `@fontsource` packages, bundled locally.
- No audio before the first ▶ click. The music never resumes automatically after `visibilitychange`.
- All art is original SVG on a pixel grid (`shape-rendering="crispEdges"`). No third-party art or music, and nothing resembling "Lofi Girl".
- Assets and mockups stay local. **No `git push`, no Vercel deploy, no Artifact publishing** without the owner's explicit OK.
- Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Out-of-range or garbage hash** (`#playlist/99`, `#singles/-1`, `#xyz/abc`): the index clamps into range and an unknown tab falls back to `now-playing`. There is no crash and no blank panel. Pinned in Task 3.
2. **Phone-width layout (320px)**: no horizontal page scroll, and the CV / Plain / Contact bar stays reachable. Pinned in Task 10.
3. **localStorage throws** (private mode or blocked storage): the volume falls back to `0.5` and the player still works. Pinned in Task 6.
4. **Arrow keys while typing or with a modifier key** (focus in an input; Alt+← for browser back): item navigation must not steal the key. Pinned in Task 5.
5. **Long content** (a long bullet, a long company name): text wraps inside cards and never overflows the panel. Pinned in Task 10 using the longest real bullet.

---

## File Structure

```
astro.config.mjs                 # static output, react() integration
package.json / tsconfig.json
vitest.config.ts                 # unit tests in tests/unit
playwright.config.ts             # e2e in tests/e2e; webServer = astro preview
src/styles/tokens.css            # palette + font stacks + base
src/styles/print.css             # @media print rules for /cv
src/data/profile.json            # content (no phone)
src/data/profile.ts              # zod schema + validated export
src/lib/deck.ts                  # hash parse/format/step (pure)
src/lib/volume.ts                # localStorage volume (try/catch)
src/audio/lofi-engine.ts         # generative Web Audio music
src/art/scene/*.svg.ts           # scene layers as SVG strings/JSX
src/art/covers.tsx               # 5 project covers (by art id)
src/art/badges.tsx               # badge art (by art id)
src/components/Layout.astro      # html shell, fonts, tokens
src/components/Deck.astro        # #deck + 5 static panels
src/components/panels/*.astro    # NowPlaying, Playlist, Singles, LinerNotes, Stickers
src/components/islands/Player.tsx
src/components/islands/PixelScene.tsx
src/pages/index.astro, cv.astro, 404.astro, projects/[slug].astro
scripts/import-master-profile.mjs  # one-time converter from cv-reviewer Master Profile
tests/unit/*.test.ts
tests/e2e/*.spec.ts
README.md                        # dev commands + release checklist
```

---

### Task 1: Scaffold Astro project, design tokens, test harness

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `src/styles/tokens.css`, `src/components/Layout.astro`, `src/pages/index.astro` (placeholder), `tests/e2e/smoke.spec.ts`, `README.md`
- Modify: `.gitignore` (add `node_modules/`, `dist/`, `.astro/`, `test-results/`, `playwright-report/`)

**Interfaces:**
- Produces: `Layout.astro` with props `{ title: string; description: string }` and a default slot. It imports the fonts and `tokens.css`. CSS custom properties: `--paper --ink --accent --night --lamp --muted --line --font-pixel --font-serif --font-sans`.
- npm scripts: `dev`, `build`, `preview`, `test:unit` (`vitest run`), `test:e2e` (`playwright test`), `test` (both).

- [ ] **Step 1:** Install deps: `npm i astro@~6.4.8 @astrojs/react@~5.0.7 react@^19 react-dom@^19 zod @fontsource/pixelify-sans @fontsource/lora @fontsource/inter` and `npm i -D typescript @types/react @types/react-dom vitest @playwright/test @axe-core/playwright`. Then `npx playwright install chromium`.
- [ ] **Step 2:** Write `tests/e2e/smoke.spec.ts`: `test('home responds and has title')`. Assert that `page.goto('/')` returns 200, that `page.title()` contains `Agustar Alfonso`, and that **no request goes to a host other than the preview server** (collect `page.on('request')` URLs and expect all to start with the baseURL).
- [ ] **Step 3:** Configure `playwright.config.ts`. Use `webServer: { command: 'npm run build && npm run preview -- --port 4321', url: 'http://localhost:4321' }` and two projects: `desktop` (1280×800) and `mobile` (`devices['Pixel 7']`).
- [ ] **Step 4:** Run `npm run test:e2e`. Expected: FAIL (no page yet, or wrong title).
- [ ] **Step 5:** Build `Layout.astro` and a placeholder `index.astro` with the title `Agustar Alfonso — Full-stack & AI Engineer`. Font stacks: `--font-pixel: 'Pixelify Sans', monospace; --font-serif: 'Lora', Georgia, serif; --font-sans: 'Inter', system-ui, sans-serif`. Set `body { background: var(--paper); color: var(--ink); }`.
- [ ] **Step 6:** Run `npm run test:e2e`. Expected: PASS on both projects.
- [ ] **Step 7:** Write `README.md` (dev/test/build commands) and commit `chore: scaffold Astro portfolio with tokens and test harness`.

### Task 2: Profile data + schema

**Files:**
- Create: `scripts/import-master-profile.mjs`, `src/data/profile.json`, `src/data/profile.ts`, `tests/unit/profile.test.ts`

**Interfaces:**
- Produces from `src/data/profile.ts`: `ProfileSchema` (zod, `.strict()` on every object), `type Profile = z.infer<typeof ProfileSchema>`, `parseProfile(raw: unknown): Profile` (throws a `ZodError`), and `profile: Profile` (validated `profile.json`).
- Key field shapes (all other fields are as in the spec §5):
  - `work_experience[]`: `{ title, company, duration, type: 'Apprenticeship'|'Contract'|'Internship'|'Part-time'|'Full-time', tech: string[], bullets: string[] }`
  - `projects[]`: `{ slug, name, featured: boolean, cover: string, technologies: string[], link?, repo?, case_study: { summary, role, problem, built: string[], result?, architecture?, links: {label, url}[] } }`
  - `certificates[]`: `{ name, issuer, date, link?, badge: string, skills: string[] }`
  - `basic_info`: `{ name, email, location, summary, github, linkedin, portfolio?, headline, open_to }`. There is **no `phone`**; strict mode rejects it.
- `scripts/import-master-profile.mjs <master_profile.json> <out.json>`: copies the Master Profile, drops `basic_info.phone`, splits each `description` into `bullets` (strip the `"- "` prefix and skip empty lines), and moves `"(Contract)"`-style suffixes out of `title` into `type`. Portfolio-only fields are filled by hand afterwards.

- [ ] **Step 1:** Write `tests/unit/profile.test.ts`:
  - `parses the real profile`: `expect(() => parseProfile(json)).not.toThrow()`.
  - `rejects a phone field`: add `basic_info.phone = '+62…'` and expect it to throw.
  - `rejects an unknown work type`: `type: 'Freelance'` throws.
  - `every project slug is unique and url-safe`: matches `/^[a-z0-9-]+$/`.
  - `has the 5 spec singles`: `profile.projects.map(p => p.slug)` equals `['haloop-ai','petak-app','cvsight','indobert-lyrics','jankenpovision']`.
  - `bullets have no leading "- "`: across work, org, and projects.
- [ ] **Step 2:** Run `npm run test:unit`. Expected: FAIL (module missing).
- [ ] **Step 3:** Implement `profile.ts` and the import script. Run the script against `C:\Users\M S I\Projects\cv-reviewer-agent\backend\master_profile.json` to create `profile.json`.
- [ ] **Step 4:** Hand-fill the portfolio fields:
  - `headline`: "Full-stack & AI Engineer". `open_to`: "Full-stack, AI and backend engineering roles".
  - `tech[]` for each job, taken from the technologies named in its bullets.
  - 4 new `projects[]` entries, using the source table in spec §5. Case studies use **only** those sources: no client names, internal numbers, or invented metrics. `result` is omitted when there is no real fact.
  - Cover and badge art ids: `cover-<slug>`; badges `badge-cloud`, `badge-ml`, `badge-python`, `badge-prompt`, `badge-ai`, `badge-spec`, `badge-growth`, `badge-finance`, `badge-web`.
- [ ] **Step 5:** Run `npm run test:unit`. Expected: PASS.
- [ ] **Step 6:** Commit `feat: add validated profile data`.

### Task 3: Deck state (hash logic)

**Files:**
- Create: `src/lib/deck.ts`, `tests/unit/deck.test.ts`

**Interfaces:**
- Produces:
  - `TABS = ['now-playing','playlist','singles','liner-notes','stickers'] as const` and `type TabId = typeof TABS[number]`
  - `type Counts = Record<TabId, number>` (number of items per tab; `now-playing` = 1)
  - `type DeckState = { tab: TabId; item: number }`
  - `parseHash(hash: string, counts: Counts): DeckState`
  - `formatHash(s: DeckState): string`: returns `#tab` when `item === 0`, otherwise `#tab/item`
  - `stepItem(s: DeckState, delta: 1 | -1, counts: Counts): DeckState`: clamps and does **not** wrap
  - `stepTab(s: DeckState, delta: 1 | -1 | 'first' | 'last'): DeckState`: wraps (ARIA tabs); resets `item` to 0

- [ ] **Step 1:** Write the tests, with `counts = { 'now-playing':1, playlist:5, singles:5, 'liner-notes':2, stickers:9 }`:
  - `''` → `{tab:'now-playing', item:0}`
  - `'#playlist'` → `{playlist, 0}`, and `'#playlist/2'` → `{playlist, 2}`
  - Review Focus 1: `'#playlist/99'` → item 4; `'#singles/-1'` → item 0; `'#xyz/abc'` → now-playing, 0; `'#stickers/2.5'` → item 0
  - `formatHash({playlist,0})` === `'#playlist'`, and `formatHash({playlist,3})` === `'#playlist/3'`
  - `stepItem` at the last item with +1 stays at the last item
  - `stepTab` from `stickers` with +1 → `now-playing`; `'first'` → `now-playing`; `'last'` → `stickers`
- [ ] **Step 2:** Run `npx vitest run tests/unit/deck.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement `deck.ts` as pure functions with no DOM access.
- [ ] **Step 4:** Run it again. Expected: PASS.
- [ ] **Step 5:** Commit `feat: add deck hash state helpers`.

### Task 4: Static deck panels (no-JS first)

**Files:**
- Create: `src/components/Deck.astro`, `src/components/panels/NowPlaying.astro`, `Playlist.astro`, `Singles.astro`, `LinerNotes.astro`, `Stickers.astro`, `tests/e2e/nojs.spec.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `profile` (Task 2) and `TABS` (Task 3).
- Produces DOM contract (used by Task 5 and the tests):
  - `<div id="deck">` containing `<section data-panel="<TabId>" id="panel-<TabId>" aria-labelledby="tab-<TabId>">`. Each section starts with `<h2>` text "<Twin> — <Plain>", e.g. "Playlist — Experience".
  - Each item: `<article data-item="<index>">`, collapsed by default in JS mode only.
  - Singles items contain `<a href="/projects/<slug>">`. Stickers items contain the credential link if present.
  - CSS: `#deck[data-js] [data-panel]:not(.is-active){display:none}`
- Now Playing shows the headline, bio, location, LinkedIn/GitHub links, and **Top skills**: the first 10 entries of `skills[]`.

- [ ] **Step 1:** Write `tests/e2e/nojs.spec.ts`, using `test.use({ javaScriptEnabled: false })`:
  - `all five panels visible`: each `[data-panel]` is visible, with the heading texts "Now Playing — About", "Playlist — Experience", "Singles — Projects", "Liner Notes — Education & Publication", "Stickers — Certificates".
  - `playlist lists 5 jobs in order`: the first article contains "Global Collabo Tech", the last contains "Universitas Islam Negeri Sultan Syarif Kasim Riau".
  - `singles link to 5 case studies`: 5 `a[href^="/projects/"]`.
  - `action links work without JS`: `nav[aria-label="Actions"]` contains links to `/cv` and `mailto:`.
  - `no phone number anywhere`: `page.content()` does not contain `PHONE_REDACTED`.
- [ ] **Step 2:** Run `npx playwright test tests/e2e/nojs.spec.ts`. Expected: FAIL.
- [ ] **Step 3:** Build `Deck.astro`, the panels, and the static `<nav aria-label="Actions">` in `index.astro` (link rules in Task 5's "Not in the island" list). They use the warm editorial styles; cards get `border: 2px solid var(--ink); box-shadow: 3px 3px 0 var(--accent)`.
- [ ] **Step 4:** Run it again. Expected: PASS.
- [ ] **Step 5:** Commit `feat: render all tab panels as static HTML`.

### Task 5: Player island (tabs, items, keyboard)

**Files:**
- Create: `src/components/islands/Player.tsx`, `tests/e2e/player.spec.ts`
- Modify: `src/pages/index.astro` (mount `<Player client:load …/>` in the left column)

**Interfaces:**
- Consumes: `parseHash`, `formatHash`, `stepItem`, `stepTab`, `TABS`, `Counts` (Task 3), and the DOM contract (Task 4).
- Produces: `Player` props `{ tabs: { id: TabId; twin: string; plain: string }[]; itemLabels: Record<TabId, string[]> }`. No contact data goes into the island.
  - On mount it adds `data-js` to `#deck`, then applies the state.
  - Applying state means: `#deck.dataset.activeTab/activeItem`; `.is-active` on the panel; `aria-expanded` on items, with only the active item expanded; `history.replaceState(formatHash(s))` followed by `dispatchEvent(new HashChangeEvent('hashchange'))`.
  - Track label text: `"<Twin> · <NN> <itemLabel>"`.
- Renders:
  - the tablist (`role="tablist"`, buttons `role="tab" id="tab-<id>" aria-controls="panel-<id>"`);
  - ⏮ / ⏭ buttons (`aria-label` "Previous item" / "Next item");
  - the track label;
  - a `<progress>` with `value=item+1 max=count`.
  - Task 6 adds the audio controls.
- **Not in the island:** the action links live as static anchors in `index.astro`, in `<nav aria-label="Actions">` below the Player:
  - "⬇ CV" → `/cv.pdf` if `public/cv.pdf` exists at build time (`fs.existsSync`), otherwise `/cv`;
  - "≡ Plain CV" → `/cv`;
  - "✉ Contact" → `mailto:<email>`;
  - "LinkedIn" → `https://<linkedin>`.
  - They work without JS (spec §3).

- [ ] **Step 1:** Write `tests/e2e/player.spec.ts`:
  - `clicking a tab shows only that panel and sets hash`: click "Playlist"; `#panel-playlist` is visible, `#panel-singles` is hidden, and the URL ends with `#playlist`.
  - `deep link selects item`: goto `/#playlist/2`; the Playlist tab has `aria-selected=true`, and `[data-panel=playlist] [data-item="2"]` has `aria-expanded=true`.
  - `next button and arrow keys move items`: on `#playlist`, clicking ⏭ makes the hash `#playlist/1`; pressing `ArrowRight` with focus on `body` makes it `#playlist/2`.
  - `arrows in tablist move tabs`: focus `#tab-playlist`, press `ArrowRight`; `#tab-singles` is focused and selected. `End` selects stickers.
  - Review Focus 4: put a temporary `<input>` in the page, focus it, and press ArrowRight; the hash is unchanged. `Alt+ArrowLeft` on the body does not change the item.
- [ ] **Step 2:** Run `npx playwright test tests/e2e/player.spec.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement `Player.tsx`. The global key handler ignores events where `target` is an input, textarea, or contentEditable, where any of `altKey`/`ctrlKey`/`metaKey` is held, or where the target is inside `[role=tablist]` (the tablist has its own handler).
- [ ] **Step 4:** Run it again. Expected: PASS (desktop and mobile).
- [ ] **Step 5:** Commit `feat: add player island with tabs and keyboard navigation`.

### Task 6: Lofi engine, volume, audio controls

**Files:**
- Create: `src/audio/lofi-engine.ts`, `src/lib/volume.ts`, `tests/unit/volume.test.ts`, `tests/e2e/audio.spec.ts`
- Modify: `src/components/islands/Player.tsx` (▶/❚❚ button and volume slider)

**Interfaces:**
- Produces:
  - `createLofiEngine(): LofiEngine`, where `interface LofiEngine { start(): Promise<void>; stop(): void; setVolume(v: number): void; readonly playing: boolean }`. The `AudioContext` is created **inside `start()`**, never earlier. `start()` rejects if Web Audio is unavailable.
  - `readVolume(): number` (default `0.5`, clamped to 0..1) and `writeVolume(v: number): void`. Storage key `lofi-volume`. Both are wrapped in try/catch.
- Engine content (spec §7):
  - 75 BPM;
  - synthesized kick/snare/hat (oscillator + noise bursts);
  - chord loop Dm9 → G13 → Cmaj9 → A7(b9), one bar each, on triangle oscillators through a low-pass at ~1200 Hz;
  - low-volume pink-noise "vinyl" and rain layer.
- Player: the ▶ button has `aria-label` "Play music" / "Pause music". If `start()` rejects, it shows the state "Audio unavailable" and disables the button. The slider is `<input type="range" aria-label="Volume">`. On `visibilitychange` to hidden, it calls `stop()` and does not restart.

- [ ] **Step 1:** Write `tests/unit/volume.test.ts`: default `0.5`; round-trip `0.3`; clamp `7` to `1`; and Review Focus 3: when the `localStorage` getter throws, `readVolume()` returns `0.5` and `writeVolume` does not throw.
- [ ] **Step 2:** Write `tests/e2e/audio.spec.ts`. In `page.addInitScript`, wrap `window.AudioContext` to count constructions into `window.__ac`.
  - `no audio context before click`: load `/`, wait 1 second, expect `__ac === 0`.
  - `play creates context and toggles label`: click "Play music"; `__ac === 1`; the button now reads "Pause music".
  - `hidden tab stops and does not resume`: play, then simulate hidden and visible through `document.dispatchEvent(new Event('visibilitychange'))` with `visibilityState` stubbed; the button reads "Play music".
  - `blocked audio shows unavailable`: set `window.AudioContext = undefined` in the init script, click Play, and expect the text "Audio unavailable".
- [ ] **Step 3:** Run `npm test`. Expected: the new tests FAIL.
- [ ] **Step 4:** Implement `volume.ts`, `lofi-engine.ts`, and the Player controls.
- [ ] **Step 5:** Run `npm test`. Expected: PASS. Then listen manually with `npm run dev`: the music must stay soft, and stopping must not click.
- [ ] **Step 6:** Commit `feat: add generative lofi music with volume control`.

### Task 7: PixelScene island (room scene, monitor per tab, motion)

**Files:**
- Create: `src/art/scene/room.tsx` (static layers), `src/art/scene/monitor.tsx` (5 monitor variants), `src/components/islands/PixelScene.tsx`, `tests/e2e/scene.spec.ts`
- Modify: `src/pages/index.astro` (`<PixelScene client:load />` above the Player)

**Interfaces:**
- Consumes: `parseHash` and `TABS` (Task 3). It listens to `hashchange` and reads the hash on mount. It has **no props**; it doesn't need item counts, so the item index is ignored (counts are passed as all 1).
- Produces:
  - Root `<svg viewBox="0 0 96 54" shape-rendering="crispEdges" aria-hidden="true" data-monitor="<TabId>">`.
  - A visually hidden text sibling: "Pixel art: Agustar coding at night by a rainy window".
  - Animated groups `.rain`, `.steam`, `.lamp`, `.screen-flicker` use CSS keyframes.
  - `@media (prefers-reduced-motion: reduce)` sets `animation: none` on them.
- Art direction: the brainstorm sketch (`.superpowers/brainstorm/*/content/lofi-pixel.html`, option A) refined, with more detail on the desk, window, and figure (from behind, headphones, brick hoodie). Palette from Global Constraints.
- Monitor variants:
  - `now-playing`: name in pixel letters;
  - `playlist`: code lines;
  - `singles`: a small album cover;
  - `liner-notes`: a paper page with lines;
  - `stickers`: 3 badges.

- [ ] **Step 1:** Write `tests/e2e/scene.spec.ts`:
  - `monitor follows tab`: goto `/#singles`; the scene `svg` has `data-monitor="singles"`. Click the Stickers tab; it becomes `"stickers"`.
  - `reduced motion stops animation`: with `page.emulateMedia({ reducedMotion: 'reduce' })`, `getComputedStyle(.rain).animationName === 'none'`.
  - `scene is hidden from screen readers`: the svg has `aria-hidden="true"`, and the alt text exists.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Draw the scene and implement `PixelScene.tsx`.
- [ ] **Step 4:** Run it. Expected: PASS. Then review the scene visually at 1280px and 390px.
- [ ] **Step 5:** Commit `feat: add animated pixel room scene`.

### Task 8: Project covers and certificate badges

**Files:**
- Create: `src/art/covers.tsx`, `src/art/badges.tsx`, `tests/unit/art.test.ts`
- Modify: `src/components/panels/Singles.astro`, `Stickers.astro` (render the art)

**Interfaces:**
- Produces: `Cover({ id, size }: { id: string; size: number })` and `Badge({ id, size })`. Both render a 32×32-grid SVG. `COVER_IDS` and `BADGE_IDS` are `string[]`.
- Cover themes: Haloop.AI (chat bubbles and a loop), Petak-app (phone with a speech bubble), CVSight (document and magnifier), IndoBERT (music note and heart/emotion bars), JankenpoVision (rock/paper/scissors hands).

- [ ] **Step 1:** Write `tests/unit/art.test.ts`: every `profile.projects[].cover` is in `COVER_IDS`, and every `profile.certificates[].badge` is in `BADGE_IDS`.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Draw the 5 covers and 9 badges, then wire them into the panels.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: add project covers and certificate badges`.

### Task 9: Case study pages and themed 404

**Files:**
- Create: `src/pages/projects/[slug].astro`, `src/pages/404.astro`, `tests/e2e/pages.spec.ts`

**Interfaces:**
- Consumes: `profile.projects` (Task 2) and `Cover` (Task 8).
- `getStaticPaths()` maps `profile.projects` to `{ params: { slug } }`.
- Page sections, in order: summary and role, "Problem", "What I built", "Result" (only if `result` is set), "Architecture" (only if `architecture` is set), "Tech", and links. It has a mini player header (name + "◀ Back to Singles" → `/#singles`).

- [ ] **Step 1:** Write `tests/e2e/pages.spec.ts`:
  - `every case study returns 200`: loop over the 5 slugs and check that each `<h1>` equals the project name.
  - `no result section when result missing`: for a slug with no `result` (read from `profile.json`), there is no "Result" heading.
  - `unknown route is themed 404`: `/projects/nope` returns status 404, has the text "Track not found", and a link to `/`.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement both pages.
- [ ] **Step 4:** Run it. Expected: PASS.
- [ ] **Step 5:** Commit `feat: add case study pages and 404`.

### Task 10: Plain CV page, responsive polish, a11y and leak guards

**Files:**
- Create: `src/pages/cv.astro`, `src/styles/print.css`, `tests/e2e/cv.spec.ts`, `tests/e2e/quality.spec.ts`
- Modify: the layout CSS in `index.astro` and the panels, for the breakpoints

**Interfaces:**
- Consumes: `profile` (Task 2).
- `/cv` sections, in order: header (name, headline, location, email, LinkedIn, GitHub), Summary, Skills (**all** `skills[]`), Experience, Projects, Education, Publication, Certificates, Volunteering. No art and no islands.
- Layout: two columns at ≥ 900px (scene + player at 42%). Below that, the scene sits in a top strip, tabs scroll horizontally (`overflow-x:auto`), and the action bar is `position: sticky; bottom: 0`.

- [ ] **Step 1:** Write `tests/e2e/cv.spec.ts` with `javaScriptEnabled: false`: all 9 headings are present, the skills list has 32 items, and the page contains no `PHONE_REDACTED`. Then `page.emulateMedia({ media: 'print' })` and check that no element with `data-panel` or `svg[data-monitor]` exists.
- [ ] **Step 2:** Write `tests/e2e/quality.spec.ts`:
  - `axe has no serious violations` on `/`, `/cv`, and `/projects/cvsight` (`AxeBuilder`; filter `impact in ['serious','critical']` and expect `[]`).
  - Review Focus 2: `no horizontal scroll at 320px`. At viewport 320×640, `document.documentElement.scrollWidth <= 320` on `/` and `/cv`. The "⬇ CV" link is in the viewport.
  - Review Focus 5: `long bullet wraps`. On `/#playlist/0`, the expanded article's `scrollWidth <= clientWidth`.
  - `client JS has no private data`: read every `dist/_astro/*.js` file with `fs` and check that none contains `phone` or `alfonsoagustar`.
- [ ] **Step 3:** Run `npm test`. Expected: the new tests FAIL.
- [ ] **Step 4:** Implement `/cv`, `print.css`, and the responsive CSS. Fix any axe findings.
- [ ] **Step 5:** Run `npm test`. Expected: everything PASSES.
- [ ] **Step 6:** Add the README release checklist: "After content changes, run `npm run build && npm run preview`, open `/cv`, print it to PDF, and save it as `public/cv.pdf`." The owner supplies the first `cv.pdf`. Until then, the "⬇ CV" link falls back to `/cv` (Task 5). Commit `feat: add plain CV page, responsive layout, quality checks`.

---

## Self-Review Notes

- **Spec coverage:**
  - §2 → Tasks 4, 7, 8
  - §3 → Tasks 1–5
  - §4 → Tasks 5, 6, 10
  - §5 → Tasks 2, 4, 9, 10
  - §6 → Tasks 7, 8
  - §7 → Task 6
  - §8 → Tasks 6, 3, 9
  - §9 → tests in every task
  - §10: the deploy is not in this plan on purpose. Pushing and deploying need the owner's OK, so they are a separate step after review.
- **Open owner items:** the Lab Assistant end date (Jan vs Jul 2025) and the credential and paper links. Task 2 uses the Master Profile values (Jul 2025, empty links) until the owner confirms. Blank links are not rendered.
