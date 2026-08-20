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

**`dev` branch (deliberate speed tradeoff, adopted 2026-08-19):** during this
early build-out phase, work lands on `dev` as it's finished — sometimes
committed there directly, sometimes as a feature branch PR'd into it — rather
than every change waiting on an individual PR merge before the next thing
starts. `dev` gets its own CI run and its own Vercel preview deployment, same
as `main`. `dev` → `main` happens as its own PR — see auto-merge below for
how that PR actually lands. This trades some of the strict one-PR-per-change
review discipline above for speed while the project is still finding its
shape — revisit this once there's more than one active contributor, since the
tradeoff stops being worth it once review is the whole point (see
`docs/testing.md` and the Code Review section below for why review still
matters here).

**Auto-merge on green CI (adopted 2026-08-20):** `main` has branch protection
requiring the `lint, typecheck, test, build` check to pass before anything
merges — no required human review, by design (see above). PRs opened by an
agent get `gh pr merge --auto --squash`, so they merge themselves the moment
CI passes, no click needed. **One PR represents exactly the diff that existed
when it was opened** — pushing more commits to `dev` after a PR is already
open does *not* retroactively get included in it (this bit us once: PR #4
merged, but 5 more commits had landed on `dev` afterward with no PR tracking
them until it was noticed). The fix is discipline, not tooling: open a PR
**immediately** when a feature is done and gate-passing, not batched — never
let unmerged work accumulate on `dev` waiting for a "good moment" to PR it.
Schema changes touching RLS/security, anything handling secrets, and the
WhatsApp/Baileys risk surface should still get an explicit human look before
merging, even though nothing stops them from auto-merging technically.

**Squash-merge + long-lived `dev` needs an explicit sync habit.** Every
`dev` → `main` merge here is a squash, which means `main`'s resulting commit
has a *different hash* than the commits that produced it on `dev`, even
though the content matches — git can't tell it "contains" `dev`'s history.
Left alone, the next `dev` → `main` PR eventually hits a real merge conflict
(hit this twice: PR #8 and PR #10). The fix isn't "remember to sync after
merging" — that's exactly what got skipped both times. Instead: **run
`git fetch origin && git merge origin/main` into `dev` at the start of each
new work session**, before writing any new code, not reactively after a
conflict shows up. A conflict caught proactively (before you've built
anything else on top) is a two-file fix; caught reactively it can span
several unrelated docs/changelog entries.

## Before Opening a PR

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

All four should pass clean — run them locally first; `.github/workflows/ci.yml` runs the same four on every PR, but CI shouldn't be your first feedback loop. If a migration was added, note in the PR description that `npx supabase db push` needs to be run against staging/prod — migrations aren't applied automatically on deploy.

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
