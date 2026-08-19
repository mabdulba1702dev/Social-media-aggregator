# Design System

Formalizes the tokens and components used in the UI mockup (`ui-mockup.html`, delivered earlier) into something implementable in Tailwind + shadcn/ui. Treat this as v1 — it should evolve once real embeds replace the mockup's placeholder blocks.

## Design Principles

1. **The embed is the content, the UI gets out of the way.** Cards, sidebar, and chrome stay neutral and low-contrast so the actual social post — which already has its own branding, colors, and photography — is what draws the eye.
2. **Masonry, not a rigid grid.** Embeds have wildly different natural aspect ratios (a tweet vs. a Reel vs. a YouTube thumbnail) — forcing them into uniform cells wastes space or crops content. Columns of variable-height cards (CSS multi-column in the mockup; a proper masonry lib or CSS grid with `grid-row: span` in production) instead.
3. **Platform identity via a small badge, not a full-bleed color.** Each platform gets a small colored square badge (initials) on the card header rather than tinting the whole card — keeps the grid calm even with eight+ platforms mixed together.

## Color Tokens

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--bg` | `#f6f5f3` | `#16151a` | Page background |
| `--surface` | `#ffffff` | `#1e1d23` | Cards, sidebar, topbar |
| `--surface-2` | `#fbfaf8` | `#232228` | Nested surfaces (search bar, embed body, inputs) |
| `--border` | `#e7e4de` | `#302f37` | Hairline borders |
| `--text` | `#201e1b` | `#efeeee` | Primary text |
| `--text-muted` | `#6f6a63` | `#a5a3ab` | Secondary text (metadata, counts) |
| `--text-faint` | `#a49e94` | `#706e78` | Tertiary text (placeholders, counts) |
| `--accent` | `#2f5d4f` | `#7fc4ab` | Primary actions, active states |
| `--accent-soft` | `#e4ede9` | `#22332c` | Active-state backgrounds, tag chips |

Deliberately warm-neutral rather than pure gray (`#f6f5f3` not `#f5f5f5`) — reads less "generic SaaS template," closer to the paper-like feel of Are.na/Raindrop, which were the explicit references for this layout direction.

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

System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, Helvetica, Arial, sans-serif`) — no webfont loading cost, and it matches the OS-native feel that fits a personal tool. Revisit if the product gets a real brand identity.

| Role | Size | Weight |
|---|---|---|
| Board title | 22px | 700 |
| Card author name | 13px | 600 |
| Body / caption | 13.5px | 400 |
| Metadata (counts, source line) | 11–12px | 400–500 |
| Sidebar section label | 11px, uppercase, tracked | 600 |

## Spacing & Shape

- Base spacing unit: **4px**, most gaps land on 6/9/10/14/18px in the mockup — keep to that rhythm rather than introducing new arbitrary values.
- Card radius: **14px**. Small controls (buttons, inputs, badges): **7–9px**. Chips/pills: fully rounded (`999px`).
- Shadow: a soft two-layer shadow (`0 1px 2px rgba(20,18,14,0.04), 0 6px 20px rgba(20,18,14,0.06)`) — barely-there in light mode, slightly stronger in dark mode to compensate for lower ambient contrast.

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
