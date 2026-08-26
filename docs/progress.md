# Progress

Current state of the project, in plain terms. Update this whenever a build-order
item lands or a decision gets made — this is the "what's true right now" doc;
`build-order.md` is the plan, `CHANGELOG.md` is the history.

## Status: Phase 1 nearly complete, human-verified in production

**Last updated:** 2026-08-25

**Phase completion:** Phase 0: 17/17. Phase 1: 8 done, 1 partial, 2 not started (of 11). Phase 2: 5 done (1 partial), 2 not started (of 8). Phase 3: 1 done (of 4). Phase 4: 0/4. See `build-order.md` for the itemized list.

### What's working right now

- Full core loop: sign in with Google → create a board → paste a URL from any of 8 platforms → real embed renders → tag it → search for it. All verified against real infrastructure at some point this session, not just typechecked.
- **Auth**: `/login`, `/auth/callback`, `/auth/sign-out`, `middleware.ts` session refresh. A real human has completed the actual Google consent screen and landed back signed in — `handle_new_user` fired correctly against real data. This was the one gap no disposable-test-user script could close, and it's closed.
- **Boards**: create/rename/delete, persistent sidebar navigation (`app/boards/layout.tsx`) listing every board with active-state highlighting on every `/boards/*` page, `/boards` as a "manage boards" page. **Confirmed working via a real user screenshot** in production, not just my own testing.
- **Manual URL add**: `/boards/[boardId]`, all 9 embed providers (YouTube, Instagram, X, TikTok, Reddit, Pinterest, Facebook, Threads, Bluesky), tags (add/remove/filter), full-text search (caption/author, per-board), a basic CSS-columns masonry grid.
- **Real platform logos** (brand SVG marks, not text initials) and **real oEmbed script hydration** — Instagram/X/TikTok/Facebook/Threads/Bluesky embeds actually render as rich widgets now, not stuck on the static fallback (see Recently Completed for the root cause).
- **Hero homepage** for unauthenticated visitors, replacing the old bare placeholder. Now followed by a **Featured posts** section (`components/featured-posts.tsx`) — 5 real, curated public posts across YouTube/X/Instagram/Pinterest/TikTok, saved into a real `visibility: 'public'` board (slug `featured`) through the normal pipeline, readable by signed-out visitors under the existing RLS policy.
- **Sources UI** (`app/boards/[boardId]/sources/`): connect/rename/pause/disconnect a Telegram/Discord/WhatsApp group against a board, linked from the board page header ("Connected groups →"). Connecting is now a real 3-step modal (pick platform → instructions + paste ID → confirmed), built on a new `components/ui/dialog.tsx` — the app's first modal primitive. Replaces the direct-DB-insert workaround. v1 still requires pasting the platform's raw group/channel ID by hand — no in-app discovery mechanism yet, tracked as [GitHub issue #20](https://github.com/mabdulba1702dev/Social-media-aggregator/issues/20) (see also `notes/ui-scalability-scope.md` for the "detected but unconnected" staging-table idea this would need) — and deliberately has no QR/scan-to-join step (logged as a real future want, not built yet).
- **Discord: real end-to-end ingestion confirmed working, 2026-08-25.** A real link posted in a real Discord channel (`1539664950438658229`) actually produced a real `posts` row (a YouTube link, `ingestion_events.status = 'processed'`) on the `Featured` board. This is the first fully-proven ingestion path of the three. Note: that channel is connected to the `Featured` board (the curated-landing-page board), not a personal board — mixing live ingestion into that board is a hygiene question worth deciding on later, not fixed now. Separately, an earlier test connection (`Testing Server`, channel `1539664949444354070`, on a `Browser Test` board) was left in `status: 'paused'` from a Pause/Resume UI test and never resumed — needs a manual Resume click if that connection should go live too.
- **WhatsApp: connected but end-to-end still unconfirmed, 2026-08-25.** The dedicated number's group list was read directly (`sock.groupFetchAllParticipating()`, a one-off script — see "WhatsApp incident" below) to find a real group (`120363409869163866@g.us`, "Testing") without needing a test message first; that JID is now connected to a board (`status: 'active'`). Zero `ingestion_events` rows exist for it yet — no message has been confirmed to actually flow through this source.
- **Telegram: still not connected to any board.** Webhook is live and registered against production. Unlike WhatsApp, there's no way to list a Telegram bot's existing chats (no admin API for it), and unlike after the pipeline logging fix, there's no way to check *production's* logs for the unmatched-source line without a `vercel login` (not authenticated this session) — so a real chat ID still hasn't been obtained. Next session: either log into the Vercel CLI to check, or query `ingestion_events`/check the DB after a message is posted (the DB approach doesn't need any log access at all).
- **Real bug found, 2026-08-25: `sources.last_event_at` is never updated by the pipeline.** Confirmed via the DB: the Discord source above successfully processed a real message (`ingestion_events.status = 'processed'`, a real post created), but its `sources.last_event_at` is still `null`. This is why the sources UI always shows "no links yet" even after a real successful ingestion — not a UI bug, a real gap in `lib/ingestion/pipeline.ts`, which never writes back to the `sources` table at all after a successful match. Not fixed yet — logged here so it doesn't get lost.
- **Backlog, explicitly deferred:** ingested posts (Discord/Telegram/WhatsApp-sourced) should show which platform/source they came in through on the post card itself (e.g. a small "via Discord" tag) — `posts.source_type` already carries this data, just isn't surfaced in the UI. Not urgent, noted for later per explicit request.
- **Infra**: real Supabase project (linked, both migrations pushed), Vercel connected (auto-deploys previews per PR and production on merge to `main`), auto-merge on green CI (branch protection requires the CI check; PRs merge themselves once green), npm workspaces monorepo (`worker/` shares `lib/` with the Next.js app).

