"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { connectSource, type SourcePlatform } from "./actions";

const PLATFORMS: { value: SourcePlatform; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telegram", label: "Telegram" },
  { value: "discord", label: "Discord" },
];

// No literal QR/scan-to-join flow exists for any of these — the real
// mechanism is always "add the bot yourself, then paste the ID it gives
// you." (WhatsApp's Baileys pairing does have a real QR/pairing code, but
// that pairs the worker's own dedicated number once, not a per-group
// connection — out of scope for this modal.)
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

type Step = "platform" | "details" | "done";
const STEP_ORDER: Step[] = ["platform", "details", "done"];

export function ConnectSourceModal({ boardId }: { boardId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("platform");
  const [platform, setPlatform] = useState<SourcePlatform | null>(null);
  const [externalGroupId, setExternalGroupId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setStep("platform");
    setPlatform(null);
    setExternalGroupId("");
    setDisplayName("");
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  function pickPlatform(value: SourcePlatform) {
    setPlatform(value);
    setStep("details");
    setError(null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!platform) return;
    setError(null);
    startTransition(async () => {
      const result = await connectSource(boardId, platform, externalGroupId, displayName);
      switch (result.status) {
        case "ok":
          setStep("done");
          router.refresh();
          break;
        case "duplicate":
          setError("That group is already connected to a board.");
          break;
        case "error":
          setError(result.message);
          break;
      }
    });
  }

  const platformLabel = platform ? PLATFORMS.find((p) => p.value === platform)?.label : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="font-semibold">+ Connect a group</Button>
      </DialogTrigger>
      <DialogContent>
        <div className="flex gap-1.5">
          {STEP_ORDER.map((s) => (
            <div
              key={s}
              className={`h-[3px] flex-1 rounded-full transition-colors duration-200 ${
                STEP_ORDER.indexOf(s) <= STEP_ORDER.indexOf(step) ? "bg-accent" : "bg-border"
              }`}
            />
          ))}
        </div>

        {step === "platform" && (
          <>
            <DialogHeader>
              <DialogTitle>Connect a group</DialogTitle>
              <DialogDescription>Choose where your group lives.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              {PLATFORMS.map((p) => (
                <Button
                  key={p.value}
                  type="button"
                  variant="secondary"
                  className="justify-start font-semibold"
                  onClick={() => pickPlatform(p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </>
        )}

        {step === "details" && platform && (
          <>
            <DialogHeader>
              <DialogTitle>Connect {platformLabel}</DialogTitle>
              <DialogDescription>{PLATFORM_HELP[platform]}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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

              {error && <p className="text-[13px] text-red-600">{error}</p>}

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep("platform");
                    setError(null);
                  }}
                  className="text-[13px] text-text-muted transition-colors duration-150 hover:text-text"
                >
                  ← Back
                </button>
                <Button type="submit" disabled={isPending} className="font-semibold">
                  {isPending ? "Connecting…" : "Connect"}
                </Button>
              </div>
            </form>
          </>
        )}

        {step === "done" && (
          <>
            <DialogHeader>
              <DialogTitle>Connected</DialogTitle>
            </DialogHeader>
            <p className="text-[13.5px] text-text">Links shared in this group will start appearing on this board.</p>
            <Button onClick={() => handleOpenChange(false)} className="self-start font-semibold">
              Done
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
