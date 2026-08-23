"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SourcePlatform = "telegram" | "discord" | "whatsapp";
export type SourceStatus = "active" | "paused" | "error";

export type ConnectSourceResult =
  | { status: "ok" }
  | { status: "duplicate" }
  | { status: "error"; message: string };

export async function connectSource(
  boardId: string,
  platform: SourcePlatform,
  externalGroupId: string,
  displayName: string
): Promise<ConnectSourceResult> {
  const trimmedId = externalGroupId.trim();
  if (!trimmedId) return { status: "error", message: "Group/channel ID can't be empty." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not signed in." };

  const { error } = await supabase.from("sources").insert({
    board_id: boardId,
    platform,
    external_group_id: trimmedId,
    display_name: displayName.trim() || null,
    connected_by: user.id,
  });

  if (error) {
    // unique(platform, external_group_id) — this exact group is already
    // connected to some board (this one or another one).
    if (error.code === "23505") return { status: "duplicate" };
    return { status: "error", message: error.message };
  }

  revalidatePath(`/boards/${boardId}/sources`);
  return { status: "ok" };
}

export async function renameSource(sourceId: string, boardId: string, displayName: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sources")
    .update({ display_name: displayName.trim() || null })
    .eq("id", sourceId);
  if (error) throw error;
  revalidatePath(`/boards/${boardId}/sources`);
}

export async function setSourceStatus(sourceId: string, boardId: string, status: "active" | "paused"): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("sources").update({ status }).eq("id", sourceId);
  if (error) throw error;
  revalidatePath(`/boards/${boardId}/sources`);
}

export async function disconnectSource(sourceId: string, boardId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("sources").delete().eq("id", sourceId);
  if (error) throw error;
  revalidatePath(`/boards/${boardId}/sources`);
}
