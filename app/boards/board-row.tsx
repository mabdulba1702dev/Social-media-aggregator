"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { renameBoard, deleteBoard } from "./actions";

export function BoardRow({ id, name }: { id: string; name: string }) {
  const [value, setValue] = useState(name);
  const [isPending, startTransition] = useTransition();

  const dirty = value.trim() !== name && value.trim().length > 0;

  return (
    <li className="flex items-center gap-3 rounded-card border border-border bg-surface p-3 shadow-sm">
      <Link
        href={`/boards/${id}`}
        className="flex-1 truncate text-[14px] font-semibold text-text hover:text-accent hover:underline"
      >
        {name}
      </Link>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={isPending}
        placeholder="Rename…"
        className="w-40"
      />
      <Button
        variant="outline"
        size="sm"
        disabled={!dirty || isPending}
        onClick={() => startTransition(() => renameBoard(id, value))}
      >
        Save
      </Button>
      <Button
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={() => {
          if (confirm(`Delete "${name}"? This can't be undone.`)) {
            startTransition(() => deleteBoard(id));
          }
        }}
      >
        Delete
      </Button>
    </li>
  );
}
