import type { EmbedProvider } from "./types";
import { fetchStandardOEmbed } from "./oembed-fetch";

// Matches both domains since the raw pasted URL is checked before
// lib/normalize-url.ts's twitter.com -> x.com unification runs.
const X_URL_PATTERN = /^https?:\/\/(www\.)?(x|twitter)\.com\/[^/]+\/status\/\d+/i;

export const xProvider: EmbedProvider = {
  platform: "x",

  matches(url) {
    return X_URL_PATTERN.test(url);
  },

  fetchEmbed(url) {
    // Per docs/PRD.md §8: X's embed widget is known to be unreliable for
    // logged-out viewers — a real production fallback path, not a
    // theoretical edge case. fetchStandardOEmbed already returns
    // `unavailable` on any failure, which is what drives the preview-card
    // fallback state in app/boards/[boardId]/post-card.tsx.
    return fetchStandardOEmbed(`https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`);
  },
};
