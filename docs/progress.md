# Progress

Current state of the project, in plain terms. Update this whenever a build-order
item lands or a decision gets made — this is the "what's true right now" doc;
`build-order.md` is the plan, `CHANGELOG.md` is the history.

## Status: Phase 1 core loop verified end-to-end (sign in → board → save a real post)

**Last updated:** 2026-08-20

### What's working right now

- Next.js 15 scaffold boots, `npm run lint` / `typecheck` / `test` / `build` all pass clean, in an npm-workspaces monorepo (`worker/` is now a workspace package).
- Git repo connected to [mabdulba1702dev/Social-media-aggregator](https://github.com/mabdulba1702dev/Social-media-aggregator), CI green on every open PR.
- Real Supabase project created, linked, and `0001_init.sql` pushed — verified via `supabase migration list` (local and remote both show `0001`).
- Vercel project connected to the repo.
- Google OAuth credentials created and wired into Supabase Auth's Google provider.
- Telegram and Discord bot tokens obtained and verified live against each platform's API; Discord bot is in a test server; Telegram bot's privacy mode is disabled (required for it to see plain-text URLs, not just commands).
- PRD §14 assumptions #3 (nesting) and #4 (permission roles) confirmed by the project owner — both already matched the schema.
- Embed-provider interface + first provider (YouTube, via oEmbed) built and tested.
- URL normalization / dedup-hashing logic built and tested (10 passing tests).
- WhatsApp ingestion foundation built: Baileys connection + pairing-code auth + session persistence (`worker/src/whatsapp.ts`), and the shared ingestion pipeline (`worker/src/pipeline.ts`) implementing the full `ingestion_events` → blocklist → dedup → embed-fetch → `posts` shape from the `add-ingestion-source` skill.
- **WhatsApp paired and verified live** (2026-08-19) against the dedicated number — found and fixed a real timing bug in the process (pairing code was requested before the socket's `qr` event fired, causing a 428 "Precondition Required" error; fixed by gating the request on `update.qr` per Baileys' own reference pattern instead of the first `connection.update`). Confirmed working: connection opened, app-state sync completed, history sync received. Worker stopped afterward, per the new local-dev-hygiene rule in `CLAUDE.md` — no reason to hold a live session open with nothing to ingest into yet.
- **Auth built**: `/login` (Google sign-in), `/auth/callback` (`exchangeCodeForSession`), `/auth/sign-out`, `middleware.ts` refreshing the session on every request. Found and fixed a real gap while building this: the Supabase reference docs currently describe a `proxy.ts`/`export function proxy()` convention that this project's installed Next.js (15.5.23, stable) doesn't actually support yet — confirmed empirically (no middleware artifact in the build output under that name) and used the traditional `middleware.ts`/`export function middleware()` convention instead, which does produce a compiled `ƒ Middleware` entry. Smoke-tested via dev server: `/`, `/login`, `/auth/error` all 200; `/auth/callback` with no code correctly 307s to `/auth/error`. Full OAuth completion (the actual Google consent screen) hasn't been clicked through — no browser available in this environment to do that.
- **Boards built**: `/boards` page (list + create form), server actions for create/rename/delete (`app/boards/actions.ts`), slug generation with collision retry (`lib/slugify.ts`, unit tested). Owner's `board_members` row is inserted alongside the board per the schema's uniform-permission-check design. Smoke-tested: `/boards` correctly 307s to `/login` when signed out.
- **shadcn primitives pulled** (button, input, label, card) — found and fixed a real mismatch: the pulled components used shadcn's *default* token names (`bg-primary`, `bg-card`, `border-input`, etc.), none of which exist in this project's actual custom token set (`tailwind.config.ts`/`design-system.md`) — would have rendered essentially unstyled. Remapped all four components to the project's real tokens instead of introducing a second, competing color system.
- **Manual URL add built and verified end-to-end against real infrastructure**: `/boards/[boardId]` (add-post form, post cards, a basic CSS-columns masonry grid), `app/boards/[boardId]/actions.ts`'s `addPost` (normalize → dedup check → provider fetch → insert). Verified for real, not just typechecked: created a disposable test user via the Supabase admin API, confirmed the `handle_new_user` trigger actually fires and creates a `profiles` row (this had never been observed before — closes a known gap), created a board, ran the exact `lib/embed-providers` + `lib/normalize-url` code against a real YouTube URL, got back a real oEmbed response (title, author, thumbnail, embed HTML), inserted the post, confirmed the `unique(board_id, url_hash)` constraint correctly rejects a duplicate insert, then deleted the test user and confirmed the cascade correctly removed the profile/board/post. Cleaned up completely — the real project tables are empty again.
- Platform badge component (`components/platform-badge.tsx`) — literal per-platform Tailwind classes (not template-built) so the content scanner picks them up.

### Reprioritization note

WhatsApp was pulled forward ahead of the documented Phase 2 sequencing per
explicit project-owner request — logged in `docs/PRD.md` §13 and
`docs/build-order.md` rather than done silently, per `CLAUDE.md`'s rule.
Telegram/Discord bot-listener code is unaffected and stays in its original
Phase 2 slot.

### What's blocking WhatsApp going fully live

1. No real `sources` row exists yet linking a WhatsApp group to a board — auth + boards exist now, so this just needs an actual board created by a signed-in user, then a `sources` row inserted (no UI for that yet — direct insert for now).
2. Worker isn't deployed anywhere yet (Railway/Fly.io) — currently only runnable locally, and stopped when not in active use (see `CLAUDE.md`'s Local Dev Hygiene section).

