import { cn } from "@/lib/utils";
import type { Platform } from "@/lib/embed-providers/types";

const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "IG",
  x: "X",
  tiktok: "TT",
  youtube: "YT",
  facebook: "FB",
  reddit: "RD",
  threads: "TH",
  pinterest: "PN",
  linkedin: "LI",
  bluesky: "BS",
  other: "?",
};

// Literal class names (not template-built) so Tailwind's content scanner
// picks them up — see tailwind.config.ts's `platform` color group.
const PLATFORM_BG: Record<Platform, string> = {
  instagram: "bg-platform-instagram",
  x: "bg-platform-x",
  tiktok: "bg-platform-tiktok",
  youtube: "bg-platform-youtube",
  facebook: "bg-platform-facebook",
  reddit: "bg-platform-reddit",
  threads: "bg-platform-threads",
  pinterest: "bg-platform-pinterest",
  linkedin: "bg-platform-linkedin",
  bluesky: "bg-platform-bluesky",
  other: "bg-text-faint",
};

export function PlatformBadge({ platform, className }: { platform: Platform; className?: string }) {
  return (
    <span
      title={platform}
      className={cn(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] text-[10px] font-semibold text-white",
        PLATFORM_BG[platform],
        className
      )}
    >
      {PLATFORM_LABEL[platform]}
    </span>
  );
}
