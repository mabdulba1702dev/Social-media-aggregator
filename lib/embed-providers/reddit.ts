import type { EmbedProvider } from "./types";
import { fetchStandardOEmbed } from "./oembed-fetch";

const REDDIT_URL_PATTERN = /^https?:\/\/(www\.)?reddit\.com\/r\/[^/]+\/comments\/[^/]+/i;

export const redditProvider: EmbedProvider = {
  platform: "reddit",

  matches(url) {
    return REDDIT_URL_PATTERN.test(url);
  },

  fetchEmbed(url) {
    return fetchStandardOEmbed(`https://www.reddit.com/oembed?url=${encodeURIComponent(url)}`);
  },
};
