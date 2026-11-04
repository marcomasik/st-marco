# St. Marco

Private website for St. Marco's DJ mixes (replaces Mixcloud). Main use: listening on an iPhone,
also in the background (screen locked, Google Maps open). Audio reliability beats everything.
Hosting: Netlify (`netlify.toml`), deployed from this Mac with `npm run deploy`; the audio is
uploaded with the site. Cloudflare R2/Access from the original Phase 3 plan are not built.

## Stack

- Vite 8, React 19, React Router 7 (data router), TypeScript 6 strict + `noUncheckedIndexedAccess`.
  - React Router 8 needs Node 22.22+ (local Node is 22.15). TypeScript 7 (Go) is not supported
    by typescript-eslint yet. Upgrade both together when that changes.
- SCSS (sass-embedded) with the global SCSS conventions. Exception to the global setup:
  `src/scss/style.scss` is imported by `src/main.tsx` and compiled by Vite into `dist/`
  (no `css/style.css`; `npm run dev` watches).
- ESLint 10 flat config (typescript-eslint type-checked, react-hooks, react-refresh) + Prettier.
- Vitest (node environment, storage and clock injected) for logic. Playwright for e2e and
  screenshots: project `chrome` uses the installed Google Chrome, project `webkit` stands in
  for iPhone Safari.
- sharp (image script), roughjs (hand-drawn borders), fonts self-hosted via @fontsource.

## Commands

- `npm run dev`: dev server with the real mixes (audio from `public/mixes/`).
- `npm run build`: typecheck, then build. Fails when `src/data/mixes.json` is invalid.
- `npm run preview`: serves `dist/` on port 4173.
- `npm run check`: typecheck, lint, Prettier check, unit tests. Run before handing work back.
- `npm test` / `npm run test:watch`: Vitest.
- `npm run e2e`: Playwright in Chrome and WebKit (builds and starts preview itself).
- `npm run screenshots`: Playwright screenshots into `screenshots/` (gitignored).
- `npm run images`: regenerates `public/img/*` variants and `public/icons/*` from
  `public/img/island.jpg`. Crops are constants at the top of `scripts/make-images.mjs`.
- `npm run media:test`: generates the 61:30 synthetic test mix for Playwright
  (`tests/fixtures/media/`, needs ffmpeg). Its marker times match the demo tracklists.
- `npm run deploy` / `npm run deploy:preview`: build locally and upload to Netlify
  (production / draft URL). Needs `netlify login` and a linked site. Or drag `dist/` onto
  the project's Deploys page. Redirects/headers: `public/_redirects`, `public/_headers`.

## Structure

- `index.html`: also holds the static background photo (`.photo`, `#photo-frame`).
- `src/main.tsx`: `PlayerProvider` wraps `RouterProvider`; fonts and SCSS are imported here.
- `src/app/`: router and `AppLayout` (the scene around every page).
- `src/pages/`: `MixListPage` (`/`), `MixDetailPage` (`/mix/:slug`), `NotFoundPage`.
- `src/components/`: UI components, one SCSS partial each in `src/scss/components/`.
  Scene: `PhotoDoodles`, `PalmFrond`, `HangingPanel`, `PanelHeader`, `Wordmark`, `Boombox`.
  Content: `MixCard`, `MixCover`, `PlayToggleButton`, `Tracklist`, `SeekBar`.
  Drawing: `RoughFrame`, `doodles/Doodles.tsx`, `icons/`.
- `src/drawing/`: seeded random, path helpers (wobbly circles, spirals, waves, stars),
  the Rough.js wrapper and `useParentSize`.
- `src/assets/illustrations/`: the replaceable placeholder drawings (see below).
- `src/player/`: `PlayerProvider` (renders the audio element), `playerController` (all audio
  logic), `playerStore`, `positionStorage`, `mediaSession`, `tracklist`, `format`, hooks in
  `usePlayer.ts`. Unit tests sit next to the modules (`*.test.ts`).
- `src/data/`: `mixes.json`, types, validator, URL resolution.
- `scripts/`: `make-images.mjs`, `setup-dev-media.mjs`, `draw-placeholders.mjs`.
- `tests/e2e/`: Playwright specs: `playback` (audio behaviour), `layout` (rules at 360, 390,
  768, 1280, 1920), `screenshots` (`@screenshots`, run via `npm run screenshots`).

## Player rules

- Exactly one `<audio preload="metadata">`, rendered by `PlayerProvider` outside the router.
  Never unmount it, never add a second one. No Web Audio API for playback (it can be
  suspended in the background on phones).
