# Progress

Current state of the project, in plain terms. Update this whenever a build-order
item lands or a decision gets made — this is the "what's true right now" doc;
`build-order.md` is the plan, `CHANGELOG.md` is the history.

## Status: Phase 0 done, Phase 1/2 work started (WhatsApp reprioritized)

**Last updated:** 2026-08-19

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

### Reprioritization note

WhatsApp was pulled forward ahead of the documented Phase 2 sequencing per
explicit project-owner request — logged in `docs/PRD.md` §13 and
`docs/build-order.md` rather than done silently, per `CLAUDE.md`'s rule.
Telegram/Discord bot-listener code is unaffected and stays in its original
Phase 2 slot.

### What's blocking WhatsApp going fully live

1. No dedicated non-primary phone number paired yet — required before Baileys can connect to anything (`docs/setup-guide.md` §6).
2. No real `board`/`sources` row exists yet to ingest into — needs at minimum Phase 1's auth + one board, since `sources.board_id` is a required foreign key. The worker code is correct and tested in isolation, but has nothing to write to yet.
3. Worker isn't deployed anywhere yet (Railway/Fly.io) — currently only runnable locally.

### What's blocking the rest of Phase 1

1. No sign-in UI yet — Google OAuth is wired up server-side but there's no `/login` page or callback route.
2. No boards UI/API yet.
3. `components/ui/` still has no real shadcn primitives pulled in.

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
