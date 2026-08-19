import type { EmbedProvider } from "./types";
import { fetchStandardOEmbed } from "./oembed-fetch";

const TIKTOK_URL_PATTERN = /^https?:\/\/(www\.)?tiktok\.com\/@[^/]+\/video\/\d+/i;

export const tiktokProvider: EmbedProvider = {
  platform: "tiktok",

  matches(url) {
    return TIKTOK_URL_PATTERN.test(url);
  },

  fetchEmbed(url) {
    return fetchStandardOEmbed(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
  },
};
