import Link from "next/link";
import { cn } from "@/lib/utils";

interface Tag {
  id: string;
  name: string;
}

function hrefFor(tagId: string | null, query: string): string {
  const params = new URLSearchParams();
  if (tagId) params.set("tag", tagId);
  if (query) params.set("q", query);
  const qs = params.toString();
  return qs ? `?${qs}` : ".";
}

export function TagFilterBar({
  tags,
  activeTagId,
  query,
}: {
  tags: Tag[];
  activeTagId: string | null;
  query: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={hrefFor(null, query)}
        className={cn(
          "rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150",
          activeTagId === null ? "bg-accent text-bg" : "bg-surface-2 text-text-muted hover:text-text"
        )}
      >
        All
      </Link>
      {tags.map((tag) => (
        <Link
          key={tag.id}
          href={hrefFor(tag.id, query)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150",
            activeTagId === tag.id ? "bg-accent text-bg" : "bg-surface-2 text-text-muted hover:text-text"
          )}
        >
          {tag.name}
        </Link>
      ))}
    </div>
  );
}