### Testing debt

Most of what was deferred on 2026-08-22 got real browser verification on 2026-08-23, and Discord got a full real end-to-end ingestion proof on 2026-08-25 (see "Recently completed" / "What's working"). What's actually left:

- **WhatsApp end-to-end** — source connected (real JID), worker confirmed live and re-paired after the 2026-08-25 incident, but no message has actually been posted through it and confirmed via `ingestion_events` yet. Next step, not done: post a real link in the "Testing" WhatsApp group, then check the DB.
- **Telegram, entirely** — no source connected yet at all (see "What's working" for why — no chat ID obtained yet).
- **`sources.last_event_at` fix** — real bug confirmed 2026-08-25 (see "What's working"), not fixed yet.
- **Featured posts landing section on mobile / dark mode** — desktop layout confirmed via real screenshot 2026-08-23, mobile wrap and dark mode still unverified.
- **Sources UI's Disconnect button** — uses a native `confirm()` dialog, which the browser extension is instructed to avoid triggering (can hang the automation session) — needs a human click, not browser automation.
- **Post-card source-platform tag** — deferred backlog item, see "What's working."

See `docs/testing.md` for how UI verification normally happens here (acceptance criteria + a human checking the Vercel preview).

### Browser access — solved 2026-08-23

The Playwright MCP server never bound in any session (confirmed multiple times). What actually worked: the **Claude in Chrome** browser extension (`chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn`) — a separate, official mechanism, not related to the Playwright MCP config in `.mcp.json` (which can be considered dead/irrelevant now). It controls the user's actual Chrome browser (real login state, real cookies), connected via `@browser` mentions in the Claude Code panel.

**Real constraint worth knowing, not a bug:** the extension explicitly refuses to act on `accounts.google.com` ("Permission denied for this action on this domain") — a deliberate safety guardrail. This confirms the plan from the disposable-test-session note below was the right instinct (don't automate Google's login screen) — in practice, the workflow that emerged is simpler: the human completes Google sign-in manually once per browser session, then hands control back for everything after that. First real use of this (2026-08-23) verified the lazy-mount hydration fix, the YouTube sizing fix, and the entire connect-a-group modal end-to-end — see "Recently completed."

The disposable-test-session-via-Supabase-admin-API idea (mint a session without Google, for pure behavioral/DB-layer checks with no browser at all) is still a valid complementary approach for scripted checks — just no longer the *only* option for anything visual. Not built yet; still worth doing for fast headless checks that don't need eyes on a page.

### Incident: WhatsApp session logout during testing, 2026-08-25 (caused by me, recovered)

Restarting the local WhatsApp worker used `TaskStop` on the harness-tracked background task, which does **not** actually kill the underlying Windows process tree (`npm run start` → `tsx` → `node`, at least three processes deep) — confirmed via `Get-CimInstance Win32_Process`, which found the "stopped" worker still running. Starting a second instance while the first was still alive made WhatsApp's servers see two simultaneous connections for the same paired device, which repeatedly kicked both with `conflict: replaced`, and eventually fully invalidated the session server-side (`statusCode 401`, `shouldReconnect: false` — a real logout, not a flaky reconnect).

**Recovery:** cleared the stale `worker/whatsapp-session/` files (stale creds made Baileys try to resume a dead session instead of requesting a fresh pairing challenge), got explicit go-ahead before deleting, re-ran the worker, got a real pairing code, human re-entered it on the dedicated number's phone, confirmed stable (`"WhatsApp connection open"`, no further conflicts).

