# Social Post Boards

Bookmark social media posts as live embeds — not screenshots — organized into boards you can browse, tag, and share. Boards can also auto-ingest links posted in a connected Telegram/Discord/WhatsApp group.

## Status

Pre-Phase-1. Schema, design system, and product spec are done (`docs/`); feature implementation hasn't started yet.

## Docs

- [`docs/PRD.md`](docs/PRD.md) — full product spec, platform/cost matrix, architecture, roadmap.
- [`docs/database-schema.md`](docs/database-schema.md) — annotated schema (SQL in `supabase/migrations/0001_init.sql`).
- [`docs/design-system.md`](docs/design-system.md) — color/type/spacing tokens, component inventory.
- [`docs/setup-guide.md`](docs/setup-guide.md) — every account and key needed, step by step.
- [`CLAUDE.md`](CLAUDE.md) — instructions for AI-assisted development in this repo.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — local setup, branching, PR checklist.

## Quick Start

```bash
npm install
cp .env.example .env.local   # fill in values per docs/setup-guide.md
npm run dev
```

## Repo Layout

- `app/`, `components/`, `lib/` — the Next.js app (Vercel).
- `supabase/` — database schema + migrations.
- `worker/` — the separate always-on process for Discord + WhatsApp ingestion (Railway/Fly.io, not Vercel — see `worker/README.md`).
- `docs/` — everything above.
- `.claude/skills/` — project-specific build recipes for adding platforms/ingestion sources.

## Stack

Next.js 15 (App Router) + TypeScript · Supabase (Postgres/Auth/Storage/Realtime) · Tailwind + shadcn/ui · deployed on Vercel. Ingestion worker (Discord Gateway + WhatsApp/Baileys): separate Node process on Railway/Fly.io.
