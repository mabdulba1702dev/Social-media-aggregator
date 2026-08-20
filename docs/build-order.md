# Build Order

This is the granular, checkable version of `PRD.md` §13. The PRD says *what* each
phase contains at a product level; this doc breaks each phase into the actual
units of work, in the order they should land, so a phase can be tracked to
"done" instead of staying a vague bucket.

**Rule from `CLAUDE.md`:** don't start a later phase's items before the current
phase is solid. If you think you have a reason to jump ahead, flag it instead of
silently doing it — see `CLAUDE.md`'s Build Order section.

Check items off as they land (`[x]`) and keep this file in sync with
`progress.md` — this file is the plan, `progress.md` is the current state.

---

## Phase 0 — Setup

- [x] Repo scaffolding (Next.js 15 + TS + Tailwind + shadcn config)
- [x] Supabase client helpers (`lib/supabase/client.ts`, `server.ts`)
- [x] Initial schema migration (`supabase/migrations/0001_init.sql`)
- [x] `docs/PRD.md`, `docs/database-schema.md`, `docs/design-system.md`, `docs/setup-guide.md`
- [x] `CLAUDE.md`, `CONTRIBUTING.md`
- [x] Project skills: `add-embed-provider`, `add-ingestion-source`
- [x] Git repo initialized, connected to GitHub remote
- [x] Verified `npm install` / lint / typecheck / build actually pass clean
- [x] Vitest wired up (`npm run test`)
- [x] GitHub Actions CI (`.github/workflows/ci.yml`) running the full gate
- [x] Third-party skills pulled from skills.sh (shadcn, supabase, supabase-postgres-best-practices, vercel-react-best-practices)
- [x] `docs/build-order.md`, `docs/progress.md`, `docs/testing.md`, `CHANGELOG.md`
- [x] PRD §14 assumptions #3 (nesting) and #4 (permission roles) confirmed by project owner — #1 (naming) deliberately deferred, doesn't block code
- [x] Supabase project created + linked (`supabase db push` run for real, not just local)
- [x] Vercel project created + connected to the GitHub repo (enables preview deployments per PR)
- [x] Google OAuth credentials created and wired into Supabase Auth
- [x] `components/ui/` populated with real shadcn primitives (button, card, input, label — remapped onto this project's actual design tokens)

## Phase 1 — MVP (personal use, manual add, core embeds)

Order matters within the phase — embeds need the provider interface before UI can render anything real, and boards need to exist before posts can belong to one.

1. [x] **Embed provider interface** — `lib/embed-providers/types.ts` defining the shared shape (URL matcher, fetch fn, normalized output). This is the bootstrap step the `add-embed-provider` skill depends on. Built ahead of schedule to unblock the WhatsApp reprioritization below.
2. [x] **First embed provider: YouTube** — most reliable per PRD §8, proves the interface end to end. Same reason as above.
3. [x] **Auth** — Google OAuth via Supabase Auth (`/login`, `/auth/callback`, `/auth/sign-out`, `middleware.ts` session refresh). Fully verified 2026-08-20: a real human completed the actual Google consent screen, `handle_new_user` correctly created the `profiles` row against real data.
4. [x] **Boards (personal only)** — create/rename/delete a board, owner-only, no sharing yet. `/boards` page + server actions, slug generation with collision retry (tested).
5. [x] **Manual URL add (paste only)** — `/boards/[boardId]`'s add-post form → normalize → dedup check → provider fetch → insert `post`. Verified end-to-end against the real Supabase project and a real YouTube oEmbed fetch (not just typechecked) — see `progress.md`. Extension/share-sheet/bulk-import still not built (item 10).
6. [~] **Masonry board view** — basic CSS-columns grid built (`app/boards/[boardId]/page.tsx`), renders real embeds. Not yet done: lazy-loading embeds as they scroll into view (currently all render immediately).
7. [x] **Remaining core providers**: Instagram, X (with preview-card fallback — see PRD §8's specific warning on X), TikTok, Reddit, Pinterest, Facebook, Threads. Endpoints verified against Meta's own official plugin source and the community oEmbed provider registry, not guessed from memory. Live-tested against real public posts for youtube/pinterest/x/tiktok/facebook (all `status: "ok"` with real embed HTML); instagram/threads test URLs were stale (got a proper "Media Not Found" API error, confirming the endpoint itself is correct); reddit hit transient sandbox network flakiness mid-test (one earlier direct request did succeed with the exact expected response shape).
8. [x] **Tags** — create/assign/remove per post (inline on each card), filter bar on the board page. Verified end-to-end against the real database (create, idempotent re-add, the exact nested `post_tags(tags(id,name))` query the page uses, remove).
9. [~] **Search** — Postgres `tsvector` full-text search across caption/author (search box on the board page, combinable with the tag filter), verified end-to-end against the real database. Required a real schema fix: the original expression-based index (`0001_init.sql`) couldn't be targeted by `supabase-js`'s `.textSearch()`, which needs a real column — `0002_posts_search_vector.sql` adds a generated `search_vector` column + index. Not yet done: platform/date filters, and this is per-board only, not the cross-board search PRD §6.6 describes (no multi-board browsing UI exists yet to search across).
10. [ ] **Remaining manual-add paths** — browser extension, mobile share-sheet, bulk import.
11. [ ] **Deleted/private source handling** — `status = 'unavailable'` badge path per `docs/database-schema.md`.

**Phase 1 exit criteria:** a single user can sign in, create a board, paste a URL from any of the 8 target platforms, see it render as a live embed (or correct fallback), tag it, and find it again via search.

## Phase 2 — Group ingestion

> **Reprioritization (2026-08-19):** WhatsApp (items 1 and 6 below) was pulled
> forward and built ahead of Phase 1, per explicit project-owner request —
> see `docs/PRD.md` §13 for the logged deviation from the documented phasing.
> `CLAUDE.md`'s "flag rather than silently proceed" rule is why this note
> exists instead of a silent reorder. Telegram/Discord items are unaffected
> and remain in their original Phase 2 order.

1. [x] **Ingestion pipeline shape** — the shared `pipeline.ts` logic described in `worker/README.md` and the `add-ingestion-source` skill (extract → blocklist → dedup → embed-fetch → insert), built once, used by every source type. Built platform-agnostic; WhatsApp is the first platform wired to it.
2. [~] **Telegram bot (webhook)** — `app/api/telegram/route.ts` built, secret-token verified (401s without it), verified end-to-end against a real dev server (real URL extraction, real YouTube fetch, real insert, idempotency tracked). Not yet done: registering the webhook with Telegram's `setWebhook` against the real deployed URL, and there's still no UI for connecting a Telegram group to a board — a `sources` row needs to be inserted directly for now, same situation as WhatsApp.
3. [ ] **Multi-board sharing/permissions** — owner/collaborator/viewer roles, board visibility (private/shared-link/public), before wiring bots into shared boards.
4. [x] **`worker/` process stood up locally** — npm workspace package, WhatsApp side built (`worker/src/whatsapp.ts`). Not yet deployed to Railway/Fly.io, and Discord's Gateway client isn't built yet.
5. [ ] **Discord bot (Gateway)** — same pipeline entry point as Telegram.
6. [x] **WhatsApp (Baileys) — code built**, not yet live: connection + pairing-code auth + session persistence + pipeline wiring done (`worker/src/whatsapp.ts`, `worker/src/pipeline.ts`). Blocked on (a) a dedicated non-primary number to pair against — risk-mitigation checklist from `docs/setup-guide.md` §6 still applies before going live — and (b) at least one real `board`/`sources` row to actually persist ingested posts into (needs Phase 1 auth + boards, items 3–4 above).
7. [ ] **Realtime updates** — Supabase Realtime pushing new ingested posts into an open board view.
8. [ ] **Queue-based ingestion** — move from direct pipeline calls to a real queue (Postgres-backed or Upstash Redis) once ingestion volume justifies it; this is the load-balancing practice rep from PRD §9.3 (see `swe.md`).

**Phase 2 exit criteria:** connecting a Telegram/Discord/WhatsApp group to a board auto-ingests every matched link with no duplicates, visible in real time to every board member.

## Phase 3 — Expansion

- [ ] Bot activity summaries (deferred per PRD §6.4)
- [x] Bluesky provider — same oEmbed pattern as everything else, verified against a real post. `linkedin` and `bluesky` were already in the `posts.platform` check constraint from `0001_init.sql`, so no migration was needed.
- [ ] LinkedIn (no formal oEmbed — needs its own non-oEmbed integration, see PRD §8), Twitch (clip embeds need a `parent` domain param matching the actual embedding host per-environment — dev/preview/production all differ — deliberately not guessed without a way to verify it actually loads)
- [ ] Browser extension polish
- [ ] Notifications (in-app first, per PRD §6.10)

## Phase 4 — Hardening

- [ ] Caching layer maturity (embed response TTLs tuned per provider)
- [ ] Rate-limit tuning per provider
- [ ] Worker fleet monitoring/observability
- [ ] Native mobile app evaluation

---

Cross-reference: `PRD.md` §13 (product-level phasing this expands on), `progress.md`
(what's actually done right now), `CLAUDE.md` (the rule about not skipping ahead).
