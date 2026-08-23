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
    // No maxwidth defaults to a tiny 200x113 iframe (YouTube's own oEmbed
    // default) — request something that actually fills a masonry card;
    // the CSS in globals.css's .embed-body rules caps it back down on
    // narrower columns, same pattern as x.ts's maxwidth=380.
    return fetchStandardOEmbed(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json&maxwidth=500`
    );
  },
};
