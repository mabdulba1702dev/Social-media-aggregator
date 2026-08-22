import type { EmbedProvider } from "./types";
import { fetchStandardOEmbed } from "./oembed-fetch";

// Post/reel only — matches Meta's own oEmbed provider config
// (facebook/meta-embeds-for-wordpress), not profile URLs. Instagram serves
// both the bare form (instagram.com/p/CODE/) and the username-prefixed form
// (instagram.com/username/p/CODE/, e.g. from a profile grid) for the same
// post — accept an optional single path segment before p/reel.
const INSTAGRAM_URL_PATTERN = /^https?:\/\/(www\.)?instagram\.com\/(?:[^/?#]+\/)?(p|reel)\/[^/?#]+/i;

export const instagramProvider: EmbedProvider = {
  platform: "instagram",

  matches(url) {
    return INSTAGRAM_URL_PATTERN.test(url);
  },

  fetchEmbed(url) {
    // Tokenless since Meta's June 2026 policy change — see docs/PRD.md §8.
    // Lower rate limit than authenticated access (1,000 req/hour per Meta's docs).
    return fetchStandardOEmbed(`https://graph.facebook.com/v25.0/instagram_oembed?url=${encodeURIComponent(url)}`);
  },
};
