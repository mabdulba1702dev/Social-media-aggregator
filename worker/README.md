# worker/

The always-on process referenced throughout `docs/PRD.md` §9.3 and `docs/setup-guide.md` §6 — deployed separately from the Next.js app (Railway/Fly.io free tier, not Vercel), because it holds persistent connections that don't fit a serverless request/response model:

- **Discord Gateway** — a websocket connection that has to stay open to receive messages in real time.
- **WhatsApp (Baileys)** — same idea, a persistent authenticated session against a dedicated phone number (see `docs/setup-guide.md` §6 for the risk-mitigation checklist before wiring this up for real).

Telegram does **not** need anything here — it runs as a normal webhook route inside the Next.js app (`app/api/telegram/route.ts`, once built), since Telegram bots support push-style delivery.

## Status

Both listeners are built: `src/whatsapp.ts` (Baileys, paired live against a real dedicated number — see `docs/setup-guide.md` §6's risk checklist) and `src/discord.ts` (Gateway, needs `DISCORD_BOT_TOKEN` + Message Content Intent enabled in the Discord Developer Portal). Both call into the shared `pipeline.ts`, so dedup/blocklist/embed-fetch logic lives in exactly one place. **Not yet deployed anywhere** — currently only runnable locally, and per `CLAUDE.md`'s Local Dev Hygiene section, shouldn't be left running when not in active use.

Run each listener as its own process — `npm run dev` / `npm run start` for WhatsApp, `npm run dev:discord` / `npm run start:discord` for Discord (both from this directory).

## Shape

```
worker/
├── package.json          # discord.js, baileys, @supabase/supabase-js
├── src/
│   ├── discord.ts         # Gateway client, forwards matched messages into the pipeline
│   ├── whatsapp.ts        # Baileys client, same pipeline entry point
│   └── pipeline.ts        # shared ingestion logic (see add-ingestion-source skill)
└── .env.example
```

Both listeners call into one shared `pipeline.ts` rather than duplicating the dedup/blocklist/embed-fetch logic per platform — that's the whole point of `add-ingestion-source` describing one pipeline shape instead of one per platform.

## Deploying

Railway or Fly.io both have a free tier sufficient for a single small worker at this project's scale (see `docs/PRD.md` §10). Whichever you pick, it needs its own environment variables — see `.env.example` in this folder — separate from the Vercel deployment's, since it's a separate service.
