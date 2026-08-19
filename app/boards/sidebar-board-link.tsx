"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SidebarBoardLink({ id, name }: { id: string; name: string }) {
  const pathname = usePathname();
  const active = pathname === `/boards/${id}`;

  return (
    <Link
      href={`/boards/${id}`}
      className={cn(
        "truncate rounded-lg px-2.5 py-1.5 text-[13.5px]",
        active ? "bg-accent-soft font-semibold text-accent" : "text-text-muted hover:bg-surface-2 hover:text-text"
      )}
    >
      {name}
    </Link>
  );
}
