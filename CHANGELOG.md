# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This
project doesn't use semantic version tags yet (no release has shipped) — entries
are dated instead until v1 ships, at which point this switches to versioned
releases.

Every PR that changes behavior, schema, or dependencies gets an entry here in
the same PR — see `CONTRIBUTING.md`.

## [Unreleased]

### Added

- Manual URL add: `/boards/[boardId]` (add-post form, post cards, a basic
  CSS-columns masonry grid), `addPost` server action (normalize → dedup →
  provider fetch → insert). Verified end-to-end against real infrastructure
  (disposable test user, real oEmbed fetch, real dedup rejection) — see
  `docs/progress.md`.
- Auth: `/login` (Google sign-in), `/auth/callback`, `/auth/sign-out`, and
  `middleware.ts` to refresh the Supabase session on every request.
- Boards: `/boards` page (list + create), server actions for create/rename/
  delete, slug generation with collision retry (`lib/slugify.ts`, tested).
- shadcn primitives: button, input, label, card — remapped from shadcn's
  default token names onto this project's actual custom token set.
- WhatsApp paired live against a real dedicated number and verified working.
- Embed-provider interface (`lib/embed-providers/types.ts`) and its first
  implementation, YouTube (via oEmbed).
- URL normalization + dedup-hashing (`lib/normalize-url.ts`), unit tested.
- WhatsApp ingestion foundation: `worker/` converted to an npm workspace
  package sharing `lib/` with the Next.js app; Baileys connection with
  pairing-code auth and session persistence (`worker/src/whatsapp.ts`); the
  shared ingestion pipeline (`worker/src/pipeline.ts`) implementing the
  `ingestion_events` → blocklist → dedup → embed-fetch → `posts` shape from
  the `add-ingestion-source` skill. Reprioritized ahead of the documented
  Phase 2 sequencing per explicit request — see `docs/PRD.md` §13.
- Real Supabase project linked and `0001_init.sql` pushed. Vercel project
  connected. Google OAuth wired into Supabase Auth. Telegram/Discord bot
  tokens obtained and verified live.
- PRD §14 nesting and permission-role assumptions confirmed by the project
  owner.

### Fixed

- `worker/src/whatsapp.ts` requested a Baileys pairing code on the first
  `connection.update` event instead of waiting for `update.qr` — the
  underlying websocket wasn't open yet, causing a 428 "Precondition
  Required" error. Fixed per Baileys' own reference pattern; verified
  against a real paired session afterward.
- Built auth's session-refresh file per Supabase's current docs, which
  describe a `proxy.ts`/`export function proxy()` convention — this
  project's installed Next.js (15.5.23, stable) doesn't support that yet
  (confirmed empirically: no middleware artifact in the build output).
  Used the traditional `middleware.ts`/`export function middleware()`
  convention instead.
- The four shadcn primitives pulled from the registry used shadcn's
  *default* token names (`bg-primary`, `bg-card`, `border-input`, etc.),
  none of which exist in this project's actual custom token set. Remapped
  all four to the real tokens instead of leaving them unstyled or
  introducing a second, competing color system.
- `eslint.config.mjs` never ignored `next-env.d.ts` (Next.js's own auto-generated,
  do-not-edit file) — lint only ever passed because the file didn't exist until
  the first `next build` created it. Added it to the ignore list. Also added
  `worker/**` to the ignore list — the Next.js/React ESLint rule set was
  incorrectly flagging a Baileys function (`useMultiFileAuthState`) as a
  malformed React Hook by name alone.
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
