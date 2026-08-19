import type { EmbedProvider } from "./types";
import { fetchStandardOEmbed } from "./oembed-fetch";

const THREADS_URL_PATTERN = /^https?:\/\/(www\.)?threads\.(com|net)\/(@[^/]+\/post\/|t\/)/i;

export const threadsProvider: EmbedProvider = {
  platform: "threads",

  matches(url) {
    return THREADS_URL_PATTERN.test(url);
  },

  fetchEmbed(url) {
    // Tokenless since Meta's June 2026 policy change — see docs/PRD.md §8.
    return fetchStandardOEmbed(`https://graph.threads.com/oembed?url=${encodeURIComponent(url)}`);
  },
};
