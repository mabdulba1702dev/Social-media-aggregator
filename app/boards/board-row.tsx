"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { renameBoard, deleteBoard } from "./actions";

export function BoardRow({ id, name }: { id: string; name: string }) {
  const [value, setValue] = useState(name);
  const [isPending, startTransition] = useTransition();

  const dirty = value.trim() !== name && value.trim().length > 0;

  return (
    <li className="flex items-center gap-2 rounded-md border border-border bg-surface p-3">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={isPending}
        className="flex-1"
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
