import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { handleIncomingMessage } from "@/lib/ingestion/pipeline";

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number };
    text?: string;
    caption?: string;
  };
}

/**
 * Telegram webhook — runs serverless, no always-on worker needed (unlike
 * Discord/WhatsApp, see docs/PRD.md §9.3). Register with Telegram via
 * setWebhook once deployed; see docs/setup-guide.md §6.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  if (!process.env.TELEGRAM_WEBHOOK_SECRET || secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const update = (await request.json()) as TelegramUpdate;
  const message = update.message;
  const text = message?.text ?? message?.caption;

  if (message && text) {
    const supabase = createServiceRoleClient();

    try {
      await handleIncomingMessage(supabase, {
        platform: "telegram",
        externalGroupId: String(message.chat.id),
        rawMessageId: String(message.message_id),
        text,
      });
    } catch (err) {
      // Still 200 below — Telegram retries on non-2xx, and a retry can't
      // fix an application-level error. ingestion_events already recorded
      // the failure (see lib/ingestion/pipeline.ts's markEvent).
      console.error("telegram webhook processing failed", err);
    }
  }

  return NextResponse.json({ ok: true });
}
