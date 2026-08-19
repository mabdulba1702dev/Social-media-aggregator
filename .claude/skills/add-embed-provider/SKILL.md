---
name: add-embed-provider
description: Use when adding support for embedding a new social media platform (e.g. LinkedIn, Bluesky, Twitch) into the app, or when fixing/updating an existing platform's embed logic. Covers the full checklist from schema to UI fallback.
---

# Add Embed Provider

Adding platform support touches four places. Do all four — skipping one is the most common way this drifts into an inconsistent state.

## 1. Database

Add the platform's identifier to the `platform` check constraint in a **new** migration file under `supabase/migrations/` (never edit `0001_init.sql` directly — see `CLAUDE.md`). Example:

```sql
alter table posts drop constraint posts_platform_check;
alter table posts add constraint posts_platform_check
  check (platform in (
    'instagram', 'x', 'tiktok', 'youtube', 'facebook',
    'reddit', 'threads', 'pinterest', 'linkedin', 'bluesky',
    '<new_platform>', 'other'
  ));
```

Update the platform table in `docs/database-schema.md` and the cost/method matrix in `docs/PRD.md` §8 to match.

## 2. Provider Implementation

Create `lib/embed-providers/<platform>.ts` implementing the shared provider interface (URL matching, oEmbed/API call, response normalization into `embed_html` + `embed_thumbnail_url` + `caption` + `author_name`/`author_handle`). Look at an existing provider for the exact interface shape once one exists — the first provider you write establishes it.

Check before writing the fetch logic:
- Does this platform have a free, tokenless oEmbed endpoint? (Most do — see the matrix in `docs/PRD.md` §8.) If yes, use it directly.
- If not, does it need an API key/app review? Note the requirement in `docs/setup-guide.md`.
- What does a **deleted/private source post** look like from this provider (error shape), and does the provider correctly return a "fetch failed" signal the caller can turn into `status = 'unavailable'` per `docs/database-schema.md`?

## 3. Rate Limiting & Caching

Register the new provider with its own rate limiter/backoff policy (per `docs/PRD.md` §9.3 — tokenless access typically has lower limits than authenticated). Cache the embed response with a TTL rather than fetching on every render.

## 4. UI

Add the platform's badge color to `tailwind.config.ts`'s `platform` color group and to the table in `docs/design-system.md`. If the platform has no reliable embed widget (check `docs/PRD.md` §8's risk notes — X is the known example), make sure the preview-card fallback state (`docs/design-system.md`'s "States to Design For") is what actually renders, not a broken embed.

## Don't

- Don't add a platform to the UI (badge, filter in sidebar) before its provider and DB constraint are in — half-wired platforms produce confusing "this platform exists but nothing works" states.
- Don't skip the fallback-state check even if the embed "works in my testing" — every platform in the matrix has at least some failure mode (deleted post, rate limit, private account).
