# PRD — Social Post Bookmarking & Embed App

**Status:** Draft v1 — based on your answers to the clarifying-questions round. Every place I filled a gap myself is called out explicitly in §14 (Assumptions Log) so you can correct anything I guessed wrong.

**Working name:** none set yet — using "the app" throughout. Naming is an open item (§14).

---

## 1. Vision

A place to bookmark social media posts the way people bookmark links today — except instead of a dead URL, you get the actual post rendered inline (image, video, caption, engagement — the real thing, not a screenshot), organized into collections and tags, filterable by platform. Posts get in two ways: you paste a URL yourself, or a bot sitting in a Telegram/Discord/WhatsApp group you already use for sharing links pulls every link in automatically.

It's built for both a single person curating their own feed and a group of people (a community, a team) building a shared board together — same underlying object, different sharing settings.

## 2. Goals

**Product goals**
- Make saving a social post as frictionless as sharing it in a group chat.
- Make browsing saved posts better than a bookmarks folder or a chat scrollback — visual, organized, searchable.
- Support the breadth of platforms people actually share from, not just one.

**Secondary goal — engineering practice**
You flagged wanting this project to double as practice for core system-design/SWE fundamentals: horizontal scaling, load balancing, queueing, caching, rate limiting. This lines up well with the system-design practice problems already in your career roadmap doc (chat app, news feed, rate limiter, URL shortener) — this app is genuinely a superset of those. §9 (Technical Architecture) is written to make those decisions explicit and visible rather than hiding them behind a framework default, specifically so the build doubles as that practice.

## 3. Non-Goals (v1)

To keep the MVP shippable, v1 explicitly does **not** include: AI-generated summaries of bot activity (you flagged this as a later phase), native mobile apps (responsive web first — see §14), a public marketplace/discovery feed of other people's public boards, or advertising/monetization infrastructure.

## 4. Users

- **Personal curator** — saves posts for themselves (research, inspiration, "watch later"), organizes with tags/collections, browses privately or shares a board publicly via link.
- **Shared/community board owner** — runs a group (friends, a team, a community) where a Telegram/Discord/WhatsApp group already exists for sharing links; connects that group so every link posted there lands in a shared board automatically, with multiple people contributing.

Both are the same underlying primitive (a "board"/collection with members and a visibility setting) — see §6.4.

## 5. Core Concepts

| Concept | Definition |
|---|---|
| **Post** | A saved social media URL, rendered as a live embed (not a screenshot), plus your metadata: tags, date saved, source. |
| **Collection / Board** | A named group of posts. Personal or shared. Public or private. A post can belong to more than one collection (see §14 for the nesting decision). |
| **Platform Pane** | A filtered view of a collection scoped to one platform (e.g. "Instagram" pane inside "Design Inspo" board) — a view, not a separate data structure. |
| **Tag** | Free-form label, independent of collections, many-to-many with posts. |
| **Source / Channel** | Where a post came from: manual add, or a connected Telegram/Discord/WhatsApp group. A board can have multiple connected sources. |

## 6. Feature Requirements

### 6.1 Embedding — what "embedded" means

Live, interactive embeds using each platform's own embed widget — so comments/likes/play controls work as they do on the source site — not a static screenshot. Where a platform has no embeddable widget or the embed fails (a real risk on some platforms right now, see §8), fall back to a rich preview card (thumbnail, caption, author, link out) rather than showing nothing.

### 6.2 Platform Support (v1 target list + suggested additions)

Your list: Instagram (incl. Reels), X/Twitter, TikTok, YouTube, Facebook, Reddit, Threads, Pinterest.

Worth adding to the roadmap, in rough priority order: **LinkedIn** (posts are embeddable, common share target), **Bluesky** (growing fast, has a clean public embed API, zero cost/friction), **Twitch** (clips embed easily), **Snapchat** (no public embed API — would be preview-card-only or deferred). I'd deprioritize Snapchat for v1 given the lack of an embed path.

Non-social URLs and files: you said "if it can be embedded it should be" — v1 scope is social platforms only, but the architecture (§8.4) treats "embed provider" as pluggable, so generic article/PDF/file previews are a natural Phase 3+ addition, not a rebuild.

