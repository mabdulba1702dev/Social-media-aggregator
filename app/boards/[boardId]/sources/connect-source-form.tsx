"use client";

import { useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { connectSource, type SourcePlatform } from "./actions";

const PLATFORM_HELP: Record<SourcePlatform, string> = {
  telegram:
    "Add the bot to the group with privacy mode disabled (BotFather → /setprivacy → Disable), then send any message in it. The group's chat ID — a negative number like -1001234567890 — shows up in the bot's webhook logs the first time a message from an unconnected group arrives.",
  discord:
    "Enable Developer Mode (Discord Settings → Advanced), then right-click the channel you want watched and Copy Channel ID.",
  whatsapp:
    "The dedicated WhatsApp number logs the group's JID (ending in @g.us) to the worker's console the first time it sees a message from a group it isn't connected to yet.",
};

const PLATFORM_PLACEHOLDER: Record<SourcePlatform, string> = {
  telegram: "-1001234567890",
  discord: "1234567890123456789",
  whatsapp: "1234567890-1234567890@g.us",
};

export function ConnectSourceForm({ boardId }: { boardId: string }) {
  const [platform, setPlatform] = useState<SourcePlatform>("telegram");
  const [externalGroupId, setExternalGroupId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePlatformChange(event: ChangeEvent<HTMLSelectElement>) {
    setPlatform(event.target.value as SourcePlatform);
    setExternalGroupId("");
    setMessage(null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await connectSource(boardId, platform, externalGroupId, displayName);
      switch (result.status) {
        case "ok":
          setExternalGroupId("");
          setDisplayName("");
          setMessage("Connected — new links from this group will start appearing here.");
          break;
        case "duplicate":
          setMessage("That group is already connected to a board.");
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
      className="flex max-w-lg flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-sm"
    >
      <h2 className="text-[15px] font-semibold text-text">Connect a new group</h2>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="platform" className="text-[13px] text-text-muted">
          Platform
        </label>
        <select
          id="platform"
          value={platform}
          onChange={handlePlatformChange}
          disabled={isPending}
          className="flex h-10 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-text transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="telegram">Telegram</option>
          <option value="discord">Discord</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
        <p className="text-[12px] text-text-faint">{PLATFORM_HELP[platform]}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="externalGroupId" className="text-[13px] text-text-muted">
          Group / channel ID
        </label>
        <Input
          id="externalGroupId"
          value={externalGroupId}
          onChange={(e) => setExternalGroupId(e.target.value)}
          placeholder={PLATFORM_PLACEHOLDER[platform]}
          required
          disabled={isPending}
          className="border-transparent bg-surface-2 focus-visible:border-accent"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="displayName" className="text-[13px] text-text-muted">
          Display name (optional)
        </label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Design Inspo Squad"
          disabled={isPending}
          className="border-transparent bg-surface-2 focus-visible:border-accent"
        />
      </div>

      <Button type="submit" disabled={isPending} className="self-start px-5 font-semibold">
        {isPending ? "Connecting…" : "Connect group"}
      </Button>

      {message && <p className="text-[13px] text-text-muted">{message}</p>}
    </form>
  );
}