- No autoplay. Playback starts from a tap, and `play()` is called synchronously inside the
  tap handler (iOS requirement). Auto-advance to the next mix on `ended` is the only
  exception (`AUTO_ADVANCE` in `playerController.ts`).
- `src` is set on the first tap only, so page loads cost no audio requests.
- Saved positions only through `positionStorage.ts`; every storage access is in try/catch.
- Lock screen: `mediaSession.ts` (metadata, artwork, handlers, `setPositionState`).
- Components read state with `usePlayerState(selector)`. Selectors return primitives or
  stable references, so time updates only re-render what shows the time.
- List order (newest first) is the next/previous order.

## Data

- `src/data/mixes.json` holds the real mixes; fields are documented in `src/data/types.ts`.
- Demo mixes for the tests live in `tests/fixtures/` (`mixes.json`, cover, test MP3). The
  e2e build (`vite build --mode e2e`, `dist-e2e/`) swaps them in; they never reach `dist/`.
  Validated at load time and in `vite build` (plugin in `vite.config.ts`). Unknown fields,
  duplicate ids/slugs, unsorted or out-of-range tracklists are errors.
- `id` never changes once published (saved positions use it).
- `audioUrl` and `cover`: relative keys resolve against `VITE_MEDIA_BASE_URL` (default
  `/mixes`, i.e. `public/mixes/`, which is how Netlify serves them); absolute URLs and
  root-relative paths (`/img/...`) pass through.
- Audio never goes into the repo: `public/mixes/` and `tests/fixtures/media/*.mp3` are
  gitignored. A new mix: drop the file in `public/mixes/`, add an entry, `npm run deploy`.
- Search engines: `robots.txt` disallows all, plus `noindex` meta and `X-Robots-Tag`.

## Design rules

Concept: a real tropical photo (`public/img/island.jpg`) with a marker-doodled world on top.
They must read as one thing: shared palette, doodles crossing from paper onto the photo.

- Palette: tokens in `src/scss/base/_tokens.scss`, sampled from the photo. Use the custom
  properties, never raw hex in components. Text colours have AA-safe variants (`--ink-soft`,
  `--sky-text`); `src/designRules.test.ts` checks every text/background pair.
- Type: headings and hand-drawn labels in Gochi Hand (`--font-hand`), everything you read
  (body, tracklists, times) in Nunito (`--font-body`, tabular digits for times). Self-hosted
  via @fontsource, imported in `src/main.tsx`.
- Doodle style: soft-black ink outline over a colour fill offset by a few px. Colours go
  through classes in `_doodle.scss` (SVG attributes cannot read custom properties).
- Hand-drawn borders: `RoughFrame` (Rough.js generator, seeded, regenerated only on resize).
  Pass a stable seed (e.g. `hashString(mix.id)`); never random per render. No SVG filters
  (feTurbulence) on large elements: too slow on iPhones.
- The photo is static HTML in `index.html` (fast LCP). `PhotoDoodles` portals the doodles
  into `#photo-frame`, positioned in photo pixels (1920 x 1279).
- Layout numbers are custom properties in `layout/_scene.scss`. Breakpoints in
  `base/_breakpoints.scss`: phones < 600px wide or < 600px high (short strings, island crop
  in the header, bottom player bar); from 600 x 600 the panel hangs below the island;
  from 760 x 600 the player is the boombox and the panel never overlaps it.
- Cards and the detail page size themselves with `@container panel` (the panel width), not
  the viewport.
- Decorations: `aria-hidden`, `pointer-events: none`, never over interactive elements
  (`tests/e2e/layout.spec.ts` checks this at all five widths).
- Modifiers are `&.is-*` classes (plain names like `.panel` collide with components).
- Motion: swing, card hover, record spin. All off with `prefers-reduced-motion`. Hover
  styles only inside `@media (hover: hover)` (no sticky hover on iPhone).
- No em dashes in any UI text, including mixes.json (tested).
- Tap targets at least 44px (tested). Buttons are real `<button>` elements with a visible
  focus state.

### Replaceable illustrations

- `src/assets/illustrations/boombox.svg` (320 x 290): the player body. The screen and keys
  are HTML over two zones (screen y 46-152, keys y 158-210, both x 20-300); zone positions
  are in `_boombox.scss`.
- `src/assets/illustrations/palm-frond.svg` (420 x 320): base at the bottom left.
- `src/components/Wordmark.tsx`: the "St. Marco" lettering (about 10:3).
- Placeholders are generated by `node scripts/draw-placeholders.mjs`; replacing a file
  with your own drawing (same name, transparent background) is all it takes.
