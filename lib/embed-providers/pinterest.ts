import type { EmbedProvider } from "./types";
import { fetchStandardOEmbed } from "./oembed-fetch";

const PINTEREST_URL_PATTERN = /^https?:\/\/(www\.)?pinterest\.[a-z.]+\/pin\/[^/?#]+/i;

export const pinterestProvider: EmbedProvider = {
  platform: "pinterest",

  matches(url) {
    return PINTEREST_URL_PATTERN.test(url);
  },

  fetchEmbed(url) {
    return fetchStandardOEmbed(`https://www.pinterest.com/oembed.json?url=${encodeURIComponent(url)}`);
  },
};
