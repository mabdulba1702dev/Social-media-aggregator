import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Hero } from "@/components/hero";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen">
        <Hero />
      </main>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();
  const displayName = profile?.display_name ?? user.email ?? null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Social Post Boards</h1>
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
    </main>
  );
}
