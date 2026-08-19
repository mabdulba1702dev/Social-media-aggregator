# Progress

Current state of the project, in plain terms. Update this whenever a build-order
item lands or a decision gets made — this is the "what's true right now" doc;
`build-order.md` is the plan, `CHANGELOG.md` is the history.

## Status: Phase 0 (Setup) — nearly done

**Last updated:** 2026-08-19

### What's working right now

- Next.js 15 scaffold boots, `npm run lint` / `typecheck` / `test` / `build` all pass clean.
- Git repo initialized and connected to [mabdulba1702dev/Social-media-aggregator](https://github.com/mabdulba1702dev/Social-media-aggregator).
- CI running the full gate on every PR via GitHub Actions.
- Vitest wired up; one real test suite (`lib/utils.test.ts`) as the reference pattern.
- Four skills.sh packages installed: `shadcn`, `supabase`, `supabase-postgres-best-practices`, `vercel-react-best-practices` (plus the two hand-written project skills).
- Initial DB schema written (`supabase/migrations/0001_init.sql`) but **not yet applied to a real Supabase project** — no project has been created/linked yet.

### What's blocking Phase 1 start

1. PRD §14 assumptions #1 (naming), #3 (nesting depth), #4 (permission roles) need the project owner's sign-off — the schema already encodes proposed defaults for #3/#4, but they're not confirmed.
2. No real Supabase project exists yet — `supabase db push` has never been run against anything.
3. No Vercel project connected — needed both for real deploys and for preview-deployment-based staging (see `testing.md`).
4. `lib/embed-providers/types.ts` doesn't exist yet — first Phase 1 task, see `build-order.md`.

### Known non-blocking issues

- `npm audit` reports 3 high-severity advisories, all transitive through Next.js's bundled `postcss`/`sharp`, only fixable via a Next 15 → 16 major bump. Not urgent at this size/stage; revisit before any public deploy.

### Recently completed

- 2026-08-19 — Repo made real: git init, GitHub remote connected, `npm install` + full gate verified for the first time, Vitest + CI added, skills.sh packages installed, `build-order.md` / `progress.md` / `testing.md` / `CHANGELOG.md` created.
