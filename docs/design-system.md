# Design System

Formalizes the tokens and components implementable in Tailwind + shadcn/ui.

**2026-08-26: superseded by the "Modernist" system** (per [issue #28](https://github.com/mabdulba1702dev/Social-media-aggregator/issues/28) — flat, red accent, zero corner radius, Archivo type, grayscale photography), replacing the original warm-neutral/Are.na-inspired v1 below. Source of truth for exact values: `docs/Social media embed aggregator UI/_ds/modernist-e70b4432-9de9-4106-8989-9c2001eedd97/styles.css` and `readme.md` — this doc mirrors those values onto this app's actual token names (`app/globals.css`, `tailwind.config.ts`), it doesn't redefine them independently. Token-layer adoption (colors, radius, font) landed first; component-level changes (border *width*, shadow→divider elevation, platform badges vs. plain text tags) are a follow-up, not done yet — see "Not yet adopted" below.

## Design Principles

1. **The embed is the content, the UI gets out of the way.** Cards, sidebar, and chrome stay neutral and low-contrast so the actual social post — which already has its own branding, colors, and photography — is what draws the eye. (Carries over from v1, still true under Modernist.)
2. **Masonry, not a rigid grid.** Embeds have wildly different natural aspect ratios (a tweet vs. a Reel vs. a YouTube thumbnail) — forcing them into uniform cells wastes space or crops content. CSS multi-column, variable-height cards.
3. **Let the grid show.** Modernist's own principle, replacing v1's "badge not full-bleed color": equal-width cells, strong horizontal/vertical rhythm, visible structure — alignment and dividers organize the page, not color or shadow.

## Color Tokens

Values copied directly from the Modernist system's `styles.css` (not approximated), mapped onto this app's existing token names so component code (`bg-surface`, `text-text-muted`, etc.) didn't need to change:

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--bg` | `#f3f2f2` | `#1c1a1a` | Page background |
| `--surface` | `#eae9e9` | `#272424` | Cards, sidebar, topbar |
| `--surface-2` | `#f8f4f4` | `#2d2b2b` | Nested surfaces (search bar, embed body, inputs) — mapped to Modernist's `--color-neutral-100` |
| `--border` | `#d7d3d3` | `#605d5d` | Borders — mapped to `--color-neutral-300`; Modernist's own divider color is a translucent `color-mix()` meant for *strong 2px* rules, not thin 1px borders at existing component widths, so a solid neutral was used instead for this token-only pass. Widening borders to 2px to match Modernist properly is a follow-up, not done yet. |
| `--text` | `#201e1d` | `#f3f2f2` | Primary text |
| `--text-muted` | `#7d7979` | `#bab6b6` | Secondary text — `--color-neutral-600` |
| `--text-faint` | `#9b9797` | `#9b9797` | Tertiary text — `--color-neutral-500` (same value both modes, per Modernist's own OKLCH ramp) |
| `--accent` | `#ec3013` | `#ff563c` | Primary actions, active states — base accent light, `--color-accent-500` (lighter/more visible) on dark ground |
| `--accent-soft` | `#fff2ef` | `#4d170e` | Tag chips, active-state backgrounds — `--color-accent-100` light, `--color-accent-900` dark |

Full accent ramp (100–900) is defined in the Modernist stylesheet if a future component needs an intermediate step not covered by the two tokens above — see that file directly rather than guessing an interpolated value.

**Platform badge colors** (functional, not brand-accurate reproductions — close enough to be instantly recognizable without using actual trademarked logos):

| Platform | Color |
|---|---|
| Instagram | `#d6249f` |
| X | `#111111` |
| TikTok | `#00d8c6` |
| YouTube | `#ff0000` |
| Facebook | `#1877f2` |
| Reddit | `#ff4500` |
| Threads | `#000000` |
| Pinterest | `#e60023` |

Add LinkedIn (`#0a66c2`) and Bluesky (`#1185fe`) when those platforms come online per the PRD roadmap. **Open question, not decided:** the Modernist mockup itself uses plain text tags for platform identity, not colored logo badges — whether the real brand-logo badges (shipped 2026-08-20) survive the redesign is one of the explicit open items in issue #28, not resolved by this token-layer pass.

**Platform badge colors** (functional, not brand-accurate reproductions — close enough to be instantly recognizable without using actual trademarked logos):

| Platform | Color |
|---|---|
| Instagram | `#d6249f` |
| X | `#111111` |
| TikTok | `#00d8c6` |
| YouTube | `#ff0000` |
| Facebook | `#1877f2` |
| Reddit | `#ff4500` |
| Threads | `#000000` |
| Pinterest | `#e60023` |

Add LinkedIn (`#0a66c2`) and Bluesky (`#1185fe`) when those platforms come online per the PRD roadmap.

## Typography

**Archivo** for both heading and body (Modernist's `--font-heading`/`--font-body` both resolve to it), loaded via `next/font/google` in `app/layout.tsx` — self-hosted at build time, no external request or layout shift, unlike a raw Google Fonts `<link>`. This replaces v1's system-font-stack choice (which was deliberately webfont-free) — a real, deliberate cost tradeoff, not an oversight: Modernist's identity depends on a specific typeface, v1's didn't need one.

| Role | Size | Weight |
|---|---|---|
| Board title | 22px | 700 |
| Card author name | 13px | 600 |
| Body / caption | 13.5px | 400 |
| Metadata (counts, source line) | 11–12px | 400–500 |
| Sidebar section label | 11px, uppercase, tracked | 600 |

## Spacing & Shape

- Base spacing unit: **4px** — carries over from v1, Modernist doesn't prescribe a different rhythm.
- **Radius: zero, everywhere, on purpose.** `tailwind.config.ts`'s `borderRadius` overrides Tailwind's default `sm`/`DEFAULT`/`md`/`lg` scale to `0px` (not just the app's own `card` token) so shadcn primitives (button, input, dialog) honor this without per-component edits. **Exception: `rounded-full` is untouched** — true circles (avatars, status dots) aren't "rounded corners" in the sense Modernist's "don't round a corner" rule means, and the mockup itself keeps small circular elements.
- **Shadow → divider, not yet migrated.** Modernist's actual elevation model is strong 2px dividers between sections, not soft shadows — v1's soft two-layer shadow is still what's implemented on cards today (`shadow-sm` from Tailwind's defaults). Replacing shadow-based elevation with Modernist's divider model is component-level work, not done in the token-only pass — tracked under issue #28.

## Component Inventory

Components to build first, in dependency order (also maps to a sensible order for 21st.dev/shadcn component pulls per `setup-guide.md` §7):

1. **Badge** (platform initials) — simplest, everything else depends on it.
2. **Button** (primary/secondary variants — seen as "+ Add URL" and modal actions).
3. **Input / Select** — used in the Add URL modal and search bar.
4. **Sidebar nav item** (default/hover/active states, optional trailing count).
5. **Tag chip**.
6. **Post card** — composed of Badge + header row + embed body slot + caption + footer stats + tag chips. The embed body slot is where the real oEmbed/iframe content mounts in production; the mockup uses gradient placeholders standing in for that.
7. **Modal** (overlay + panel) — Add URL flow first, reused later for board settings/sharing.
8. **Topbar** (search + actions + avatar).

## States to Design For (not yet in the mockup)

- **Empty board** (no posts yet — first-run state, should point at both "paste a URL" and "connect a group").
- **Loading card** (skeleton while an embed fetches).
- **Unavailable post** (source deleted/private — PRD §9.4's fallback badge state).
- **X/Twitter fallback preview card** (per PRD §8, this will get real use, not just theoretical — design it as a first-class state, not an afterthought).

## Dark Mode

Implemented via a `data-theme` attribute + CSS custom properties in the mockup (toggle button flips it). In production, prefer syncing to `prefers-color-scheme` by default with a manual override stored per-user, rather than only a manual toggle.
