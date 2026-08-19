"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBoard } from "./actions";

export function CreateBoardForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitCount, formAction, isPending] = useActionState(async (prev: number, formData: FormData) => {
    await createBoard(formData);
    return prev + 1;
  }, 0);

  // Clears the input once a submission actually completes — also means a
  // rapid double-click can't fire two inserts, since the button is disabled
  // for the whole pending window, not just until the click handler returns.
  useEffect(() => {
    if (submitCount > 0) formRef.current?.reset();
  }, [submitCount]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex gap-2 rounded-card border border-border bg-surface p-3 shadow-sm"
    >
      <Input
        name="name"
        placeholder="New board name"
        required
        disabled={isPending}
        className="flex-1 border-transparent bg-surface-2 focus-visible:border-accent"
      />
      <Button type="submit" disabled={isPending} className="shrink-0 px-5 font-semibold">
        {isPending ? "Creating…" : "+ Create"}
      </Button>
    </form>
  );
}
