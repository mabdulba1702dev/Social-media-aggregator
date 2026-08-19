import { PlatformBadge } from "@/components/platform-badge";
import type { Platform } from "@/lib/embed-providers/types";

interface Post {
  id: string;
  platform: Platform;
  embed_html: string | null;
  embed_thumbnail_url: string | null;
  caption: string | null;
  author_name: string | null;
  status: string;
  canonical_url: string;
}

export function PostCard({ post }: { post: Post }) {
  return (
    <div className="mb-4 break-inside-avoid overflow-hidden rounded-card border border-border bg-surface shadow-sm">
      <div className="flex items-center gap-2 border-b border-border p-3">
        <PlatformBadge platform={post.platform} />
        {post.author_name && (
          <span className="truncate text-[13px] font-semibold text-text">{post.author_name}</span>
        )}
      </div>

      {post.status === "active" && post.embed_html ? (
        // embed_html only ever comes from our own server-side oEmbed fetch
        // (lib/embed-providers/*), never from user-supplied input — safe to render.
        <div className="embed-body" dangerouslySetInnerHTML={{ __html: post.embed_html }} />
      ) : (
        <a
          href={post.canonical_url}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col gap-2 p-4 text-sm text-text-muted hover:underline"
        >
          {post.embed_thumbnail_url && (
            // eslint-disable-next-line @next/next/no-img-element -- external, per-provider domains; not worth a remotePatterns entry per platform
            <img src={post.embed_thumbnail_url} alt="" className="rounded-md" />
          )}
          <span>Preview unavailable — open on {post.platform}</span>
        </a>
      )}

      {post.caption && <p className="p-3 text-[13.5px] text-text">{post.caption}</p>}
    </div>
  );
}