### 6.3 Adding URLs — Manual Path

All of: paste-into-textbox, browser extension, mobile share-sheet, and bulk import (paste a list / import an export file). Dedup on add: normalize the URL (strip tracking params, resolve shortlinks like `t.co`, unify `twitter.com`/`x.com`) and hash it; if it already exists in the target collection, surface it instead of creating a duplicate.

### 6.4 Adding URLs — Chat Group Ingestion

- **Platforms:** Telegram, Discord, and WhatsApp all in scope. **Updated sequencing per your follow-up:** Telegram first (simplest, webhook-based, no risk), then Discord and WhatsApp together in Phase 2 — both need the same always-on worker infrastructure anyway (§9.3), so building them in the same phase is less work overall than staggering them, and you've confirmed unofficial-library risk on WhatsApp is acceptable as long as the library is a trusted one. §9.3 and §10 now specify **Baileys** (`WhiskeySockets/Baileys`) as that trusted library, with concrete risk-reduction practices, not just a risk acceptance.
- **Scope of ingestion:** only messages containing a URL matching a supported platform are picked up; everything else in the chat is ignored.
- **Filtering:** fully automatic, no approval queue — every matched link is ingested immediately.
- **Bot behavior:** silent in production. In a "testing" mode/flag, it can post a confirmation reaction or reply so you can verify it's working during development.
- **Multiple groups:** a user can connect multiple groups/channels, and each maps to a specific board — not one global inbox.
- **Future (Phase 3+):** an optional bot feature that summarizes activity in the group/board. Explicitly deferred per your answer.

### 6.5 Organization

Collections/boards as the primary grouping, with tags layered on top (orthogonal, many-to-many). See §14 for the nesting/multi-membership decision I'm proposing since you asked me to think it through.

### 6.6 Search

Full-text search across captions/text content, plus filtering by platform, tag, collection, and date. In scope for v1 given the size of a typical board — this is a straightforward Postgres `tsvector` index on Supabase, not a reason to reach for a dedicated search service yet (revisit if a board grows into the tens of thousands of posts).

### 6.7 Sharing & Permissions

Boards are shareable via a public link (like a Pinterest board), consistent with your "shareable" answer. Proposed default (open item, flag if wrong): **private by default when created, owner can flip to "shared via link" or invite specific collaborators with edit rights.** Since you confirmed both personal and shared/multi-contributor boards are in scope, the permission model needs at least owner/collaborator/viewer roles from day one, even if the UI for managing them is minimal in v1.

### 6.8 Auth

