# Embed Providers

Empty on purpose — this is where each platform's embed-fetching logic lands, one file per platform (`instagram.ts`, `x.ts`, `tiktok.ts`, …), behind a shared interface. See the `add-embed-provider` skill in `.claude/skills/` for the exact steps when you're ready to implement the first one, and `docs/PRD.md` §8 for the per-platform embed method/cost/risk notes that should inform each provider's implementation (especially the X fallback-to-preview-card behavior).