### What's blocking the rest of Phase 1

1. Lazy-loading embeds as they scroll into view — the masonry grid exists but renders every embed immediately.
2. Search, remaining manual-add paths (extension/share-sheet/bulk-import), deleted/unavailable-post handling.
3. **Still open**: the actual Google OAuth click-through (consent screen → callback → landing back on the site signed in) has never been done by a human. Everything *around* it is now verified for real — the `handle_new_user` trigger, board creation, post creation, RLS, and now every embed provider — via a disposable test user created through the admin API, not through the OAuth flow itself. This is the one piece only a real browser can close.

### Resolved

- PRD §14 #3 (nesting depth) and #4 (permission roles) confirmed 2026-08-19 — both match what's already in `0001_init.sql`, no schema change needed. #1 (naming) deliberately deferred — doesn't block any code.

### Known non-blocking issues

- `npm audit` reports 3 high-severity advisories, all transitive through Next.js's bundled `postcss`/`sharp`, only fixable via a Next 15 → 16 major bump. Not urgent at this size/stage; revisit before any public deploy.

### Recently completed

- 2026-08-19 — Repo made real: git init, GitHub remote connected, full gate verified, Vitest + CI added, skills.sh packages installed, core docs created.
- 2026-08-19 — Dev tooling installed (gh/Supabase/Vercel CLIs); fixed a real eslint bug (`next-env.d.ts` never ignored) found by re-running the gate.
- 2026-08-19 — PRD §14 nesting/permission-role assumptions confirmed.
- 2026-08-19 — Supabase project created, linked, and schema pushed for real. Vercel connected. Google OAuth wired up. Telegram/Discord bot tokens obtained and verified.
- 2026-08-19 — WhatsApp ingestion foundation built (embed-provider interface + YouTube provider, URL normalization, worker package, Baileys connection, ingestion pipeline) — reprioritized ahead of Phase 1/2's documented order per explicit request.
- 2026-08-19 — WhatsApp paired live against the dedicated number; fixed a real pairing-timing bug in the process.
- 2026-08-20 — Auth (`/login`, `/auth/callback`, `/auth/sign-out`, `middleware.ts`) and Boards (`/boards`, create/rename/delete server actions) built — Phase 1 items 3–4. Fixed a real Next.js version mismatch (Supabase's current docs describe `proxy.ts`, this project's installed Next.js still needs `middleware.ts`) and a real shadcn/design-system token mismatch (pulled components used shadcn's default token names, none of which exist in this project's custom token set) — both caught by actually building and running the gate, not assumed.
- 2026-08-20 — Manual URL add built (`/boards/[boardId]`, post cards, basic masonry grid, `addPost` server action) — Phase 1 item 5, item 6 partial. Verified the entire loop end-to-end against real infrastructure (disposable test user, real `handle_new_user` trigger fire, real YouTube oEmbed fetch, real insert, real dedup rejection, real cascade cleanup) — the first time any of this has been proven against the live project rather than just typechecked.
- 2026-08-20 — All 7 remaining Phase 1 embed providers built (Instagram, X, TikTok, Reddit, Pinterest, Facebook, Threads) — Phase 1 item 7, all 8 target platforms now implemented. Extracted `oembed-fetch.ts`'s shared `fetchStandardOEmbed()` rather than repeating the same fetch/error-handling shape 7 times. Endpoints verified against Meta's own official WordPress plugin source and the community oEmbed provider registry (`iamcal/oembed`), not from memory — this mattered specifically because PRD §8 already flagged Meta's oEmbed policy as having changed recently. Live-tested against real posts; 5 of 7 confirmed fully working end-to-end, Instagram/Threads test URLs turned out stale (but got back a real, correctly-shaped Meta API error, confirming the endpoint itself is right), Reddit hit transient sandbox network flakiness after one earlier successful direct test.
- 2026-08-20 — Tags built (Phase 1 item 8): inline add/remove per post, filter bar on the board page. Verified end-to-end against the real database, including the exact nested `post_tags(tags(id,name))` PostgREST embedding the board page relies on.