Google SSO (Supabase Auth's Google OAuth provider covers this directly, no extra service needed).

### 6.9 Moderation

Since ingestion is fully automatic with no approval queue, the safety net has to live elsewhere: a board owner/admin can remove any post after the fact, and a simple domain/keyword blocklist per board catches obvious junk before it's saved. This is intentionally lightweight for v1 — revisit if a shared board gets noisy in practice.

### 6.10 Notifications

Not directly specified — proposed default for v1: none beyond in-app (no email/push required to ship). Add later if a board owner wants "new post" alerts.

## 7. UX & Mockups

A UI mockup is included as a separate file (`ui-mockup.html`) reflecting the layout described below — open it in a browser to view it. It's a first-pass visual direction, not final; treat it as something to react to and redirect, not sign off on.

**Layout direction:** Pinterest/Are.na-style masonry grid as the primary browsing view (matches "bookmarking + tagging + panes" better than a rigid uniform grid, since embeds have very different natural aspect ratios — a tweet is short and wide, a Reel is tall). Left sidebar holds collections, platform panes, and tags as filters. Real-time updates (a new post lands in the board the instant the bot ingests it) via Supabase Realtime — cheap to add given the stack and matches the "shared group watching a live board" use case.

## 8. Platform Embed & Cost Reality Check

This matters enough to call out before the architecture section, because it directly shapes what "free" actually means for this project.

| Platform | Embed method | Cost / auth needed | Notes / risk |
|---|---|---|---|
| YouTube | oEmbed / iframe | Free, no key | Most reliable embed on the list. |
| Instagram | oEmbed (Meta) | **Free, tokenless** as of a June 2026 Meta policy change — no app review needed for single-post embeds | Only single posts, not live feeds; lower rate limit on tokenless access. |
| Threads | oEmbed (Meta) | Free, tokenless (same 2026 change) | Same caveats as Instagram. |
| Facebook | oEmbed (Meta) | Free, tokenless for single posts/videos | Same family of endpoints as above. |
| TikTok | oEmbed | Free, public endpoint, no key | Stable, widely used. |
| Reddit | oEmbed / embed widget | Free, public | Straightforward. |
| Pinterest | oEmbed / widget | Free, public | Straightforward. |
| **X / Twitter** | oEmbed via `publish.twitter.com` | Free for the embed call itself | **Real risk:** X's official read/search API dropped its free tier entirely in Feb 2026 (pay-per-use or $200+/month legacy tiers) — not needed just to embed, but X's embed widget itself has become increasingly unreliable for logged-out viewers since 2023–2024 (multiple reports of broken/blank embeds). Budget for a preview-card fallback here specifically, not just in theory. |
| LinkedIn (suggested add) | Embed via public post embed code | Free for public posts | No formal oEmbed, but a documented embed path exists. |
| Bluesky (suggested add) | oEmbed | Free, public | New but stable. |

**Bottom line:** every platform on your list is embeddable at $0 in API cost for the core use case (embedding a single public post). X is the one platform where I'd plan for the fallback preview-card path to actually get used in production, not just exist as a theoretical edge case.

## 9. Technical Architecture

### 9.1 Stack

- **Frontend + API:** Next.js on Vercel (matches your stated preference and reuses the JS/TS/React/Node track from your own learning roadmap).
- **Database + Auth + Storage:** Supabase (Postgres, Google OAuth, object storage for any cached assets, Realtime for live board updates).
- **Bot ingestion workers:** see §9.3 — this is the one piece that doesn't fit cleanly on Vercel's serverless model, and I'm flagging the tradeoff explicitly rather than glossing over it.

### 9.2 Data Model (sketch)

`users`, `boards` (owner_id, visibility, name), `board_members` (board_id, user_id, role), `posts` (board_id, canonical_url, url_hash, platform, embed_html/cache, added_by, source_type), `tags`, `post_tags` (many-to-many), `sources` (board_id, platform: telegram/discord/whatsapp, external_group_id, status), `ingestion_events` (source_id, raw_message_id, post_id, status, processed_at — for observability and idempotency).

### 9.3 Ingestion Pipeline — the "scaling/load balancing" piece

This is the section that gives you the system-design practice you asked for, and it's also where the architecture genuinely diverges by platform:

- **Telegram:** works great serverless — Telegram bots support **webhook mode**, so Vercel can receive each message as an HTTP POST with no persistent connection needed. Straightforward fit for the stack as-is.
- **Discord:** bots normally require a persistent **Gateway websocket connection** to receive messages in real time — that doesn't run on serverless functions with a 300-second max duration. This needs one small always-on process (a lightweight worker on Railway/Fly.io free tier, or similar) that listens on the Gateway and forwards matched messages into a queue. This is the one place "fully free on Vercel + Supabase" needs a small addendum — the worker itself can still be $0 on most free tiers at this scale, just not *on Vercel*.
- **WhatsApp (unofficial, via Baileys):** `WhiskeySockets/Baileys` — the most actively maintained, most widely used unofficial WhatsApp Web library — needs a persistent session/connection, same always-on worker pattern as Discord, plus session-state persistence (store the auth session in Supabase Storage so it survives restarts). Risk-reduction practices, not just acceptance: use a **dedicated, non-primary phone number** for pairing (single highest-leverage mitigation — contains the damage if it does get flagged); install only the canonical `whiskeysockets/baileys` package (a malicious fork called `lotusbail` compromised 56,000+ downloads by stealing auth sessions before being caught — verify the source); keep the library current (stale versions get detected first when WhatsApp changes its protocol); and lean into the fact that this use case is read-only monitoring of groups you're already a legitimate member of, not bulk/cold messaging, which is inherently the lower-risk end of what people do with these libraries. None of this makes the risk zero — only Meta's official Cloud API does, and it doesn't support this use case — but it's a real mitigation stack, not hand-waving.
- **Queue + workers:** every ingestion path (webhook or gateway) writes a raw event into a queue (Postgres-backed queue via Supabase, or Upstash Redis free tier) rather than processing inline. A pool of workers consumes the queue, does URL extraction → normalization → dedup check → embed-provider fetch → cache → write `post`. This is the actual "load balancing" lever: multiple worker instances pulling from one queue, so a burst of links (e.g. someone posting 30 links at once) doesn't block ingestion or hit platform rate limits directly.
- **Rate limiting & backoff:** each embed provider (Instagram, X, etc.) gets its own rate limiter and retry/backoff policy in the worker layer, since tokenless oEmbed access explicitly has lower limits than authenticated access (see §8).
- **Caching:** embed HTML/oEmbed responses are cached (with a TTL) rather than re-fetched every time a post renders, both for speed and to stay under rate limits — this is your CDN/caching-layer practice rep.
- **Idempotency:** `ingestion_events` keyed by the source's raw message ID means a redelivered webhook or a worker retry can't create a duplicate post — standard exactly-once-effect pattern worth doing properly here since you're using this as practice.

### 9.4 Handling Deleted/Private Source Posts

Not fully specified by you — proposed default: cache the embed HTML/thumbnail at save time (small storage cost, already covered by Supabase's free tier at this scale) so a saved post still shows *something* if the original is later deleted or made private, with a small "source unavailable" badge rather than a broken embed.

## 10. Prerequisites & Secrets Checklist

Everything below is free at this project's scale unless noted.

| Item | Where to get it | Cost |
|---|---|---|
| Google OAuth client ID/secret | Google Cloud Console → OAuth consent screen + credentials | Free |
| Telegram bot token | Message `@BotFather` on Telegram, `/newbot` | Free |
| Discord bot token + application | Discord Developer Portal → New Application → Bot tab; needs the **Message Content Intent** enabled | Free |
| WhatsApp session (Baileys) | No official credential — pair by scanning a QR code / entering a pairing code with a **dedicated, non-primary** phone number's WhatsApp (a spare SIM or ~few-dollar eSIM, e.g. Airalo) | Free (+ eSIM cost if you don't have a spare number), real but mitigated ToS/ban risk — see §9.3 |
| Supabase project | supabase.com → new project | Free tier: 500MB DB, 1GB storage, 5GB egress/month, 50k monthly active users — plenty for MVP; **free projects pause after a week of inactivity**, worth knowing during early dev |
| Vercel project | vercel.com → import repo | Free (Hobby) tier: 100GB data transfer/month, 1M function calls/month — but **Hobby explicitly prohibits any commercial use** (payments, ads, even donations); fine for now, would need Pro ($20/mo) the moment any monetization is added |
| Small always-on worker host (Discord Gateway + WhatsApp) | Railway, Fly.io, or similar | Free tier typically covers a single small worker at this scale; flagging as the one line item to watch |
| Domain name (optional) | Any registrar | ~$10–15/year if you want a custom domain instead of the default Vercel subdomain |
| Meta (Instagram/Facebook/Threads) app | Not required for v1 given the tokenless oEmbed change — only needed later for live feed features | Free when needed |
| X/Twitter developer account | Not required for v1 — using the free oEmbed endpoint only, not the paid read/search API | Free for embeds; paid tiers only relevant if you later want tweet search/verification, which is out of scope |

**What I need from you before build starts:** nothing blocking for the MVP — Telegram bot token and Google OAuth credentials are the only two you'd need to hand over/create, and both take under five minutes each.

## 11. Non-Functional Requirements

- **Performance:** initial board load should render above-the-fold posts without waiting on every embed to fully hydrate (lazy-load embeds as they scroll into view).
- **Security:** OAuth tokens and bot tokens stored as Vercel/Supabase environment secrets, never client-side; row-level security in Supabase scoping posts/boards to their owners/members.
- **Compliance:** if any EU users are expected, Supabase's EU-region hosting option covers basic GDPR data-residency needs; redisplaying public social posts via each platform's own official embed widget is exactly what those widgets are designed for, so no separate copyright concern there — the one gray area is the unofficial WhatsApp ingestion path (Baileys), which is a ToS risk on the connected number — mitigated per §9.3's practices but not eliminated — rather than a legal embedding concern.
- **Scale target for v1:** designed for personal-to-small-community use (single digits to low hundreds of active boards), but the ingestion architecture in §9.3 is deliberately built to scale horizontally rather than needing a rewrite if usage grows — that's the point of doing it this way from the start.

## 12. Engineering Practices / DX

You mentioned wanting `.claude` skills and a `CONTRIBUTING.md` set up for this repo. Proposed for Phase 0 (not built in this pass — this PRD is the scoping step, repo scaffolding is a follow-up task once you confirm direction):

- A skill for "add a new platform embed provider" (since the embed-provider layer is pluggable per §6.2/§8, adding platform #9 should be a documented, repeatable recipe).
- A skill for "add a new ingestion source type" (same idea, for the bot/worker layer).
- `CONTRIBUTING.md` covering local dev setup (Supabase local, env vars from §10), testing conventions, and PR expectations.
- [skills.sh](https://skills.sh) (`npx skills add <owner>/<repo>`, Vercel Labs) as the way to pull in *third-party* published skills relevant to this stack, distinct from the two project-specific skills above, which are hand-written and won't exist on a public registry.

## 13. Roadmap

- **Phase 0 — Setup:** repo scaffolding, Supabase + Vercel projects, Google OAuth, `.claude` skills + CONTRIBUTING.md.
- **Phase 1 — MVP:** manual URL add (paste + extension), core platform embeds (YouTube, Instagram, X, TikTok, Reddit, Pinterest, Facebook, Threads) with preview-card fallback, personal boards, tags, basic masonry UI, Google auth, search.
- **Phase 2 — Group ingestion:** Telegram bot (webhook), Discord bot (Gateway worker) and WhatsApp bot (Baileys, on the same always-on worker as Discord — moved up from Phase 3 per your follow-up), multi-board sharing/permissions, dedup pipeline, queue-based ingestion architecture, Realtime updates.
- **Phase 3 — Expansion:** bot activity summaries, LinkedIn/Bluesky/Twitch support, browser extension polish, notifications.
- **Phase 4 — Hardening:** caching layer maturity, rate-limit tuning per provider, monitoring/observability on the worker fleet, evaluate native mobile app.

## 14. Assumptions Log — please confirm or correct

You asked me to make reasonable calls on everything not explicitly answered. Here's every one of those calls in one place:

1. **Naming/branding:** no name chosen yet — placeholder only. Needs a decision before Phase 1 ships anything public-facing.
2. **Web vs. mobile app:** assumed responsive web app first, native mobile deferred to Phase 3+ evaluation, given no explicit answer.
3. **Collection nesting — CONFIRMED 2026-08-19:** a post can belong to **multiple** collections (many-to-many), and collections can be **nested one level deep** (a "folder" containing sub-boards) but not arbitrarily deep. Already implemented in `supabase/migrations/0001_init.sql` (`parent_board_id` + the `enforce_single_level_nesting` trigger) — no schema change needed. Tags stay flat and orthogonal to collections entirely.
4. **Permission roles — CONFIRMED 2026-08-19:** owner/collaborator/viewer on shared boards. Already implemented in `board_members`.
5. **Notifications:** assumed none required for v1 beyond in-app state.
6. **Dark/light mode:** assumed both, from day one — low cost to include now, expensive to retrofit.
7. **Reference apps for visual direction:** you didn't name any specific ones — the mockup draws on Are.na and Pinterest for the grid/board feel and Raindrop.io for the sidebar/collections pattern, based on the research in §"landscape" from the earlier clarifying-questions round. Redirect me if you have different taste references in mind.
8. **Deleted/private source posts:** assumed cache-at-save-time with a fallback badge, per §9.4.
9. **Domain/branding budget:** not addressed — flagged as the one likely non-zero recurring cost (~$10-15/year) if you want a custom domain.

---

A separate file, `ui-mockup.html`, accompanies this PRD with a first visual pass at the layout described in §7 — open it in a browser.
