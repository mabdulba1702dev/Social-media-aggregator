export type Platform =
  | "instagram"
  | "x"
  | "tiktok"
  | "youtube"
  | "facebook"
  | "reddit"
  | "threads"
  | "pinterest"
  | "linkedin"
  | "bluesky"
  | "other";

export interface EmbedResult {
  status: "ok" | "unavailable";
  embedHtml: string | null;
  embedThumbnailUrl: string | null;
  caption: string | null;
  authorName: string | null;
  authorHandle: string | null;
}

export interface EmbedProvider {
  platform: Platform;
  matches(url: string): boolean;
  fetchEmbed(url: string): Promise<EmbedResult>;
}
