import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { SidebarBoardLink } from "./sidebar-board-link";

export default async function BoardsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: boards } = await supabase
    .from("boards")
    .select("id, name")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const initials =
    (user.user_metadata.full_name as string | undefined)
      ?.split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("") ?? user.email?.[0]?.toUpperCase();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col gap-6 border-r border-border bg-surface p-4">
        <Link href="/" className="flex items-center gap-2 px-1.5 py-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-sm font-bold text-bg">
            S
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Social Post Boards</span>
        </Link>

        <div className="flex flex-col gap-1">
          <span className="px-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-faint">Boards</span>
          {boards && boards.length > 0 ? (
            boards.map((board) => <SidebarBoardLink key={board.id} id={board.id} name={board.name} />)
          ) : (
            <span className="px-2.5 text-[13px] text-text-faint">No boards yet</span>
          )}
        </div>

        <Link
          href="/boards"
          className="mt-auto rounded-lg border border-dashed border-border px-3 py-2 text-center text-[13px] text-text-muted hover:border-accent hover:text-accent"
        >
          + New board
        </Link>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-surface px-6 py-3">
          <div className="ml-auto flex items-center gap-3">
            <form action="/auth/sign-out" method="post">
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">
              {initials}
            </span>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
