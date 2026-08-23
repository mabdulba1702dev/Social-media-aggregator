# Progress

Current state of the project, in plain terms. Update this whenever a build-order
item lands or a decision gets made — this is the "what's true right now" doc;
`build-order.md` is the plan, `CHANGELOG.md` is the history.

## Status: Phase 1 nearly complete, human-verified in production

**Last updated:** 2026-08-23

**Phase completion:** Phase 0: 17/17. Phase 1: 8 done, 1 partial, 2 not started (of 11). Phase 2: 5 done (1 partial), 2 not started (of 8). Phase 3: 1 done (of 4). Phase 4: 0/4. See `build-order.md` for the itemized list.

### What's working right now

- Full core loop: sign in with Google → create a board → paste a URL from any of 8 platforms → real embed renders → tag it → search for it. All verified against real infrastructure at some point this session, not just typechecked.
- **Auth**: `/login`, `/auth/callback`, `/auth/sign-out`, `middleware.ts` session refresh. A real human has completed the actual Google consent screen and landed back signed in — `handle_new_user` fired correctly against real data. This was the one gap no disposable-test-user script could close, and it's closed.
- **Boards**: create/rename/delete, persistent sidebar navigation (`app/boards/layout.tsx`) listing every board with active-state highlighting on every `/boards/*` page, `/boards` as a "manage boards" page. **Confirmed working via a real user screenshot** in production, not just my own testing.
- **Manual URL add**: `/boards/[boardId]`, all 9 embed providers (YouTube, Instagram, X, TikTok, Reddit, Pinterest, Facebook, Threads, Bluesky), tags (add/remove/filter), full-text search (caption/author, per-board), a basic CSS-columns masonry grid.
- **Real platform logos** (brand SVG marks, not text initials) and **real oEmbed script hydration** — Instagram/X/TikTok/Facebook/Threads/Bluesky embeds actually render as rich widgets now, not stuck on the static fallback (see Recently Completed for the root cause).
- **Hero homepage** for unauthenticated visitors, replacing the old bare placeholder. Now followed by a **Featured posts** section (`components/featured-posts.tsx`) — 5 real, curated public posts across YouTube/X/Instagram/Pinterest/TikTok, saved into a real `visibility: 'public'` board (slug `featured`) through the normal pipeline, readable by signed-out visitors under the existing RLS policy.
- **Sources UI** (`app/boards/[boardId]/sources/`): connect/rename/pause/disconnect a Telegram/Discord/WhatsApp group against a board, linked from the board page header ("Connected groups →"). Connecting is now a real 3-step modal (pick platform → instructions + paste ID → confirmed), built on a new `components/ui/dialog.tsx` — the app's first modal primitive. Replaces the direct-DB-insert workaround. v1 still requires pasting the platform's raw group/channel ID by hand — no in-app discovery mechanism yet (see `notes/ui-scalability-scope.md` for the "detected but unconnected" staging-table idea this would need) — and deliberately has no QR/scan-to-join step (logged as a real future want, not built yet).
- **WhatsApp**: worker code built and paired live against a real dedicated number, verified working end-to-end at the connection layer. Can now be wired to a real board via the sources UI above. Worker itself still only runs locally (see "What's blocking" below).
- **Telegram**: webhook built (`app/api/telegram/route.ts`), secret-token verified, end-to-end tested against a real dev server. Can now be connected to a real board via the sources UI above. Still not registered against a deployed URL (`setWebhook`).
- **Discord**: Gateway listener built (`worker/src/discord.ts`, `discord.js`), same shared pipeline as WhatsApp/Telegram, keyed on channel ID. Not yet tested against a real bot/server — needs a real `DISCORD_BOT_TOKEN` with Message Content Intent enabled, and the worker isn't deployed anywhere (same blocker as WhatsApp).
- **Infra**: real Supabase project (linked, both migrations pushed), Vercel connected (auto-deploys previews per PR and production on merge to `main`), auto-merge on green CI (branch protection requires the CI check; PRs merge themselves once green), npm workspaces monorepo (`worker/` shares `lib/` with the Next.js app).

