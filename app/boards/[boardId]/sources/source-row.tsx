"use client";

import { useState, useTransition, type FormEvent } from "react";
import { disconnectSource, renameSource, setSourceStatus, type SourcePlatform, type SourceStatus } from "./actions";

interface Source {
  id: string;
  platform: SourcePlatform;
  external_group_id: string;
  display_name: string | null;
  status: SourceStatus;
  connected_at: string;
  last_event_at: string | null;
}

const PLATFORM_LABEL: Record<SourcePlatform, string> = {
  telegram: "Telegram",
  discord: "Discord",
  whatsapp: "WhatsApp",
};

const STATUS_CLASS: Record<SourceStatus, string> = {
  active: "text-accent",
  paused: "text-text-faint",
  error: "text-red-600",
};

export function SourceRow({ boardId, source }: { boardId: string; source: Source }) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(source.display_name ?? "");
  const [isPending, startTransition] = useTransition();

  function handleRenameSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      await renameSource(source.id, boardId, name);
      setIsRenaming(false);
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-card border border-border bg-surface p-3 shadow-sm">
      <span className="inline-flex shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
        {PLATFORM_LABEL[source.platform]}
      </span>

      <div className="min-w-0 flex-1">
        {isRenaming ? (
          <form onSubmit={handleRenameSubmit} className="flex items-center gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              className="w-full border-b border-border bg-transparent text-[13.5px] text-text focus:outline-none"
            />
            <button type="submit" disabled={isPending} className="shrink-0 text-[12px] text-accent">
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRenaming(false);
                setName(source.display_name ?? "");
              }}
              className="shrink-0 text-[12px] text-text-muted"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsRenaming(true)}
            title="Click to rename"
            className="max-w-full truncate text-left text-[13.5px] font-medium text-text hover:underline"
          >
            {source.display_name || source.external_group_id}
          </button>
        )}
        <p className="truncate text-[11.5px] text-text-faint">
          {source.external_group_id}
          {source.last_event_at
            ? ` · last link ${new Date(source.last_event_at).toLocaleDateString()}`
            : " · no links yet"}
        </p>
      </div>

      <span className={`shrink-0 text-[11px] ${STATUS_CLASS[source.status]}`}>{source.status}</span>

      {source.status !== "error" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() =>
              setSourceStatus(source.id, boardId, source.status === "active" ? "paused" : "active")
            )
          }
          className="shrink-0 text-[12px] text-text-muted transition-colors duration-150 hover:text-text disabled:opacity-50"
        >
          {source.status === "active" ? "Pause" : "Resume"}
        </button>
      )}

      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          const label = source.display_name || source.external_group_id;
          if (confirm(`Disconnect ${label}? Its post history stays, but no new links will come in.`)) {
            startTransition(() => disconnectSource(source.id, boardId));
          }
        }}
        className="shrink-0 text-[12px] text-text-muted transition-colors duration-150 hover:text-red-600 disabled:opacity-50"
      >
        Disconnect
      </button>
    </div>
  );
}
