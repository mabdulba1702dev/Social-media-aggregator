# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This
project doesn't use semantic version tags yet (no release has shipped) — entries
are dated instead until v1 ships, at which point this switches to versioned
releases.

Every PR that changes behavior, schema, or dependencies gets an entry here in
the same PR — see `CONTRIBUTING.md`.

## [Unreleased]

### Added

- Sources UI (`app/boards/[boardId]/sources/`): connect/rename/pause/
  disconnect a Telegram/Discord/WhatsApp group against a board from a real
  page, replacing the "insert a `sources` row directly" workaround. Shows
  per-platform guidance on finding the raw group/channel ID (no in-app
  discovery mechanism yet — that's still a manual lookup) and surfaces the
  `unique(platform, external_group_id)` conflict as a friendly "already
  connected to a board" message rather than a raw DB error.
- Lazy-mounted embeds (`components/lazy-mount.tsx`): each post card's oEmbed
  `<script>` now only fetches/executes once the card scrolls near the
  viewport (`IntersectionObserver`, 400px rootMargin), instead of every
  embed on a board loading immediately. Shows a skeleton placeholder until
  then; the static-fallback thumbnail also got native `loading="lazy"`.
- Hero homepage (`components/hero.tsx`) for unauthenticated visitors,
  replacing the bare placeholder. Hand-built using existing design
  tokens rather than a pulled 21st.dev template (that one turned out
  to be paywalled, and a generic template would've needed a full
  re-theme to match `design-system.md`'s "not generic SaaS" stance
  anyway).
- Telegram webhook (`app/api/telegram/route.ts`), secret-token verified,
  end-to-end tested against a real dev server. Not yet registered with
  Telegram's `setWebhook` against a deployed URL — see
  `docs/setup-guide.md` §6.
- Real platform logos (brand SVG marks) replacing text-initial badges.
- Bluesky embed provider (Phase 3, pulled forward) — same oEmbed pattern,
  verified against a real post.

### Changed

- Ingestion pipeline moved to shared `lib/ingestion/pipeline.ts`,
  parameterized to take a Supabase client — `worker/src/pipeline.ts` and
  the new Telegram route now share one implementation instead of two.

### Fixed

- Twitter/X embeds overflowed their masonry column (the widget's ~550px
  default is wider than a card). Added `maxwidth=380` to the oEmbed
  request plus a CSS safety net (`globals.css`'s `.embed-body` rules)
  capping any embed's width regardless of platform — covers every
  provider, not just X.
- Instagram/X/TikTok/Facebook/Threads/Bluesky embeds were stuck on the
  static oEmbed fallback forever — `dangerouslySetInnerHTML` never
  executes injected `<script>` tags, and that script is exactly what
  hydrates the placeholder into the real widget. Fixed generically for
  every platform via `components/embed-html.tsx`, which replaces each
  `<script>` node with a freshly-created one after mount.
- Board creation could silently double-submit (no pending/loading state
  meant a double-click fired two inserts) — real duplicate boards were
  found on a live account this way. `CreateBoardForm` now uses
  `useActionState` to disable the form for the whole pending window.
- The "Open" link into a board was a low-contrast ghost-variant button,
  easy to miss entirely, with no way to navigate between boards once
  inside one. Added a persistent sidebar (`app/boards/layout.tsx`)
  listing every board with active-state highlighting on every
  `/boards/*` page.
- Investigated a reported "delete doesn't work" bug: verified end-to-end
  as a real RLS-scoped signed-in user (not the service-role client every
  earlier test used, which bypasses RLS and would have masked exactly
  this class of bug) — delete correctly removes the row. Almost
  certainly the duplicate-boards bug above: deleting one of two
  identically-named boards looks like nothing happened.

### Changed

- Create-board and add-post forms now have real visual weight (card
  treatment, prominent button) instead of bare inputs.
- Added `tailwindcss-animate`; consistent `transition-colors duration-150`
  across sidebar links, tag chips, inputs, and board links, plus a subtle
  fade/slide-in on post cards mounting.

- `posts.search_vector`: replaced the expression-based full-text search
  index from `0001_init.sql` with a generated `tsvector` column + index
  (`0002_posts_search_vector.sql`) — `supabase-js`'s `.textSearch()` needs
  a real column, not an arbitrary indexed expression.

### Added

- Search box on the board page (caption/author, combinable with the tag
  filter), verified against real data.
- Tags: inline add/remove per post, a filter bar on the board page.
  Verified end-to-end against the real database, including the nested
  `post_tags(tags(id,name))` PostgREST embedding the page relies on.
- All 7 remaining embed providers: Instagram, X, TikTok, Reddit, Pinterest,
  Facebook, Threads — all 8 PRD §6.2 target platforms now implemented.
  Endpoints verified against Meta's own official plugin source and the
  community oEmbed provider registry. Shared fetch/error-handling logic
  extracted into `oembed-fetch.ts` rather than repeated per provider.
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
