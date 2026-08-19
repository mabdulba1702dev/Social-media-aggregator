# Database Schema

Expands the data-model sketch from the PRD (§9.2) into the actual, runnable schema. The SQL lives in `supabase/migrations/0001_init.sql` — this doc explains the *why* behind each decision. Apply it with `supabase db push` after linking your project (see `setup-guide.md` §4).

## Entity Overview

```
profiles ──< board_members >── boards ──< sources ──< ingestion_events
                                   │            
                                   ├──< posts >──< post_tags >── tags
                                   │
                                   ├──< blocklist_rules
                                   │
                                   └──(self, one level) parent_board_id
```

## Tables

### `profiles`
One row per authenticated user, extending Supabase's built-in `auth.users`. Auto-created by a trigger on signup (`handle_new_user`) so you never have to remember to create it manually after Google OAuth completes.

### `boards`
The core organizing unit — what the PRD calls a "collection." `visibility` implements the private / shared-link / public model from PRD §6.7. `parent_board_id` implements the one-level-nesting decision from PRD §14 (assumption #3) — a trigger (`enforce_single_level_nesting`) rejects any attempt to nest a board under a board that already has a parent, so "folders of folders" can't accidentally happen.

### `board_members`
Explicit role table (`owner` / `collaborator` / `viewer`) rather than relying only on `boards.owner_id`, because shared boards need more than one editor (PRD §6.7's multi-contributor requirement). The owner is also inserted here as a `board_members` row for uniform permission-check logic (see RLS below) — `boards.owner_id` remains the source of truth for "who owns this," `board_members` is the source of truth for "who can do what."

### `sources`
A connected Telegram/Discord/WhatsApp group, always scoped to exactly one board (PRD §6.4: multiple groups per account, each mapping to a specific board — not a global inbox). `external_group_id` is whatever ID that platform uses for the group/channel. `status` lets a source be paused without deleting its history.

### `posts`
The saved URL itself. A few decisions worth flagging:

- **`url_hash` + `unique(board_id, url_hash)`** is the dedup mechanism from PRD §6.3. Compute it application-side by normalizing the URL first (lowercase host, strip tracking params like `utm_*`, resolve known shortlinks, unify `twitter.com`/`x.com`) and hashing the result — the schema only enforces uniqueness *within a board*, deliberately, since the same post being saved into two different boards by two different people is a legitimate case, not a duplicate.
- **`embed_html` / `embed_thumbnail_url`** cache the provider's embed response (PRD §9.4) so a deleted/private source post still renders something, with `status = 'unavailable'` flipping when a background check detects it's gone.
- **`platform` check constraint** lists exactly the platforms from PRD §6.2 plus the suggested additions (LinkedIn, Bluesky) plus an `other` escape hatch — adding a new platform later means adding one value to this constraint (a migration) and one entry in the embed-provider registry (`lib/embed-providers/`), which is exactly the workflow the `add-embed-provider` skill (`.claude/skills/`) walks through.
- **Full-text search** — `search_vector`, a `tsvector` generated column over caption + author (`0002_posts_search_vector.sql`), with a GIN index. A generated column rather than a bare expression index specifically so `supabase-js`'s `.textSearch()` can query it directly — PostgREST filters against real columns, not arbitrary indexed expressions. Covers PRD §6.6 without needing a separate search service at this scale.

### `tags`
Scoped per-board rather than global — a tag namespace shared across every board a user has would get messy fast, and boards are the natural boundary per PRD §6.5.

### `ingestion_events`
This is the idempotency table referenced in PRD §9.3's "load balancing / scaling" architecture. Every inbound bot message — whether from Telegram's webhook or Discord's Gateway worker — writes one row here first, keyed uniquely on `(source_id, raw_message_id)`. If Telegram redelivers a webhook (it does this on timeout) or a worker retries after a crash, the unique constraint means the second attempt is recognized as a duplicate rather than creating a second post. `status` tracks the row through the pipeline (`pending` → `processed`/`duplicate`/`ignored`/`failed`) which also gives you the observability the PRD calls for.

### `blocklist_rules`
The lightweight moderation net from PRD §6.9 — since ingestion is fully automatic with no approval queue, this is the one thing standing between "someone posts a spam link" and it silently appearing on the board.

## Row Level Security

Every table has RLS enabled — this is Supabase's mechanism for enforcing "can this logged-in user see/edit this row" at the database layer, not just in application code, which matters a lot once the board-sharing model (private/shared-link/public, owner/collaborator/viewer) is in play.

Two helper functions do the heavy lifting so the policy definitions stay readable: `is_board_member()` and `can_edit_board()`. The general shape: **read** access follows a board's visibility (public/shared-link boards are readable by anyone, private ones only by members); **write** access requires `owner` or `collaborator` role via `board_members`.

**Important operational note:** the ingestion workers (Telegram webhook handler, Discord Gateway worker) should use Supabase's **service role key**, not a user session — that key bypasses RLS entirely, which is correct here since the worker is inserting posts on behalf of *any* board's connected source, not acting as a single logged-in user. Never expose the service role key to the browser (it's in `.env.example` as a server-only variable for exactly this reason).

## What's Deliberately Not in v1

- No `notifications` table — PRD §6.10 defers notifications past v1.
- No global/cross-board tag table — see `tags` above.
- No separate `embed_providers` table — the platform list is a check constraint plus application-layer registry (`lib/embed-providers/`) rather than a DB table, since it changes by code deploy, not by end-user action.

Adding any of these later is an additive migration, not a redesign.
