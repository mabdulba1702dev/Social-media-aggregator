import { createClient } from "@supabase/supabase-js";
import { resolveProvider } from "../../lib/embed-providers/index.js";
import { hashUrl, normalizeUrl } from "../../lib/normalize-url.js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

// Service-role client: this worker acts on behalf of any board's connected
// source, not a single logged-in user, so it must bypass RLS. See CLAUDE.md's
// Supabase-access convention.
const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"));

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
 */
export async function handleIncomingMessage(message: IncomingMessage): Promise<void> {
  const { data: source, error: sourceError } = await supabase
    .from("sources")
    .select("id, board_id")
    .eq("platform", message.platform)
    .eq("external_group_id", message.externalGroupId)
    .eq("status", "active")
    .maybeSingle();

  if (sourceError) throw sourceError;
  if (!source) return; // not a connected source for any board — nothing to do

  const eventId = await recordEvent(source.id, message.rawMessageId);
  if (eventId === null) return; // unique violation — already processed, per idempotency guarantee

  const url = extractSupportedUrl(message.text);
  if (!url) {
    await markEvent(eventId, "ignored");
    return;
  }

  if (await isUrlBlocked(source.board_id, url)) {
    await markEvent(eventId, "ignored");
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
    await markEvent(eventId, "duplicate", existingPost.id);
    return;
  }

  const provider = resolveProvider(url);
  if (!provider) {
    // Extracted a URL, but no embed provider handles it yet — see
    // lib/embed-providers/README.md, this is expected until more providers
    // land (currently only YouTube is implemented).
    await markEvent(eventId, "ignored");
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

    await markEvent(eventId, "processed", post.id);
  } catch (err) {
    await markEvent(eventId, "failed", null, err instanceof Error ? err.message : String(err));
    throw err;
  }
}

/** Returns the new ingestion_events row's id, or null if it's a duplicate delivery. */
async function recordEvent(sourceId: string, rawMessageId: string): Promise<string | null> {
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

async function isUrlBlocked(boardId: string, url: string): Promise<boolean> {
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

async function markEvent(
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
