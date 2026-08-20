# Setup & Prerequisites Guide

Everything you need before writing feature code. Follow in order — each section unblocks the next. Costs called out inline; the running total should stay $0 through Phase 1.

**Update on skills.sh:** confirmed — it's a real, actively maintained tool (Vercel Labs, github.com/vercel-labs/skills), an npm-style registry/CLI for agent skills. See §7a below for exact usage; it works alongside, not instead of, the `.claude/skills/` folder already in this scaffold.

---

## 1. Local Tools (install once, on your machine)

| Tool | Why | Install |
|---|---|---|
| Node.js (LTS, 20.x+) | Runtime for Next.js | nodejs.org, or `nvm install --lts` |
| npm | Package manager (matches what you already use per your learning roadmap) | Bundled with Node |
| Git | Version control | git-scm.com |
| VS Code | Editor | code.visualstudio.com |
| GitHub CLI (`gh`) | Repo/PR management from the terminal | `winget install --id GitHub.cli -e` (Windows), `brew install gh` (macOS) |
| Supabase CLI | Local dev DB, migrations | Already a project devDependency — run via `npx supabase <command>`. (`npm install -g supabase` is deprecated; don't use it.) |
| Vercel CLI (optional) | Local preview of deployed env | `npm install -g vercel` |

**Recommended VS Code extensions** (already pre-configured in `.vscode/extensions.json` in the scaffold — VS Code will prompt you to install them on first open):
ESLint, Prettier, Tailwind CSS IntelliSense, Supabase, GitLens.

## 2. Accounts to Create

All free at this project's scale (cross-referenced against the cost table in the PRD):

1. **GitHub** — code hosting. github.com
2. **Vercel** — hosting/deploy. vercel.com → sign in with GitHub (this is the easiest path — it links the two automatically)
3. **Supabase** — database/auth/storage. supabase.com → sign in with GitHub
4. **Google Cloud Console** — for Google OAuth (sign-in). console.cloud.google.com
5. **Telegram** — you already have this; you'll talk to `@BotFather` to create a bot
6. **Discord Developer Portal** — discord.com/developers → sign in with your Discord account
7. **21st.dev** — for the Magic MCP component tool (§7). 21st.dev → free tier available
8. **A dedicated WhatsApp-capable phone number** — not a website account, but you need it for the bot to pair via Baileys (§6). Strongly recommend this is *not* your primary personal number — a spare SIM, an eSIM from a provider like Airalo (a few dollars), or a secondary number from your carrier. See §6's risk notes before connecting your main number.

## 3. GitHub Repo

I can't create the GitHub repo directly (that needs your GitHub credentials), but the scaffold is ready to push. From inside the `social-embed-app/` folder:

```bash
git init
git add .
git commit -m "chore: initial project scaffold"
```

Then either:
- **Via GitHub's website:** create a new empty repo (no README/gitignore — you already have those), copy the remote URL, then:
  ```bash
  git remote add origin <your-repo-url>
  git branch -M main
  git push -u origin main
  ```
- **Via GitHub CLI**, if you have `gh` installed and authenticated:
  ```bash
  gh repo create social-embed-app --private --source=. --remote=origin --push
  ```

Recommend **private** repo while this is pre-launch.

## 4. Supabase Project

1. supabase.com → New Project. Pick a region close to your users (or EU if GDPR matters per the PRD's NFR section).
2. Once created, go to **Project Settings → API** and copy: `Project URL`, `anon public key`, `service_role key` (service role is server-side only — never expose it client-side).
3. Go to **Authentication → Providers → Google** and enable it — you'll need the Google OAuth client ID/secret from step 5 first.
4. Link your local project to it:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   ```
5. Apply the schema migration (already written for you in `supabase/migrations/0001_init.sql` — see `docs/database-schema.md`):
   ```bash
   npx supabase db push
   ```

## 5. Google OAuth (for Sign in with Google)

1. console.cloud.google.com → New Project (or reuse one you have).
2. **APIs & Services → OAuth consent screen** → configure as "External," fill in app name/support email.
3. **Credentials → Create Credentials → OAuth client ID** → type "Web application."
4. Authorized redirect URI: `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback` (Supabase shows you this exact URL on the Google provider setup screen).
5. Copy the Client ID and Client Secret into Supabase's Google provider settings (step 4.3 above).

## 6. Bot Tokens (Telegram / Discord)

**Telegram** (do this one first — simplest, works serverless per the PRD's architecture):
1. Open Telegram, message `@BotFather`.
2. `/newbot` → follow prompts → you get a bot token immediately.
3. Add the bot to the group you want to ingest from; disable **privacy mode** via BotFather (`/setprivacy` → Disable) so the bot can see all messages, not just commands.
4. Set `TELEGRAM_BOT_TOKEN` and a random `TELEGRAM_WEBHOOK_SECRET` (any long random string — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) in both `.env.local` **and** the Vercel project's environment variables (Preview and Production) — the webhook route (`app/api/telegram/route.ts`) rejects any request that doesn't carry this secret in the `X-Telegram-Bot-Api-Secret-Token` header, so it has to match on both sides.
5. Once deployed, register the webhook (replace `<TOKEN>`, `<SECRET>`, `<YOUR_DEPLOYED_URL>`):
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
     -d "url=https://<YOUR_DEPLOYED_URL>/api/telegram" \
     -d "secret_token=<SECRET>"
   ```
   Verify it took with `curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"`.
6. Connecting a group to a board: there's no UI for this yet (Phase 1 item, not built) — insert a row into `sources` directly (`platform: 'telegram'`, `external_group_id`: the group's chat ID as a string, e.g. `-1001234567890` — get it from `getWebhookInfo`'s pending updates, or from the bot's own logs once one message comes in and fails to match a source).

**Discord:**
1. discord.developers.com → New Application.
2. **Bot** tab → Add Bot → copy token.
3. Under **Privileged Gateway Intents**, enable **Message Content Intent** (required to read link text in messages).
4. Use the OAuth2 URL generator (scope: `bot`, permissions: Read Messages/View Channels) to get an invite link, and add the bot to your server.
5. Remember from the PRD: Discord's Gateway connection needs a small always-on worker (Railway/Fly.io free tier) — it won't run on Vercel's serverless functions like the Telegram webhook does.

**WhatsApp** (moved up into Phase 2, alongside Discord — see the roadmap update in `docs/PRD.md` §13): using **Baileys** (`WhiskeySockets/Baileys` on GitHub/npm), the most actively maintained and widely used unofficial WhatsApp Web library. There is still no official API for reading messages in a normal group, so this remains a real risk, not a solved problem — treat the following as risk *reduction*, not risk *elimination*:

1. **Use the dedicated number from §2, item 8, not your primary number.** This is the single highest-leverage mitigation — if it does get flagged, the damage is contained.
2. **Install only the canonical package.** A malicious fork called `lotusbail` compromised 56,000+ downloads by stealing auth tokens before being caught — always install from `whiskeysockets/baileys` directly (`npm install baileys` resolves to the real one, but double-check the GitHub org on any tutorial you follow).
3. **Only connect to groups you're already a legitimate member of.** This app's use case (read-only monitoring of a group you're already in) is inherently lower-risk than bulk/cold messaging — Baileys listens over the same websocket connection WhatsApp Web itself uses, so it doesn't send anything, only reads. Keep it that way; don't add auto-reply features on this number later without reconsidering the risk.
4. **Keep the library updated.** WhatsApp changes its protocol periodically; a stale Baileys version is what gets detected first.
5. **Accept the baseline risk.** Every source on this converges on the same bottom line: only Meta's official Cloud API (which doesn't support this use case) carries zero ToS risk. Baileys reduces exposure, it doesn't remove it.

Setup:
```bash
npm install baileys
```
Baileys authenticates by scanning a QR code (or entering a pairing code) with the dedicated number's WhatsApp app — no API key or developer account involved. Like Discord, this needs the always-on worker (not a Vercel serverless function) to hold the persistent connection and store the auth session (persist it in Supabase Storage so a worker restart doesn't force re-pairing).

