---
name: add-ingestion-source
description: Use when adding a new chat platform (beyond Telegram/Discord/WhatsApp) as a group-ingestion source, or when modifying how an existing bot ingests links into a board. Covers the ingestion pipeline end to end.
---

# Add Ingestion Source

Every ingestion path — regardless of platform — funnels into the same pipeline described in `docs/PRD.md` §9.3 and the `ingestion_events`/`sources` tables in `docs/database-schema.md`. Don't build a parallel path; extend the existing one.

## 1. Connection Model — Decide Webhook vs. Persistent Connection First

This is the fork that matters most (see `docs/PRD.md` §9.3):
- **Webhook-capable** (like Telegram): the platform POSTs to a Next.js route handler directly. No extra infrastructure.
- **Persistent-connection-only** (like Discord's Gateway, or any unofficial-library-based integration): needs the always-on worker process (outside Vercel), forwarding matched messages into the same queue a webhook route would write to.

Figure out which category the new platform falls into before writing any code — it determines where the code even lives.

## 2. Schema

New platform value goes into the `platform` check constraint on the `sources` table (new migration, same rule as `add-embed-provider`: never hand-edit `0001_init.sql`). Update `docs/database-schema.md`'s `sources` section.

## 3. Ingestion Flow (must match this shape)

1. Inbound message arrives (webhook payload or Gateway event).
2. Write a row to `ingestion_events` **first**, keyed on `(source_id, raw_message_id)` — this is the idempotency guarantee from `docs/database-schema.md`. If the insert conflicts (duplicate), stop — this message was already processed.
3. Extract URLs from the message text; discard the message if none match a supported platform (per `docs/PRD.md` §6.4 — only matched-platform URLs are ingested, everything else is ignored).
4. Check the board's `blocklist_rules` (domain/keyword) — drop and mark `ingestion_events.status = 'ignored'` if blocked.
5. Normalize + hash the URL, check `posts` for an existing `(board_id, url_hash)` — if found, mark `duplicate` and stop.
6. Fetch the embed via the matching provider in `lib/embed-providers/` (this is where `add-embed-provider`'s work gets consumed).
7. Insert the `post` row, update `ingestion_events.status = 'processed'` with the resulting `post_id`.
8. Use the **service-role Supabase client** for all of this (see `CLAUDE.md`'s Supabase-access convention) — the ingestion worker isn't acting as any single logged-in user.

## 4. Bot Behavior

Per `docs/PRD.md` §6.4: stay silent in production. Gate any confirmation reply/reaction behind an explicit test-mode flag, don't ship it as always-on chatter in the group.

## Don't

- Don't process a message before writing its `ingestion_events` row — that's the whole point of the ordering in step 2, it's what makes retries/redeliveries safe.
- Don't put persistent-connection logic (Gateway-style) inside a Vercel serverless function — it will get killed at the function timeout and silently stop receiving messages.