### Testing debt (deliberately deferred, 2026-08-22 — do not forget)

Explicit project-owner call: testing was put off this session to keep building — logged here so it stays visible rather than silently assumed done. None of the following has been clicked through in a real browser or verified against a real bot connection yet:

- **Sources UI** (`app/boards/[boardId]/sources/`) — built and gate-passing, but never exercised in a real browser: connect/rename/pause/resume/disconnect all still need a real click-through, including the new 3-step connect modal (back button, duplicate-connection error path shown mid-modal, the step-progress dots) and the `unique(platform, external_group_id)` duplicate-connection error path.
- **Featured posts landing section** (`components/featured-posts.tsx`) — 5 real posts saved and confirmed via direct DB query + a raw `curl` against each oEmbed endpoint, but the actual rendered page (`/` signed out) has not been looked at in a browser — layout, dark mode, mobile wrap all unverified.
- **Real end-to-end bot connections** — connecting an actual Telegram/WhatsApp/Discord group to a board through the new sources UI and confirming a real posted link lands on the board hasn't been done for any of the three platforms. Telegram additionally still needs `setWebhook` registered against the deployed URL first, and Discord needs a real bot token + Message Content Intent enabled — see "What's blocking" below.
- **Discord worker** (`worker/src/discord.ts`) specifically — written against discord.js's documented API and typechecks clean, but has never been run against a real Discord bot token or server. Gate-passing isn't the same as working.

See `docs/testing.md` for how UI verification normally happens here (acceptance criteria + a human checking the Vercel preview) — that pass is what's outstanding for all three items above.

### Known environment limitation

No browser/computer-use tool is available to me in this session — confirmed via direct investigation (Vercel's deployment protection blocks plain HTTP fetches against every project URL; a Playwright MCP server was configured but never bound to this specific session despite the browser binary being installed and the server process confirmed running). **Your screenshots are the actual working substitute** and have caught every real UI bug found so far (duplicate boards, invisible navigation, the Twitter width overflow) — this isn't a blocker, just the established workflow.

### Reprioritization note

WhatsApp was pulled forward ahead of the documented Phase 2 sequencing per
explicit project-owner request — logged in `docs/PRD.md` §13 and
`docs/build-order.md` rather than done silently, per `CLAUDE.md`'s rule.
Telegram/Discord bot-listener code is unaffected and stays in its original
Phase 2 slot. Bluesky (Phase 3) was also pulled forward, same reasoning.

### Pending visual redesign (2026-08-21, explicit decision, deliberately deferred)

A full interactive mockup was delivered at `docs/Social media embed aggregator UI/`
(a "Pinboard"-branded design-canvas export: flat/red/zero-radius "Modernist"
system, Archivo type, grayscale photography — a real departure from the
shipped warm-neutral system in `docs/design-system.md`). Reviewing it
surfaced three confirmed-but-not-yet-built decisions:
1. **Adopt the Modernist system fully** as the new production visual
   direction (not just borrow its content/flow) — this will mean reskinning
   every already-shipped screen, including dropping the real platform-logo
   badges shipped 2026-08-20 in favor of the mockup's plain text tags.
2. **A new global cross-board "All Posts" feed page**, additive alongside
   the existing `/boards`/`/boards/[boardId]` pages — the mockup's sidebar
   "boards nested under a source" turned out, on inspection of its own
   logic, to just be a tag filter applied to this global view, not a new
   schema entity. This closes the long-open Phase 1 item 9 cross-board-search
   gap.
3. **A per-post Notes feature** (threaded comments in the post detail
   dialog) — needs a new `post_notes` table + RLS policy, not in the
   original PRD.

**Explicitly sequenced after bot-ingestion work, per project-owner
decision** — building sources UI / Telegram-Discord-WhatsApp setup once in
the current design system, then reskinning, rather than building it twice.
Logged here rather than silently deferred, per `CLAUDE.md`'s rule. See
`notes/ui-scalability-scope.md` for more on this once it's picked back up.

### What's blocking WhatsApp/Telegram/Discord going fully live

1. **Telegram specifically:** `setWebhook` hasn't been called against a real deployed URL yet — the route works (verified against a local dev server), it's just not registered with Telegram. Sources UI can connect a group to a board today, but nothing arrives until this is done.
2. **WhatsApp specifically:** worker isn't deployed anywhere yet (Railway/Fly.io) — currently only runnable locally, and stopped when not in active use (see `CLAUDE.md`'s Local Dev Hygiene section).
3. **Discord specifically:** worker built (`worker/src/discord.ts`) but never run against a real bot/server — needs a real `DISCORD_BOT_TOKEN`, Message Content Intent enabled in the Discord Developer Portal, and (like WhatsApp) isn't deployed anywhere yet.