## 7. 21st.dev — Magic MCP (AI-assisted UI components)

21st.dev is a component registry (shadcn/ui + Tailwind + Radix, described as "npm for design engineers") — useful here for quickly generating the card/sidebar/modal components from the mockup without hand-building every primitive.

Two ways to use it:

- **One-off component install** (no account needed for public components): browse 21st.dev, then
  ```bash
  npx shadcn@latest add "https://21st.dev/r/<author>/<component>"
  ```
  This drops the component into `components/ui/` and wires up any Tailwind theme extensions it needs.

- **Magic MCP** (natural-language component generation directly inside Claude Code / Cursor): sign up at 21st.dev, get a free-tier API key, then install the MCP server:
  ```bash
  npx @21st-dev/cli@latest install claude --api-key <YOUR_KEY>
  ```
  After that, an editor session with MCP access can generate/search components conversationally rather than needing a specific URL each time.

## 7a. skills.sh — Installing Agent Skills

skills.sh (github.com/vercel-labs/skills) is an npm-style registry for agent skills — separate from, and complementary to, this repo's own hand-written skills in `.claude/skills/`. Use it to pull in *other* people's published skills rather than writing everything from scratch.

```bash
npx skills add <owner>/<repo>
```

This fetches the named skill and makes it available to your AI agent (it works alongside Claude Code's own `.claude/skills/` convention — the two aren't competing systems). Browse skills.sh's homepage to find ones relevant to this stack (Next.js, Supabase, Tailwind are all likely to have community skills worth pulling in) before writing a custom one — check `.claude/skills/` first to make sure you're not duplicating `add-embed-provider` or `add-ingestion-source`, which are specific to this project's architecture and won't exist on the public registry.

## 8. Vercel Deployment

1. vercel.com → **Add New → Project** → import the GitHub repo from step 3.
2. Framework preset: Next.js (auto-detected).
3. Add environment variables (from `.env.example` — see below) in **Project Settings → Environment Variables**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`.
4. Deploy. Reminder from the PRD: Vercel's free Hobby tier explicitly disallows commercial use (payments, ads, donations) — fine for now, revisit if monetization gets added later.

## 9. Environment Variables Reference

See `.env.example` in the project root for the full list with placeholders — copy it to `.env.local` for local dev and never commit the filled-in version (already covered by `.gitignore`).

## 10. What's Genuinely Blocking vs. Can Wait

**Needed before Phase 1 (MVP) can run at all:** Supabase project + keys, Google OAuth credentials.
**Needed before Phase 2 (group ingestion):** Telegram bot token, Discord bot token, a dedicated WhatsApp number for Baileys pairing, and a small always-on worker host (covers both Discord and WhatsApp).
**Can wait:** 21st.dev API key (nice-to-have, not required to hand-build components), custom domain.

---

Once these are in place, `npm install && npm run dev` in the scaffolded project should boot a working local app pointed at your Supabase project.
