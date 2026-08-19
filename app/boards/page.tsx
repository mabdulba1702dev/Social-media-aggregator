import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateBoardForm } from "./create-board-form";
import { BoardRow } from "./board-row";

export default async function BoardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: boards, error } = await supabase
    .from("boards")
    .select("id, name")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">
        {boards.length === 0 ? "Create your first board" : "Manage boards"}
      </h1>

      <CreateBoardForm />

      {boards.length === 0 ? (
        <p className="text-sm text-text-muted">
          A board holds your saved posts — create one to get started. Once you have boards, they&apos;ll
          show up in the sidebar for quick access.
        </p>
      ) : (
        <>
          <p className="text-sm text-text-muted">
            Rename or delete a board here. Click a board in the sidebar to open it and start saving
            posts.
          </p>
          <ul className="flex flex-col gap-2">
            {boards.map((board) => (
              <BoardRow key={board.id} id={board.id} name={board.name} />
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
