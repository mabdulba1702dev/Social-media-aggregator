import "dotenv/config";
import makeWASocket, { DisconnectReason, fetchLatestBaileysVersion, useMultiFileAuthState } from "baileys";
import type { Boom } from "@hapi/boom";
import pino from "pino";
import { handleIncomingMessage } from "./pipeline.js";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

// Per docs/setup-guide.md §6: read-only monitoring of groups this account is
// already a legitimate member of. Never add auto-reply/send behavior here
// without re-reading that section's risk notes first.
async function start(): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState(
    process.env.WHATSAPP_SESSION_STORAGE_PATH ?? "./whatsapp-session"
  );
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    auth: state,
    version,
    printQRInTerminal: false,
    logger: logger as never,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (!sock.authState.creds.registered) {
      const phoneNumber = process.env.WHATSAPP_PAIRING_NUMBER;
      if (phoneNumber) {
        const code = await sock.requestPairingCode(phoneNumber);
        logger.info({ code }, "WhatsApp pairing code — enter this in WhatsApp > Linked Devices");
      } else {
        logger.warn("WHATSAPP_PAIRING_NUMBER not set — cannot request a pairing code");
      }
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      logger.warn({ statusCode, shouldReconnect }, "WhatsApp connection closed");
      if (shouldReconnect) void start();
    } else if (connection === "open") {
      logger.info("WhatsApp connection open");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const message of messages) {
      if (!message.message || message.key.fromMe) continue;

      const groupId = message.key.remoteJid;
      if (!groupId?.endsWith("@g.us")) continue; // groups only, per PRD §6.4

      const text = message.message.conversation ?? message.message.extendedTextMessage?.text ?? "";
      if (!text) continue;

      try {
        await handleIncomingMessage({
          platform: "whatsapp",
          externalGroupId: groupId,
          rawMessageId: message.key.id ?? "",
          text,
        });
      } catch (err) {
        logger.error({ err, groupId }, "failed to process WhatsApp message");
      }
    }
  });
}

start().catch((err) => {
  logger.error({ err }, "fatal error starting WhatsApp worker");
  process.exit(1);
});
