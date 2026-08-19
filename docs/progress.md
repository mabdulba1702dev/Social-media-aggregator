# Progress

Current state of the project, in plain terms. Update this whenever a build-order
item lands or a decision gets made — this is the "what's true right now" doc;
`build-order.md` is the plan, `CHANGELOG.md` is the history.

## Status: Phase 1 core loop working (auth + boards), WhatsApp foundation paired

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

1. Manual URL add (paste → normalize → dedup → embed-fetch → insert `post`) doesn't exist yet — next logical piece, and it's what actually exercises the embed-provider + dedup code already built for the worker.
2. Masonry board view — boards exist but have no post-browsing UI yet.
3. Remaining core embed providers (Instagram, X, TikTok, Reddit, Pinterest, Facebook, Threads) — only YouTube exists so far.
4. Full OAuth completion hasn't been verified end-to-end (no browser available here) — the `profiles` auto-creation trigger is written and reviewed but not yet observed firing against a real sign-in.

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
