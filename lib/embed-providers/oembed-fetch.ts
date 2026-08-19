import type { EmbedResult } from "./types";

interface StandardOEmbedResponse {
  html: string;
  thumbnail_url?: string;
  title?: string;
  author_name?: string;
}

export const UNAVAILABLE: EmbedResult = {
  status: "unavailable",
  embedHtml: null,
  embedThumbnailUrl: null,
  caption: null,
  authorName: null,
  authorHandle: null,
};

/**
 * Fetches a standard oEmbed JSON endpoint and normalizes the common fields.
 * Never throws — network failures and non-2xx responses both come back as
 * `UNAVAILABLE`, since a broken embed should fall back to a preview card
 * (see docs/PRD.md §8), not crash the caller.
 */
export async function fetchStandardOEmbed(
  oembedUrl: string,
  mapAuthorHandle?: (data: StandardOEmbedResponse) => string | null
): Promise<EmbedResult> {
  try {
    const res = await fetch(oembedUrl);
    if (!res.ok) return UNAVAILABLE;

    const data = (await res.json()) as StandardOEmbedResponse;

    return {
      status: "ok",
      embedHtml: data.html,
      embedThumbnailUrl: data.thumbnail_url ?? null,
      caption: data.title ?? null,
      authorName: data.author_name ?? null,
      authorHandle: mapAuthorHandle ? mapAuthorHandle(data) : null,
    };
  } catch {
    return UNAVAILABLE;
  }
}
