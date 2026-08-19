# CLAUDE.md

Instructions for Claude Code (or any agent) working in this repo. Read this before making changes.

## What This Project Is

A bookmarking app for social media posts: paste a URL and it renders as a live embed (not a screenshot), organized into boards with tags. Boards can also auto-ingest links posted in a connected Telegram/Discord/WhatsApp group. Full spec in `docs/PRD.md` — read it before implementing any feature-level work, not just this file.

**Required reading order for any non-trivial task:** `docs/PRD.md` → `docs/database-schema.md` → `docs/design-system.md` → `docs/setup-guide.md` → `docs/build-order.md` → `docs/progress.md`. Don't guess at scope or schema — it's already decided and documented. Check `docs/progress.md` first if you're unsure what's actually built vs. planned — it's the current-state doc; `build-order.md` is the plan.

## Stack

- Next.js 15 (App Router) + TypeScript, deployed on Vercel.
- Supabase: Postgres + Auth (Google OAuth) + Storage + Realtime.
- Tailwind CSS + shadcn/ui components (sourced from 21st.dev where useful — `docs/setup-guide.md` §7).
- Bot ingestion workers live outside the Next.js app (Telegram runs as a webhook route inside it; Discord and WhatsApp both need a separate always-on process — see `docs/PRD.md` §9.3, do not try to make a Discord Gateway connection or a Baileys WhatsApp session live in a Vercel serverless function).
- WhatsApp ingestion uses **Baileys** (`whiskeysockets/baileys` — install only from the canonical package, see `docs/setup-guide.md` §6 for why) against a dedicated, non-primary phone number. Never point this at anyone's primary number.

## Conventions

- **Strict TypeScript.** `tsconfig.json` has `strict: true` and `noUncheckedIndexedAccess: true` — don't loosen these to make an error go away; fix the underlying type issue.
- **Styling:** Tailwind utility classes only, using the tokens defined in `tailwind.config.ts` / `app/globals.css` (which mirror `docs/design-system.md`). Don't hardcode hex colors in components — extend the token set in both places if a new one is genuinely needed.
- **Supabase access:** use `lib/supabase/client.ts` in client components, `lib/supabase/server.ts`'s `createClient()` in server components/route handlers. Only use `createServiceRoleClient()` from a trusted server context (ingestion webhooks) — it bypasses Row Level Security. Never import it into anything reachable from a user session.
- **Embed providers:** one file per platform under `lib/embed-providers/`, behind a shared interface — see the `add-embed-provider` skill for the exact pattern before adding a new one.
- **Database changes:** every schema change is a new file in `supabase/migrations/`, never a hand-edit of `0001_init.sql`. Update `docs/database-schema.md` in the same PR so the doc never drifts from the actual schema.

## Commands

```bash
npm install          # install deps
npm run dev           # local dev server
npm run lint           # eslint
npm run typecheck      # tsc --noEmit
npm run test            # vitest run
npm run test:watch      # vitest, watch mode
npm run build             # production build (run before opening a PR)
npx supabase db push     # apply pending migrations to the linked project
```

CI (`.github/workflows/ci.yml`) runs `lint` → `typecheck` → `test` → `build` on every PR and every push to `main` — the same four commands, automated. See `docs/testing.md` for the full testing strategy (what's unit-tested, why there's no automated E2E yet, how staging works via Vercel preview deployments).

## Local Dev Hygiene

Stop long-running local processes when they're not actively being used —
don't leave `npm run dev`, `worker/` (`npm run dev` / `npm run start` in
`worker/`, which holds an authenticated Baileys WhatsApp session and/or a
Discord Gateway connection), or any other background dev process idling once
you're done with the thing it was for. This matters more than usual for the
worker specifically: it holds a live, persistent connection tied to a real
WhatsApp account, not just a local port — no reason to keep that connection
open when there's nothing wired up yet for it to actually do anything with
(see `docs/progress.md` for what's currently blocking it from being useful
left running).

## Build Order

Follow `docs/build-order.md` (the granular, checkable expansion of `docs/PRD.md` §13) — don't jump ahead to Phase 2 (bot ingestion) features before Phase 1 (manual add + core embeds + personal boards) is solid. If asked to build something out of that order, flag it rather than silently proceeding. Keep `docs/build-order.md` and `docs/progress.md` in sync with what actually lands — check an item off / add a progress note in the same PR that completes it.

## Skills

Project skills live in `.claude/skills/`:
- `add-embed-provider` — the recipe for wiring up a new platform's embed rendering.
- `add-ingestion-source` — the recipe for wiring up a new bot/group ingestion type.

Use them rather than improvising a different pattern each time a platform gets added — the whole point is that platform #6 looks structurally identical to platform #2.

For *third-party* skills (not specific to this project), use [skills.sh](https://skills.sh) (`npx skills add <owner>/<repo>`) rather than hand-writing something that already exists on the public registry — check there before writing a new project skill for anything generic (framework/library usage patterns rather than this app's own architecture). Already installed for this stack (tracked in `skills-lock.json`, commit that file when it changes): `shadcn/ui`, `supabase`, `supabase-postgres-best-practices`, `vercel-react-best-practices`. Run `npx skills list` to see the current set before assuming a skill doesn't exist yet.

## Other Docs

- `docs/build-order.md` — granular, checkable task list per phase (expands `PRD.md` §13).
- `docs/progress.md` — current state: what's actually built vs. blocked vs. planned. Check this before assuming something is or isn't done.
- `docs/testing.md` — testing strategy and the reasoning behind it (unit scope, no automated E2E yet, staging via Vercel previews, load testing as a targeted exercise not a standing suite).
- `CHANGELOG.md` — dated entries (Keep a Changelog format) for every behavior/schema/dependency change; add an entry in the same PR.
- `swe.md` — gitignored, personal learning notes tying SWE fundamentals to this project's actual decisions (PRD §2's secondary goal). Not team-facing, don't reference it as a source of project requirements.

## Open Items

`docs/PRD.md` §14 has a running assumptions log (naming, permission roles, nesting depth, etc.) — several of these are the project owner's placeholder defaults, not settled decisions. Check that section before treating any of those as fixed requirements.