### What's blocking the rest of Phase 1

1. Cross-board search + platform/date filters (current search is per-board, caption/author only — see build-order.md item 9), remaining manual-add paths (extension/share-sheet/bulk-import), deleted/unavailable-post handling.
2. Real UI polish against `docs/ui-mockup.html` beyond the sidebar/card-treatment/logo/transitions/hero passes done so far — tag chip list in the sidebar, topbar search, empty states, dark mode toggle.

### Resolved

- **Duplicate-board bug** (2026-08-20) — confirmed fixed via a real user screenshot: `CreateBoardForm`'s pending-state guard is holding, board list shows exactly one board per name now.
- **Google OAuth click-through** (2026-08-20) — a real human completed the actual consent screen → callback → landed back signed in. `handle_new_user` fired correctly against real data.
- PRD §14 #3 (nesting depth) and #4 (permission roles) confirmed 2026-08-19 — both match what's already in `0001_init.sql`, no schema change needed. #1 (naming) deliberately deferred — doesn't block any code.

### Known non-blocking issues

- `npm audit` reports 3 high-severity advisories in the main app, all transitive through Next.js's bundled `postcss`/`sharp`, only fixable via a Next 15 → 16 major bump. Not urgent at this size/stage; revisit before any public deploy.
- `worker/` separately reports 1 high-severity advisory (libvips CVEs via `sharp`, itself transitive through `baileys`) — pre-existing, not introduced by the Discord worker build. `npm audit fix` doesn't resolve it without a breaking change. Same "not urgent yet, revisit before public deploy" status as the main app's.

### Recently completed

