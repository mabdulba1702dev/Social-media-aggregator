"use client";

import { useState, useTransition, type FormEvent } from "react";
import { addTag, removeTag } from "./actions";

interface Tag {
  id: string;
  name: string;
}

export function PostTags({ postId, boardId, tags }: { postId: string; boardId: string; tags: Tag[] }) {
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    const name = input.trim();
    if (!name) return;
    setInput("");
    startTransition(async () => {
      await addTag(postId, boardId, name);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-3 pt-0">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent"
        >
          {tag.name}
          <button
            type="button"
            aria-label={`Remove tag ${tag.name}`}
            disabled={isPending}
            onClick={() => startTransition(() => removeTag(postId, tag.id, boardId))}
            className="leading-none text-accent/70 hover:text-accent"
          >
            ×
          </button>
        </span>
      ))}
      <form onSubmit={handleAdd}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="+ tag"
          disabled={isPending}
          className="w-16 border-none bg-transparent text-xs text-text-muted placeholder:text-text-faint focus:w-24 focus:outline-none"
        />
      </form>
    </div>
  );
}
