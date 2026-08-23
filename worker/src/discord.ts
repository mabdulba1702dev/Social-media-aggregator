import "dotenv/config";
import { Client, Events, GatewayIntentBits } from "discord.js";
import pino from "pino";
import { handleIncomingMessage } from "./pipeline.js";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

// Message Content Intent must also be enabled for this bot in the Discord
// Developer Portal (Bot > Privileged Gateway Intents) — see
// docs/setup-guide.md §6 — or message.content arrives empty even with the
// intent requested here.
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once(Events.ClientReady, (readyClient) => {
  logger.info({ tag: readyClient.user.tag }, "Discord Gateway connected");
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.guildId) return; // server channels only, per PRD §6.4 — no DMs
  if (!message.content) return;

  // A "source" is one Discord channel, matching what the sources UI asks
  // for (Copy Channel ID) — not the whole server/guild.
  try {
    await handleIncomingMessage({
      platform: "discord",
      externalGroupId: message.channelId,
      rawMessageId: message.id,
      text: message.content,
    });
  } catch (err) {
    logger.error({ err, channelId: message.channelId }, "failed to process Discord message");
  }
});

client.on(Events.Error, (err) => {
  // discord.js reconnects automatically on a dropped Gateway connection —
  // no manual reconnect loop needed here, unlike Baileys in whatsapp.ts.
  logger.error({ err }, "Discord client error");
});

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  logger.error("DISCORD_BOT_TOKEN not set — cannot start Discord worker");
  process.exit(1);
}

client.login(token).catch((err) => {
  logger.error({ err }, "fatal error starting Discord worker");
  process.exit(1);
});