- 2026-08-19 — Repo made real: git init, GitHub remote connected, full gate verified, Vitest + CI added, skills.sh packages installed, core docs created.
- 2026-08-19 — Dev tooling installed (gh/Supabase/Vercel CLIs); fixed a real eslint bug (`next-env.d.ts` never ignored) found by re-running the gate.
- 2026-08-19 — PRD §14 nesting/permission-role assumptions confirmed.
- 2026-08-19 — Supabase project created, linked, and schema pushed for real. Vercel connected. Google OAuth wired up. Telegram/Discord bot tokens obtained and verified.
- 2026-08-19 — WhatsApp ingestion foundation built (embed-provider interface + YouTube provider, URL normalization, worker package, Baileys connection, ingestion pipeline) — reprioritized ahead of Phase 1/2's documented order per explicit request.
- 2026-08-19 — WhatsApp paired live against the dedicated number; fixed a real pairing-timing bug in the process.
- 2026-08-20 — Auth and Boards built (Phase 1 items 3–4). Fixed a real Next.js version mismatch (Supabase's current docs describe `proxy.ts`, this project's installed Next.js still needs `middleware.ts`) and a real shadcn/design-system token mismatch — both caught by actually building and running the gate, not assumed.
- 2026-08-20 — Manual URL add built (Phase 1 item 5, item 6 partial). Verified end-to-end against real infrastructure (disposable test user, real `handle_new_user` trigger fire, real YouTube oEmbed fetch, real insert, real dedup rejection, real cascade cleanup) — the first time any of this had been proven against the live project rather than just typechecked.
- 2026-08-20 — All 7 remaining Phase 1 embed providers built (Phase 1 item 7, all 8 target platforms implemented). Endpoints verified against Meta's own official WordPress plugin source and the community oEmbed provider registry, not from memory.
- 2026-08-20 — Tags built (Phase 1 item 8). Verified end-to-end against the real database, including the exact nested `post_tags(tags(id,name))` PostgREST embedding the board page relies on.
- 2026-08-20 — Search built (Phase 1 item 9, partial). Found and fixed a real schema gap — the original full-text index couldn't be targeted by `supabase-js`'s `.textSearch()`; added `0002_posts_search_vector.sql` (generated column + index) and pushed it to the real project.
- 2026-08-20 — First real human sign-in confirmed. Surfaced two real UX bugs: duplicate boards (no pending-state guard on Create) and invisible navigation (no persistent sidebar, easy-to-miss "Open" link). Fixed both. Investigated a reported "delete doesn't work" bug and confirmed it's **not a code bug** — verified end-to-end as a real RLS-scoped signed-in user (not the service-role client every earlier test used, which bypasses RLS and would have masked exactly this class of bug).
- 2026-08-20 — Auto-merge on green CI set up (branch protection + `gh pr merge --auto --squash`). Surfaced and closed a real process gap: PR #4 merged while 5 more commits sat on `dev` untracked by any PR — fixed by always opening a PR immediately when a feature lands, not batching.
- 2026-08-20 — Fixed a real embed-rendering bug found from a user screenshot: oEmbed responses ship a `<script>` tag that never executes via `dangerouslySetInnerHTML` (a browser behavior, not a framework bug), so Instagram/X/TikTok/Facebook/Threads/Bluesky cards were stuck on the static fallback forever. Fixed generically for every platform via `components/embed-html.tsx`.
- 2026-08-20 — Transition polish (`tailwindcss-animate`, consistent `transition-colors duration-150`) across previously-inconsistent interactive elements, direct response to "it looks like we only care about the backend."
- 2026-08-20 — Bluesky embed provider added (Phase 3, pulled forward) — same oEmbed pattern as the rest, verified against a real post.
- 2026-08-20 — Ingestion pipeline refactored into shared `lib/ingestion/pipeline.ts`, parameterized to take a Supabase client — `worker/src/pipeline.ts` and the new Telegram route now share one implementation instead of two copies drifting apart.
- 2026-08-20 — Telegram webhook built (Phase 2 item 2, partial). Verified end-to-end against a real dev server: correct 401 without the secret, real URL extraction, real YouTube fetch, real insert, idempotency tracked.
- 2026-08-20 — Real platform logos (brand SVG marks, `simple-icons` paths hardcoded rather than added as a runtime dependency).
- 2026-08-20 — Fixed a real Twitter/X embed layout bug: the widget's ~550px default overflowed a masonry column. Added `maxwidth=380` to the oEmbed request plus a CSS safety net covering every provider, not just X.
- 2026-08-20 — Fixed a real squash-merge history divergence: repeatedly branching `dev` → squash-merging to `main` → continuing straight on `dev` eventually produces a genuine merge conflict. Fixed by merging `origin/main` back into `dev` after each squash-merge going forward.
- 2026-08-20 — Hero homepage built (`components/hero.tsx`), replacing the bare placeholder. A 21st.dev community hero component turned out to be paywalled, not just API-key gated — hand-built instead using existing design tokens.
- 2026-08-20 — Investigated browser/computer-use access for real UI testing: no tool available in this session; confirmed Vercel's deployment protection blocks plain fetches against every project URL; configured a Playwright MCP server (browser binary installed, server process confirmed running) but it never bound to this specific session. Concluded this is a session-binding limitation of this environment, not a fixable config issue — continuing with user-provided screenshots, which have already caught every real UI bug this session.
- 2026-08-20 — Duplicate-board bug confirmed fixed via a real user screenshot of the live "Manage boards" page — exactly one board per name now, sidebar navigation and card treatment rendering correctly in production.
- 2026-08-21 — Lazy-loading embeds built (Phase 1 item 6, now done). New `components/lazy-mount.tsx` defers each embed's mount via `IntersectionObserver` (400px rootMargin) instead of rendering every card's oEmbed script immediately — a plain skeleton placeholder shows until a card nears the viewport. Also added native `loading="lazy"` to the static-fallback thumbnail `<img>`. Full lint/typecheck/test/build gate verified clean.
- 2026-08-23 — Connect-a-group modal built: replaced the always-visible connect form with a real 3-step modal (pick platform → instructions + paste ID → confirmed), on a new `components/ui/dialog.tsx` (`@radix-ui/react-dialog`, remapped onto this project's tokens like every other shadcn primitive — the app's first modal). Deliberately drops the mockup's "QR code" step for all three platforms (no real scan-to-join mechanism exists for any of them) — logged as a real future want in `notes/ui-scalability-scope.md`, not built. Also fixed a real bug found via a live screenshot: `lib/embed-providers/youtube.ts` never requested a `maxwidth`, so YouTube embeds rendered at a tiny 200×113 (YouTube's own oEmbed default) regardless of card size — fixed to `maxwidth=500`, matching `x.ts`'s existing pattern; the one already-saved featured YouTube post's cached `embed_html` was refreshed directly against the live DB since the fix doesn't touch rows saved before it. Full gate verified clean.
- 2026-08-22 — Discord Gateway worker built (`worker/src/discord.ts`, Phase 2 item 5, now done): `discord.js` added to the worker workspace, same shared `handleIncomingMessage` pipeline WhatsApp/Telegram use, keyed on channel ID per the sources UI's "Copy Channel ID" guidance. `worker/README.md`/`.env.example`/`package.json` (`dev:discord`/`start:discord` scripts) updated. Not yet tested against a real bot/server — typechecks clean, that's all that's confirmed (see "Testing debt"). Found a pre-existing (not newly introduced) high-severity `npm audit` advisory in `worker/`'s `baileys → sharp` chain while installing — logged in "Known non-blocking issues," not fixed (no non-breaking fix available).
- 2026-08-22 — Featured posts landing-page section built: 5 real, curated public posts (found via web search, verified against each platform's real oEmbed endpoint before saving — not fabricated URLs) saved into a new real `visibility: 'public'` board (slug `featured`) via a one-off service-role script, rendered on the landing page through the exact same `EmbedHtml`/`LazyMount` pipeline every other post uses — proved no separate "trending video" rendering logic is needed. Found and fixed a real bug in the process: `lib/embed-providers/instagram.ts`'s URL matcher rejected the common `instagram.com/username/p/CODE/` link form, only accepting the bare `/p/CODE/` form — fixed, covered by a new `instagram.test.ts`. Full gate verified clean.
- 2026-08-21 — Sources UI built (Phase 2 item 6a, new): `app/boards/[boardId]/sources/` — connect/rename/pause/disconnect a Telegram/Discord/WhatsApp group against a board, with per-platform in-form guidance for finding the raw group/channel ID and a friendly "already connected to a board" message on the `unique(platform, external_group_id)` conflict. Replaces the direct-DB-insert workaround `setup-guide.md` previously documented for both Telegram and WhatsApp (both docs updated to point at the new page). `eslint.config.mjs` also updated to ignore the newly-added design-canvas export under `docs/` (its vendored `support.js`/`_ds_bundle.js` aren't hand-written app code and shouldn't be linted as if they were). Full lint/typecheck/test/build gate verified clean.
