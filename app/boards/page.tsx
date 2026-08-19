import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBoard } from "./actions";
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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Your boards</h1>

      <form action={createBoard} className="flex gap-2">
        <Input name="name" placeholder="New board name" required className="flex-1" />
        <Button type="submit">Create</Button>
      </form>

      {boards.length === 0 ? (
        <p className="text-sm text-text-muted">
          No boards yet — create one above to start saving posts.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {boards.map((board) => (
            <BoardRow key={board.id} id={board.id} name={board.name} />
          ))}
        </ul>
      )}
    </main>
  );
}
