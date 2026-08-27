import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveProvider } from "../embed-providers";
import { hashUrl, normalizeUrl } from "../normalize-url";

const URL_PATTERN = /https?:\/\/\S+/g;

export interface IncomingMessage {
  platform: "telegram" | "discord" | "whatsapp";
  externalGroupId: string;
  rawMessageId: string;
  text: string;
}

type EventStatus = "processed" | "duplicate" | "ignored" | "failed";

/**
 * The one ingestion pipeline every platform funnels into — see the
 * add-ingestion-source skill for the exact 8-step shape this follows.
 * Takes a Supabase client rather than constructing its own, so both the
 * Telegram webhook route (Next.js app, lib/supabase/server.ts's
 * createServiceRoleClient()) and the WhatsApp/Discord worker (its own
 * plain service-role client) share this exact logic instead of two copies.
 */
export async function handleIncomingMessage(
  supabase: SupabaseClient,
  message: IncomingMessage
): Promise<void> {
  const { data: source, error: sourceError } = await supabase
    .from("sources")
    .select("id, board_id")
    .eq("platform", message.platform)
    .eq("external_group_id", message.externalGroupId)
    .eq("status", "active")
    .maybeSingle();

  if (sourceError) throw sourceError;
  if (!source) {
    // Not a connected source for any board. This is the only place a board
    // owner can currently discover the raw ID they need to paste into the
    // connect-a-group modal (see GitHub issue #20) — log it plainly rather
    // than silently dropping the message.
    console.log(`[ingestion] no connected source — platform=${message.platform} externalGroupId=${message.externalGroupId}`);
    return;
  }

  const eventId = await recordEvent(supabase, source.id, message.rawMessageId);
  if (eventId === null) return; // unique violation — already processed, per idempotency guarantee

  const url = extractSupportedUrl(message.text);
  if (!url) {
    await markEvent(supabase, eventId, "ignored");
    return;
  }

  if (await isUrlBlocked(supabase, source.board_id, url)) {
    await markEvent(supabase, eventId, "ignored");
    return;
  }

  const urlHash = hashUrl(url);
  const { data: existingPost, error: existingPostError } = await supabase
    .from("posts")
    .select("id")
    .eq("board_id", source.board_id)
    .eq("url_hash", urlHash)
    .maybeSingle();

  if (existingPostError) throw existingPostError;
  if (existingPost) {
    await touchSourceLastEvent(supabase, source.id);
    await markEvent(supabase, eventId, "duplicate", existingPost.id);
    return;
  }

  const provider = resolveProvider(url);
  if (!provider) {
    // Extracted a URL, but no embed provider handles it yet — see
    // lib/embed-providers/README.md.
    await markEvent(supabase, eventId, "ignored");
    return;
  }

  try {
    const embed = await provider.fetchEmbed(url);

    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        board_id: source.board_id,
        canonical_url: normalizeUrl(url),
        url_hash: urlHash,
        platform: provider.platform,
        embed_html: embed.embedHtml,
        embed_thumbnail_url: embed.embedThumbnailUrl,
        caption: embed.caption,
        author_name: embed.authorName,
        author_handle: embed.authorHandle,
        source_type: message.platform,
        source_id: source.id,
        status: embed.status === "ok" ? "active" : "unavailable",
      })
      .select("id")
      .single();

    if (postError) throw postError;

    await touchSourceLastEvent(supabase, source.id);
    await markEvent(supabase, eventId, "processed", post.id);
  } catch (err) {
    await markEvent(supabase, eventId, "failed", null, err instanceof Error ? err.message : String(err));
    throw err;
  }
}

/** Returns the new ingestion_events row's id, or null if it's a duplicate delivery. */
async function recordEvent(
  supabase: SupabaseClient,
  sourceId: string,
  rawMessageId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("ingestion_events")
    .insert({ source_id: sourceId, raw_message_id: rawMessageId })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return null; // unique(source_id, raw_message_id) violation
    throw error;
  }

  return data.id;
}

function extractSupportedUrl(text: string): string | null {
  const matches = text.match(URL_PATTERN) ?? [];
  const cleaned = matches.map((match) => match.replace(/[),.!?;:'"]+$/, ""));
  return cleaned.find((candidate) => resolveProvider(candidate) !== null) ?? null;
}

async function isUrlBlocked(supabase: SupabaseClient, boardId: string, url: string): Promise<boolean> {
  const { data: rules, error } = await supabase
    .from("blocklist_rules")
    .select("rule_type, value")
    .eq("board_id", boardId);

  if (error) throw error;
  if (!rules || rules.length === 0) return false;

  const host = new URL(url).hostname.toLowerCase();
  return rules.some((rule) =>
    rule.rule_type === "domain"
      ? host.includes(rule.value.toLowerCase())
      : url.toLowerCase().includes(rule.value.toLowerCase())
  );
}

/** Records that a real link (new or duplicate) came through this source — drives the Sources UI's "last link" display. */
async function touchSourceLastEvent(supabase: SupabaseClient, sourceId: string): Promise<void> {
  const { error } = await supabase
    .from("sources")
    .update({ last_event_at: new Date().toISOString() })
    .eq("id", sourceId);

  if (error) throw error;
}

async function markEvent(
  supabase: SupabaseClient,
  eventId: string,
  status: EventStatus,
  postId?: string | null,
  error?: string
): Promise<void> {
  const { error: updateError } = await supabase
    .from("ingestion_events")
    .update({
      status,
      post_id: postId ?? null,
      error: error ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq("id", eventId);

  if (updateError) throw updateError;
}
