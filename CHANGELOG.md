# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This
project doesn't use semantic version tags yet (no release has shipped) — entries
are dated instead until v1 ships, at which point this switches to versioned
releases.

Every PR that changes behavior, schema, or dependencies gets an entry here in
the same PR — see `CONTRIBUTING.md`.

## [Unreleased]

### Fixed

- `eslint.config.mjs` never ignored `next-env.d.ts` (Next.js's own auto-generated,
  do-not-edit file) — lint only ever passed because the file didn't exist until
  the first `next build` created it. Added it to the ignore list.
- `docs/setup-guide.md` recommended `npm install -g supabase`, which Supabase
  deprecated. Corrected to the devDependency + `npx supabase` approach and
  updated every other doc referencing a bare `supabase` command to match.

### Added

- GitHub CLI (`gh`), Supabase CLI (as a project devDependency), and Vercel CLI
  installed as the local tooling `docs/setup-guide.md` calls for.

- Repo made real: git initialized, connected to the GitHub remote, `npm install`
  and the full lint/typecheck/build gate verified passing for the first time.
- Vitest unit test runner (`npm run test`), with `lib/utils.test.ts` as the
  reference pattern for future tests.
- GitHub Actions CI (`.github/workflows/ci.yml`) running lint, typecheck, test,
  and build on every PR and every push to `main`.
- Four skills.sh packages: `shadcn`, `supabase`, `supabase-postgres-best-practices`,
  `vercel-react-best-practices`.
- `docs/build-order.md` — granular, checkable expansion of PRD §13's phasing.
- `docs/progress.md` — living status doc for current project state.
- `docs/testing.md` — testing strategy (unit, endpoint, acceptance-criteria UI,
  staging via Vercel previews).
- `swe.md` (gitignored, local-only) — running notes on SWE fundamentals as
  they're applied in this project.

### Scaffold (pre-dates this changelog)

- Next.js 15 + TypeScript + Tailwind + shadcn/ui project scaffold.
- Supabase client helpers (browser + server + service-role).
- Initial database schema (`supabase/migrations/0001_init.sql`).
- `docs/PRD.md`, `docs/database-schema.md`, `docs/design-system.md`,
  `docs/setup-guide.md`, `docs/ui-mockup.html`.
- `CLAUDE.md`, `CONTRIBUTING.md`.
- Project skills: `add-embed-provider`, `add-ingestion-source`.
