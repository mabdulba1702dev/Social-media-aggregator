# Testing Strategy

This project deliberately does **not** reach for a full automated testing
pyramid on day one — at this size, a heavy test setup (containers, E2E browser
farms) costs more in maintenance than it returns. The approach below is scoped
to what actually catches real bugs at this project's stage, and is expected to
grow — see "When to add more" at the bottom.

## 1. Unit tests — Vitest

**Tool:** [Vitest](https://vitest.dev) (`npm run test` / `npm run test:watch`), config in `vitest.config.mts`.

**What belongs here:** pure logic with no network/DB/browser involved —
URL normalization and dedup hashing (PRD §6.3), embed-provider response
normalization, the ingestion pipeline's pure steps (blocklist matching, dedup
check logic), rate-limiter/backoff math. Anything you'd otherwise convince
yourself is correct by staring at it is a candidate for a Vitest test instead.

**Convention:** co-locate as `<file>.test.ts` next to the file it tests (see
`lib/utils.test.ts` for the reference pattern). No separate `__tests__/` tree —
keeping the test next to the implementation makes it obvious when a function
changes and its test wasn't touched.

**Deliberately not installed yet:** `jsdom` / `@testing-library/react`. There
are no React components worth unit-testing yet (the placeholder page has zero
logic). Add these the moment Phase 1 produces a component with real
conditional rendering or state — don't add them speculatively now.

## 2. Endpoint / route handler tests

Next.js App Router route handlers (`app/api/*/route.ts`) are plain async
functions — test them directly with Vitest by importing the handler and
calling it with a constructed `Request`, no server needs to be running.

**Convention once these exist:** mock `lib/supabase/server.ts`'s `createClient()`
(and `createServiceRoleClient()` for ingestion routes) rather than hitting a
real Supabase project — these are still unit-scoped tests of the route's logic
(auth check, validation, correct table touched), not integration tests.
Reserve real-Supabase-project testing for the staging step (§4) instead of
mocking a database in CI, per the general principle that mocks should model a
contract you're confident in, not stand in for "we didn't want to test the
real thing."

**Webhook-specific:** the Telegram/Discord/WhatsApp ingestion paths (Phase 2)
should get a test for the idempotency behavior specifically — redelivering the
same `raw_message_id` twice must not create two posts. This is the one piece
of PRD §9.3 where a logic bug is both easy to introduce and easy to miss by
eye, so it's worth a real test rather than manual verification.

## 3. UI testing — acceptance criteria, not automated E2E

**Decision:** no Playwright/Cypress for now. UI verification is user-navigated
against written acceptance criteria, not scripted browser automation.

**Why:** an E2E suite has real ongoing cost (flakiness, fixture/auth setup,
maintenance as the UI changes) that isn't worth paying yet at this project's
size and single-maintainer stage. `playwright-cli` exists on skills.sh and is
worth revisiting once there's enough surface area (Phase 2+, multiple
contributors) that manual click-through stops being reliable enough on its own
— see "When to add more."

**Convention:** every feature-sized PR that touches UI includes acceptance
criteria in the PR description — a short checklist of "given X, when Y, then Z"
statements the author verified by hand before requesting review, and the
reviewer re-verifies rather than trusting the description. Example shape:

```markdown
## Acceptance Criteria
- [ ] Given an empty board, pasting a valid YouTube URL renders a playable embed within 2s
- [ ] Given a URL already saved to this board, pasting it again surfaces the existing post instead of duplicating
- [ ] Given an invalid/unsupported URL, the input shows an inline error, not a silent failure
```

This is intentionally the same discipline CONTRIBUTING.md's Code Review
section already asks for ("explain why," not "trust me it works") — acceptance
criteria are just that same rigor applied before review starts.

## 4. Staging — Vercel preview deployments, not containers

**Decision:** no Docker, no separate staging server to maintain. Vercel already
gives every PR its own preview deployment (a real, publicly-reachable URL
running the actual build) the moment the Vercel project is connected to the
GitHub repo — that *is* the staging environment, at zero extra infrastructure
cost and zero container weight.

**Convention once the Vercel project exists:**
- Preview deployments point at a **separate, non-production Supabase project**
  (or a branch database, if using Supabase's branching feature) — never point
  a preview build at production data.
- The acceptance criteria from §3 get verified against the preview URL, not
  `localhost`, before a PR merges — this catches the class of bug that only
  shows up in a real deployed build (env var misconfig, edge-runtime
  differences, cold-start behavior).
- API routes / webhooks (Phase 2's Telegram/Discord ingestion) get smoke-tested
  against the preview URL the same way — e.g. pointing a test Telegram bot's
  webhook at the preview deployment temporarily.

This avoids the bloat of a permanent always-on staging server *and* the bloat
of container-based local staging — the preview deployment already is
production-like infrastructure, reused for free.

## 5. Load testing — deferred, and deliberately not automatic

Not run in CI, not run on every PR — load testing is a targeted exercise you
run against a specific concern (e.g. "can the ingestion pipeline handle a
burst of 30 links posted at once," per PRD §9.3), not a standing test suite.
When it's actually time to exercise this (Phase 2's queue-based ingestion, or
before any public launch), a lightweight script-based tool (k6 or Artillery)
run manually/on-demand against a preview deployment is enough — no dedicated
load-testing infrastructure needed at this project's scale. See `swe.md` for
the reasoning behind treating this as a deliberate exercise tied to specific
system-design practice goals, not a checkbox.

## 6. CI — what actually gates a merge

`.github/workflows/ci.yml` runs on every PR and every push to `main`:
lint → typecheck → test → build, in that order, failing fast. This is the
automated version of the three-command gate CONTRIBUTING.md has always
required before opening a PR — CI is the enforcement, the local run is still
expected first so you're not using CI as your first feedback loop.

## When to add more

Revisit this doc (don't silently start adding tools) when:
- **A real bug ships that a unit test would have caught** — add the test for
  that specific case, not a blanket new testing layer.
- **More than one person is actively contributing** — acceptance-criteria
  review starts needing the objectivity an automated E2E check gives you;
  that's the trigger for `playwright-cli`.
- **The ingestion pipeline goes live with real traffic** — that's the trigger
  for actually running a load test, not just having the tool available.
