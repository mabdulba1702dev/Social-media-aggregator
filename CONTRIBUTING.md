# Contributing

## Local Setup

Follow `docs/setup-guide.md` in full first — accounts, keys, and the Supabase migration all need to exist before the app does anything useful. Short version once that's done:

```bash
npm install
cp .env.example .env.local   # then fill in the values from setup-guide.md
npm run dev
```

## Branching & Commits

- Branch names: `feat/<short-description>`, `fix/<short-description>`, `chore/<short-description>`.
- Commit messages: imperative mood, present tense ("add board sharing", not "added" or "adds"). Keep the first line under ~70 characters; use the body for the *why* if it's not obvious from the diff.

## Before Opening a PR

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

All four should pass clean — run them locally first; `.github/workflows/ci.yml` runs the same four on every PR, but CI shouldn't be your first feedback loop. If a migration was added, note in the PR description that `supabase db push` needs to be run against staging/prod — migrations aren't applied automatically on deploy.

Every PR also gets a Vercel preview deployment automatically once the Vercel project is connected — that's this project's staging environment (see `docs/testing.md` §4), not a separate always-on server. If the PR touches UI, verify the acceptance criteria below against the preview URL, not just `localhost`.

Add an entry to `CHANGELOG.md`'s `[Unreleased]` section in the same PR if the change affects behavior, schema, or dependencies — see `docs/testing.md` and `docs/progress.md` for how these docs relate to each other.

## Testing

Full strategy and reasoning in `docs/testing.md` — short version:

- **Unit tests (Vitest, `npm run test`):** pure logic — URL normalization, dedup hashing, embed-provider response parsing, pipeline steps. Co-locate as `<file>.test.ts` next to the code it tests.
- **UI:** no automated E2E yet (deliberate — see `docs/testing.md` §3). Instead, every UI-touching PR includes acceptance criteria in the description (`given X, when Y, then Z`), verified by hand against the Vercel preview URL before requesting review, and re-verified by the reviewer.
- **Load testing:** not part of the PR gate — a targeted, on-demand exercise tied to a specific concern, not a standing suite. See `docs/testing.md` §5.

## Code Review

This repo is also a deliberate space to practice giving/receiving real code review (tying back to the project owner's own SWE-fundamentals goals — see `docs/PRD.md` §2). A few house rules to make that actually useful rather than rubber-stamping:

- Leave comments that explain *why* something should change, not just *what* — "this will duplicate a post if the webhook redelivers, see `ingestion_events`'s unique constraint" beats "nit: fix this."
- It's fine (encouraged) to ask "why did you do it this way?" as a genuine question rather than only flagging things you're sure are wrong.
- A PR touching `supabase/migrations/` should have its RLS implications called out explicitly in the description — who can now read/write what, and why that's correct.

## Adding a New Platform or Ingestion Source

Don't improvise — use the matching skill in `.claude/skills/` (`add-embed-provider` or `add-ingestion-source`). They exist so every platform addition follows the same shape and doesn't quietly diverge in structure from the last one.
