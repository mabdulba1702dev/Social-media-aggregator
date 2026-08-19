# Embed Providers

One file per platform, behind the shared `EmbedProvider` interface in `types.ts` (URL matcher + `fetchEmbed`), registered in `index.ts`'s `embedProviders` array. See the `add-embed-provider` skill in `.claude/skills/` for the checklist when adding a new one, and `docs/PRD.md` §8 for the per-platform embed method/cost/risk notes.

All eight PRD §6.2 core platforms are implemented: `youtube.ts`, `instagram.ts`, `x.ts`, `tiktok.ts`, `reddit.ts`, `pinterest.ts`, `facebook.ts`, `threads.ts`. Most share the standard oEmbed JSON shape via `oembed-fetch.ts`'s `fetchStandardOEmbed()` — only the endpoint URL and matcher regex differ per provider. `fetchStandardOEmbed()` never throws; any network failure or non-2xx response comes back as `status: "unavailable"`, which is what drives the preview-card fallback UI in `app/boards/[boardId]/post-card.tsx` — this matters most for X, which PRD §8 flags as having a genuinely unreliable embed widget for logged-out viewers, not a theoretical edge case.

Not yet implemented: LinkedIn (no formal oEmbed, PRD §8), Bluesky, Twitch — all Phase 3 per `docs/build-order.md`.
