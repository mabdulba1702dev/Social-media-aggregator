import Link from "next/link";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/platform-badge";
import type { Platform } from "@/lib/embed-providers/types";

const SHOWCASE_PLATFORMS: Platform[] = [
  "instagram",
  "x",
  "tiktok",
  "youtube",
  "reddit",
  "pinterest",
  "facebook",
  "threads",
  "bluesky",
];

export function Hero() {
  return (
    <section className="flex flex-col items-center gap-6 px-8 py-20 text-center">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-[12.5px] font-medium text-accent">
        <Bookmark className="h-3.5 w-3.5" />
        Bookmark posts, not links
      </span>

      <h1 className="max-w-xl text-[32px] font-bold leading-tight tracking-tight text-text sm:text-[40px]">
        Save the post, not a dead link
      </h1>

      <p className="max-w-md text-[15px] leading-relaxed text-text-muted">
        Paste a URL from any platform and it renders as a live, playable embed — organized
        into boards, tagged, searchable. Or connect a group chat and let it fill in
        automatically.
      </p>

      <Button asChild size="lg" className="px-6 font-semibold">
        <Link href="/login">Continue with Google</Link>
      </Button>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        {SHOWCASE_PLATFORMS.map((platform) => (
          <PlatformBadge key={platform} platform={platform} className="h-8 w-8 rounded-[9px]" />
        ))}
      </div>
    </section>
  );
}
