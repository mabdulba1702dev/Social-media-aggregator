import type { EmbedProvider } from "./types";
import { youtubeProvider } from "./youtube";

export * from "./types";

export const embedProviders: EmbedProvider[] = [youtubeProvider];

export function resolveProvider(url: string): EmbedProvider | null {
  return embedProviders.find((provider) => provider.matches(url)) ?? null;
}
