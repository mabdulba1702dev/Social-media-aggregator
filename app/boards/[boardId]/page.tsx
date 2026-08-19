import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddPostForm } from "./add-post-form";
import { PostCard } from "./post-card";
import { TagFilterBar } from "./tag-filter-bar";
import type { Platform } from "@/lib/embed-providers/types";

interface RawPost {
  id: string;
  board_id: string;
  platform: string;
  embed_html: string | null;
  embed_thumbnail_url: string | null;
  caption: string | null;
  author_name: string | null;
  status: string;
  canonical_url: string;
  post_tags: { tags: { id: string; name: string } | null }[];
}

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ boardId: string }>;
  searchParams: Promise<{ tag?: string }>;
}) {
  const { boardId } = await params;
  const { tag: activeTagId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: board, error: boardError } = await supabase
    .from("boards")
    .select("id, name")
    .eq("id", boardId)
    .single();

  if (boardError || !board) notFound();

  const { data: rawPosts, error: postsError } = await supabase
    .from("posts")
    .select(
      "id, board_id, platform, embed_html, embed_thumbnail_url, caption, author_name, status, canonical_url, post_tags(tags(id, name))"
    )
    .eq("board_id", boardId)
    .order("created_at", { ascending: false })
    .returns<RawPost[]>();

  if (postsError) throw postsError;

  const posts = rawPosts.map((post) => ({
    ...post,
    // platform is a Postgres check constraint — guaranteed to be one of the
    // known values, so this narrows a genuinely safe cast, not a blind one.
    platform: post.platform as Platform,
    tags: post.post_tags.map((pt) => pt.tags).filter((t): t is { id: string; name: string } => t !== null),
  }));

  const allTags = new Map<string, string>();
  for (const post of posts) {
    for (const tag of post.tags) allTags.set(tag.id, tag.name);
  }

  const visiblePosts = activeTagId
    ? posts.filter((post) => post.tags.some((tag) => tag.id === activeTagId))
    : posts;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{board.name}</h1>
        <Link href="/boards" className="text-sm text-accent underline">
          All boards
        </Link>
      </div>

      <AddPostForm boardId={board.id} />

      {allTags.size > 0 && (
        <TagFilterBar
          tags={[...allTags.entries()].map(([id, name]) => ({ id, name }))}
          activeTagId={activeTagId ?? null}
        />
      )}

      {visiblePosts.length === 0 ? (
        <p className="text-sm text-text-muted">
          {posts.length === 0
            ? "No posts yet — paste a URL above to save your first one."
            : "No posts with this tag."}
        </p>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {visiblePosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}
