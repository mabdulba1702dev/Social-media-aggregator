"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addPost } from "./actions";

export function AddPostForm({ boardId }: { boardId: string }) {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await addPost(boardId, url);

      switch (result.status) {
        case "ok":
          setUrl("");
          break;
        case "duplicate":
          setMessage("Already saved to this board.");
          break;
        case "unsupported":
          setMessage(
            "That link isn't from a supported platform yet, or isn't a direct post/video link (e.g. a profile or homepage URL won't work)."
          );
          break;
        case "error":
          setMessage(result.message);
          break;
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-card border border-border bg-surface p-3 shadow-sm"
    >
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a YouTube, Instagram, X, TikTok, Reddit, Pinterest, Facebook, or Threads link"
          disabled={isPending}
          className="flex-1 border-transparent bg-surface-2 focus-visible:border-accent"
        />
        <Button type="submit" disabled={isPending || !url.trim()} className="shrink-0 px-5 font-semibold">
          {isPending ? "Adding…" : "+ Add URL"}
        </Button>
      </div>
      {message && <p className="px-1 text-sm text-text-muted">{message}</p>}
    </form>
  );
}
