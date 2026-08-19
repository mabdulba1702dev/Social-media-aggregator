"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";

const MAX_SLUG_ATTEMPTS = 5;

export async function createBoard(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const baseSlug = slugify(name);

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${randomBytes(2).toString("hex")}`;

    const { data: board, error } = await supabase
      .from("boards")
      .insert({ owner_id: user.id, name, slug })
      .select("id")
      .single();

    if (!error) {
      // Mirrors boards.owner_id into board_members for uniform permission
      // checks — see docs/database-schema.md's board_members section.
      await supabase
        .from("board_members")
        .insert({ board_id: board.id, user_id: user.id, role: "owner", accepted_at: new Date().toISOString() });

      revalidatePath("/boards");
      return;
    }

    if (error.code !== "23505") throw error; // anything but a slug collision is unexpected
  }

  throw new Error(`Could not generate a unique slug for "${name}" after ${MAX_SLUG_ATTEMPTS} attempts`);
}

export async function renameBoard(boardId: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;

  const supabase = await createClient();
  const { error } = await supabase.from("boards").update({ name: trimmed }).eq("id", boardId);
  if (error) throw error;

  revalidatePath("/boards");
}

export async function deleteBoard(boardId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("boards").delete().eq("id", boardId);
  if (error) throw error;

  revalidatePath("/boards");
}
