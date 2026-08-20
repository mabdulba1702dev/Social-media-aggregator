import type { EmbedProvider } from "./types";
import { youtubeProvider } from "./youtube";
import { instagramProvider } from "./instagram";
import { xProvider } from "./x";
import { tiktokProvider } from "./tiktok";
import { redditProvider } from "./reddit";
import { pinterestProvider } from "./pinterest";
import { facebookProvider } from "./facebook";
import { threadsProvider } from "./threads";
import { blueskyProvider } from "./bluesky";

export * from "./types";

export const embedProviders: EmbedProvider[] = [
  youtubeProvider,
  instagramProvider,
  xProvider,
  tiktokProvider,
  redditProvider,
  pinterestProvider,
  facebookProvider,
  threadsProvider,
  blueskyProvider,
];

export function resolveProvider(url: string): EmbedProvider | null {
  return embedProviders.find((provider) => provider.matches(url)) ?? null;
}
