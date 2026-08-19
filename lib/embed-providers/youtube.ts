import type { EmbedProvider } from "./types";
import { fetchStandardOEmbed } from "./oembed-fetch";

const YOUTUBE_URL_PATTERN =
  /^https?:\/\/(www\.|m\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)/i;

export const youtubeProvider: EmbedProvider = {
  platform: "youtube",

  matches(url) {
    return YOUTUBE_URL_PATTERN.test(url);
  },

  fetchEmbed(url) {
    return fetchStandardOEmbed(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
  },
};
