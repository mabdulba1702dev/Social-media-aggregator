import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    displayName = profile?.display_name ?? user.email ?? null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Social Post Boards</h1>
      <p className="max-w-md text-sm text-text-muted">
        Scaffold is running. Next step: build the board/feed UI from{" "}
        <code>docs/ui-mockup.html</code>, starting with Phase 1 in{" "}
        <code>docs/PRD.md</code>.
      </p>

      {user ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-text">
            Signed in as <span className="font-medium">{displayName}</span>
          </p>
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link href="/boards">Your boards</Link>
            </Button>
            <form action="/auth/sign-out" method="post">
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      )}
    </main>
  );
}
