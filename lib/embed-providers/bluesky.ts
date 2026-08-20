import type { EmbedProvider } from "./types";
import { fetchStandardOEmbed } from "./oembed-fetch";

const BLUESKY_URL_PATTERN = /^https?:\/\/(www\.)?bsky\.app\/profile\/[^/]+\/post\/[^/?#]+/i;

export const blueskyProvider: EmbedProvider = {
  platform: "bluesky",

  matches(url) {
    return BLUESKY_URL_PATTERN.test(url);
  },

  fetchEmbed(url) {
    return fetchStandardOEmbed(`https://embed.bsky.app/oembed?format=json&url=${encodeURIComponent(url)}`);
  },
};
