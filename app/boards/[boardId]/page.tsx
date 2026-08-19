import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddPostForm } from "./add-post-form";
import { PostCard } from "./post-card";

export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
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

  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("id, platform, embed_html, embed_thumbnail_url, caption, author_name, status, canonical_url")
    .eq("board_id", boardId)
    .order("created_at", { ascending: false });

  if (postsError) throw postsError;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{board.name}</h1>
        <Link href="/boards" className="text-sm text-accent underline">
          All boards
        </Link>
      </div>

      <AddPostForm boardId={board.id} />

      {posts.length === 0 ? (
        <p className="text-sm text-text-muted">
          No posts yet — paste a URL above to save your first one.
        </p>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}
