/**
 * Placeholder landing page.
 *
 * Intentionally minimal — per the PRD, database schema and design system
 * were scoped out fully *before* feature code, so this page is just proof
 * the scaffold boots and is wired to Supabase. See docs/ui-mockup.html
 * (delivered alongside the PRD) for the intended board/feed UI, and
 * docs/PRD.md §13 for the build order (Phase 1 starts with manual URL add
 * + core platform embeds + personal boards).
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-2xl font-semibold">Social Post Boards</h1>
      <p className="max-w-md text-sm text-text-muted">
        Scaffold is running. Next step: build the board/feed UI from{" "}
        <code>docs/ui-mockup.html</code>, starting with Phase 1 in{" "}
        <code>docs/PRD.md</code>.
      </p>
    </main>
  );
}
