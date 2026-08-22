import { createClient } from "@/lib/supabase/server";
import { PlatformBadge } from "@/components/platform-badge";
import { EmbedHtml } from "@/components/embed-html";
import { LazyMount } from "@/components/lazy-mount";
import type { Platform } from "@/lib/embed-providers/types";

interface FeaturedPost {
  id: string;
  platform: Platform;
  embed_html: string | null;
  embed_thumbnail_url: string | null;
  caption: string | null;
  author_name: string | null;
  canonical_url: string;
}

// Curated real posts, not screenshots — saved through the same oEmbed
// pipeline as everything else, into a real `visibility: 'public'` board
// (slug 'featured') any signed-out visitor's RLS session can already read.
// No live "trending API" involved — see notes/ui-scalability-scope.md.
export async function FeaturedPosts() {
  const supabase = await createClient();

  const { data: board } = await supabase.from("boards").select("id").eq("slug", "featured").maybeSingle();
  if (!board) return null;

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, platform, embed_html, embed_thumbnail_url, caption, author_name, canonical_url")
    .eq("board_id", board.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .returns<FeaturedPost[]>();

  if (error || !posts || posts.length === 0) return null;

  return (
    <section className="px-8 pb-20">
      <h2 className="mb-6 text-center text-[13px] font-semibold uppercase tracking-wide text-text-muted">
        Real posts, really embedded
      </h2>
      <div className="mx-auto max-w-5xl columns-1 gap-4 sm:columns-2 lg:columns-3">
        {posts.map((post) => (
          <div
            key={post.id}
            className="mb-4 break-inside-avoid overflow-hidden rounded-card border border-border bg-surface shadow-sm"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border p-3">
              <div className="flex min-w-0 items-center gap-2">
                <PlatformBadge platform={post.platform} />
                {post.author_name && (
                  <span className="truncate text-[13px] font-semibold text-text">{post.author_name}</span>
                )}
              </div>
              <a
                href={post.canonical_url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-[11.5px] text-text-muted transition-colors duration-150 hover:text-text"
              >
                View original
              </a>
            </div>

            {/* embed_html only ever comes from our own server-side oEmbed fetch
                (lib/embed-providers/*) — safe to render. */}
            {post.embed_html ? (
              <LazyMount>
                <EmbedHtml html={post.embed_html} className="embed-body" />
              </LazyMount>
            ) : (
              post.embed_thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element -- external, per-provider domains
                <img src={post.embed_thumbnail_url} alt="" loading="lazy" className="w-full" />
              )
            )}

            {post.caption && <p className="p-3 text-[13.5px] text-text">{post.caption}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
