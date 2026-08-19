"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hashUrl, normalizeUrl } from "@/lib/normalize-url";
import { resolveProvider } from "@/lib/embed-providers";

export type AddPostResult =
  | { status: "ok" }
  | { status: "duplicate" }
  | { status: "unsupported" }
  | { status: "error"; message: string };

export async function addPost(boardId: string, rawUrl: string): Promise<AddPostResult> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { status: "error", message: "That doesn't look like a valid URL." };
  }

  const provider = resolveProvider(parsed.toString());
  if (!provider) {
    return { status: "unsupported" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not signed in." };

  const urlHash = hashUrl(parsed.toString());

  const { data: existing, error: existingError } = await supabase
    .from("posts")
    .select("id")
    .eq("board_id", boardId)
    .eq("url_hash", urlHash)
    .maybeSingle();

  if (existingError) return { status: "error", message: existingError.message };
  if (existing) return { status: "duplicate" };

  const embed = await provider.fetchEmbed(parsed.toString());

  const { error: insertError } = await supabase.from("posts").insert({
    board_id: boardId,
    canonical_url: normalizeUrl(parsed.toString()),
    url_hash: urlHash,
    platform: provider.platform,
    embed_html: embed.embedHtml,
    embed_thumbnail_url: embed.embedThumbnailUrl,
    caption: embed.caption,
    author_name: embed.authorName,
    author_handle: embed.authorHandle,
    source_type: "manual",
    added_by: user.id,
    status: embed.status === "ok" ? "active" : "unavailable",
  });

  if (insertError) return { status: "error", message: insertError.message };

  revalidatePath(`/boards/${boardId}`);
  return { status: "ok" };
}

export type AddTagResult = { status: "ok" } | { status: "error"; message: string };

export async function addTag(postId: string, boardId: string, tagName: string): Promise<AddTagResult> {
  const trimmed = tagName.trim();
  if (!trimmed) return { status: "error", message: "Tag name can't be empty." };

  const supabase = await createClient();

  const { data: tag, error: tagError } = await supabase
    .from("tags")
    .upsert({ board_id: boardId, name: trimmed }, { onConflict: "board_id,name" })
    .select("id")
    .single();

  if (tagError) return { status: "error", message: tagError.message };

  const { error: linkError } = await supabase
    .from("post_tags")
    .upsert({ post_id: postId, tag_id: tag.id }, { onConflict: "post_id,tag_id" });

  if (linkError) return { status: "error", message: linkError.message };

  revalidatePath(`/boards/${boardId}`);
  return { status: "ok" };
}

export async function removeTag(postId: string, tagId: string, boardId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("post_tags").delete().eq("post_id", postId).eq("tag_id", tagId);
  if (error) throw error;

  revalidatePath(`/boards/${boardId}`);
}