**Process fix applied going forward:** always verify a process is actually dead via `Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object CommandLine -like '*social-embed-app*'` (matching on the real command line, not just the harness's task ID) before starting a replacement — used successfully for the rest of the session, including a clean shutdown of both workers at session end. **Never run two instances of the WhatsApp worker at once** — this is the concrete, first-hand reason why, not just a theoretical warning.

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

**Bot-ingestion work is now far enough along (2026-08-25) that this is
being picked back up** — tracked as [GitHub issue #28](https://github.com/mabdulba1702dev/Social-media-aggregator/issues/28).
The mockup was updated again in the meantime (substantial `Pinboard.dc.html`
rewrite — grid/list feed-view toggle, richer per-post comment threads,
unread counts per source) — scope still needs a real decision pass before
writing any reskin code, per #28.

### GitHub issues filed 2026-08-25 — the real fix for issue #20, split by platform

Manually working around #20's raw-ID-discovery problem three times this
session (WhatsApp's direct group listing, DB queries standing in for logs,
the pipeline logging fix) made the shape of an actual fix clear enough to
scope for real, split per-platform since each has a genuinely different
mechanism available:

- [#25](https://github.com/mabdulba1702dev/Social-media-aggregator/issues/25) — **Discord**: OAuth redirect flow (Discord's own consent screen lets the user pick a server, no copy-pasting an ID). Open question flagged in the issue: OAuth gives a guild ID, not a channel ID — needs a decision (channel picker after redirect, vs. changing ingestion to guild-level) before building.
- [#26](https://github.com/mabdulba1702dev/Social-media-aggregator/issues/26) — **Telegram**: deep link (`t.me/bot?startgroup=<token>`) — Telegram's own native "pick a group" UI, then the bot receives `/start <token>` automatically via the existing webhook. Simplest of the three to build (no OAuth app registration needed).
- [#27](https://github.com/mabdulba1702dev/Social-media-aggregator/issues/27) — **WhatsApp**: no OAuth/deep-link mechanism exists for this (regular phone number, not a bot platform) — scoped down to UX polish (a real QR/contact card) plus turning this session's `groupFetchAllParticipating()` discovery trick into a real feature instead of a one-off script.
- [#29](https://github.com/mabdulba1702dev/Social-media-aggregator/issues/29) — **Scaling/SWE pass**: worker deployment, per-provider rate limiting, queue decision, RLS cost — the thinking-through items from `swe.md`/`notes/ui-scalability-scope.md`, now made visible outside personal notes since they affect real infra decisions.

None of #25–29 are built yet — filed for planning, per explicit request to note things down before building.

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
- 2026-08-25 — Real bot-ingestion testing session: **Discord proven end-to-end for the first time** (real posted link → real `posts` row, confirmed via direct DB query, not just "Gateway connected"). WhatsApp connected (real JID found directly via `groupFetchAllParticipating()` rather than waiting on a test message) but not yet proven end-to-end. Telegram still has no connected source — no chat ID obtained (no Vercel log access this session, and nobody's posted a message yet to check the DB against). Found and logged (not yet fixed) a real bug: `sources.last_event_at` never gets written by the pipeline, so the sources UI always shows "no links yet" regardless of actual activity. Also caused and fully recovered from a real WhatsApp session logout (see "Incident" above) — root cause was `TaskStop` not actually killing background processes on Windows, leading to two simultaneous WhatsApp connections; fixed by verifying process death via `Get-CimInstance` going forward, not trusting the task-stop confirmation alone. Fixed a documentation/guidance error found in the process: `setup-guide.md` and earlier chat guidance both claimed "check the worker's logs for an unmatched group" already worked — it didn't (see the pipeline-logging PR from earlier the same day) until that session's fix landed. GitHub issue #20 (raw-ID-discovery UX) remains open and unresolved — this session's manual workarounds (direct WhatsApp group listing, DB queries in place of logs) are concrete evidence for *why* it needs a real fix, not a substitute for one. Both local workers stopped cleanly at session end per `CLAUDE.md`'s dev-hygiene rule.
- 2026-08-23 — First real browser-driven verification pass (Claude in Chrome, see "Browser access — solved" above), against the real deployed app, signed in as a real user:
  - Confirmed the lazy-mount hydration fix and YouTube sizing fix both actually work in production — Instagram/X hydrate into real widgets, YouTube renders at proper size, TikTok renders correctly.
  - Confirmed the connect-a-group modal end-to-end: platform picker → instructions/ID form → success, step-progress dots, Back button, `router.refresh()` updating the list on close all work. Confirmed the duplicate-connection error path shows inline with input preserved. Confirmed Pause/Resume and the rename-inline-edit UI.
  - **Connected a real Discord channel** (`1539664949444354070`) to a real new "Browser Test" board — not a throwaway test, a live connection.
  - Confirmed board creation has no duplicate-submit regression.
  - Started both workers locally (`npm run start`, `npm run start:discord`) and confirmed both actually connect for real (`"WhatsApp connection open"`, `"Discord Gateway connected"`) — ready for a real posted-link test.
- 2026-08-23 — Fixed a real lazy-mount hydration bug found from a live screenshot of the "test" board: X and Instagram embeds stayed un-hydrated (raw blockquote text, no widget) whenever a card mounted after that platform's widget script was already loaded from an earlier card — the scripts guard against re-initializing, so `embed-html.tsx`'s script-tag-reinsertion trick alone silently no-ops the second time. Now also calls each platform's documented on-demand re-scan API (`twttr.widgets.load()`/`instgrm.Embeds.process()`/`FB.XFBML.parse()`). Also bulk-refreshed every already-saved YouTube post's cached `embed_html` still at the old tiny size (not just the one instance noticed earlier). Filed [GitHub issue #20](https://github.com/mabdulba1702dev/Social-media-aggregator/issues/20) for the sources-UI raw-ID-discovery UX problem per explicit request to log-and-defer rather than fix now. Full gate verified clean.
- 2026-08-23 — Connect-a-group modal built: replaced the always-visible connect form with a real 3-step modal (pick platform → instructions + paste ID → confirmed), on a new `components/ui/dialog.tsx` (`@radix-ui/react-dialog`, remapped onto this project's tokens like every other shadcn primitive — the app's first modal). Deliberately drops the mockup's "QR code" step for all three platforms (no real scan-to-join mechanism exists for any of them) — logged as a real future want in `notes/ui-scalability-scope.md`, not built. Also fixed a real bug found via a live screenshot: `lib/embed-providers/youtube.ts` never requested a `maxwidth`, so YouTube embeds rendered at a tiny 200×113 (YouTube's own oEmbed default) regardless of card size — fixed to `maxwidth=500`, matching `x.ts`'s existing pattern; the one already-saved featured YouTube post's cached `embed_html` was refreshed directly against the live DB since the fix doesn't touch rows saved before it. Full gate verified clean.
- 2026-08-22 — Discord Gateway worker built (`worker/src/discord.ts`, Phase 2 item 5, now done): `discord.js` added to the worker workspace, same shared `handleIncomingMessage` pipeline WhatsApp/Telegram use, keyed on channel ID per the sources UI's "Copy Channel ID" guidance. `worker/README.md`/`.env.example`/`package.json` (`dev:discord`/`start:discord` scripts) updated. Not yet tested against a real bot/server — typechecks clean, that's all that's confirmed (see "Testing debt"). Found a pre-existing (not newly introduced) high-severity `npm audit` advisory in `worker/`'s `baileys → sharp` chain while installing — logged in "Known non-blocking issues," not fixed (no non-breaking fix available).
- 2026-08-22 — Featured posts landing-page section built: 5 real, curated public posts (found via web search, verified against each platform's real oEmbed endpoint before saving — not fabricated URLs) saved into a new real `visibility: 'public'` board (slug `featured`) via a one-off service-role script, rendered on the landing page through the exact same `EmbedHtml`/`LazyMount` pipeline every other post uses — proved no separate "trending video" rendering logic is needed. Found and fixed a real bug in the process: `lib/embed-providers/instagram.ts`'s URL matcher rejected the common `instagram.com/username/p/CODE/` link form, only accepting the bare `/p/CODE/` form — fixed, covered by a new `instagram.test.ts`. Full gate verified clean.
- 2026-08-21 — Sources UI built (Phase 2 item 6a, new): `app/boards/[boardId]/sources/` — connect/rename/pause/disconnect a Telegram/Discord/WhatsApp group against a board, with per-platform in-form guidance for finding the raw group/channel ID and a friendly "already connected to a board" message on the `unique(platform, external_group_id)` conflict. Replaces the direct-DB-insert workaround `setup-guide.md` previously documented for both Telegram and WhatsApp (both docs updated to point at the new page). `eslint.config.mjs` also updated to ignore the newly-added design-canvas export under `docs/` (its vendored `support.js`/`_ds_bundle.js` aren't hand-written app code and shouldn't be linted as if they were). Full lint/typecheck/test/build gate verified clean.
