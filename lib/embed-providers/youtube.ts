import type { EmbedProvider, EmbedResult } from "./types";

const YOUTUBE_URL_PATTERN =
  /^https?:\/\/(www\.|m\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)/i;

interface YouTubeOEmbedResponse {
  html: string;
  thumbnail_url: string;
  title: string;
  author_name: string;
}

const UNAVAILABLE: EmbedResult = {
  status: "unavailable",
  embedHtml: null,
  embedThumbnailUrl: null,
  caption: null,
  authorName: null,
  authorHandle: null,
};

export const youtubeProvider: EmbedProvider = {
  platform: "youtube",

  matches(url) {
    return YOUTUBE_URL_PATTERN.test(url);
  },

  async fetchEmbed(url) {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl);

    if (!res.ok) {
      return UNAVAILABLE;
    }

    const data = (await res.json()) as YouTubeOEmbedResponse;

    return {
      status: "ok",
      embedHtml: data.html,
      embedThumbnailUrl: data.thumbnail_url,
      caption: data.title,
      authorName: data.author_name,
      // YouTube's oEmbed response has no @handle-style field, only a channel URL.
      authorHandle: null,
    };
  },
};
