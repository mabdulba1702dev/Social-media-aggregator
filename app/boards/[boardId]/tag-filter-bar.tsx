import Link from "next/link";
import { cn } from "@/lib/utils";

interface Tag {
  id: string;
  name: string;
}

export function TagFilterBar({ tags, activeTagId }: { tags: Tag[]; activeTagId: string | null }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="."
        className={cn(
          "rounded-full px-3 py-1 text-xs font-medium",
          activeTagId === null ? "bg-accent text-bg" : "bg-surface-2 text-text-muted hover:text-text"
        )}
      >
        All
      </Link>
      {tags.map((tag) => (
        <Link
          key={tag.id}
          href={`?tag=${tag.id}`}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            activeTagId === tag.id ? "bg-accent text-bg" : "bg-surface-2 text-text-muted hover:text-text"
          )}
        >
          {tag.name}
        </Link>
      ))}
    </div>
  );
}
