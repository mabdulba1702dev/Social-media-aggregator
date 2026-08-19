import type { EmbedProvider } from "./types";
import { fetchStandardOEmbed } from "./oembed-fetch";

// Matches Meta's own oEmbed provider config (facebook/meta-embeds-for-wordpress) —
// posts and videos are genuinely different endpoints, not just a display choice.
const FACEBOOK_POST_PATTERN = /^https?:\/\/(www\.)?facebook\.com\/[^/]+\/posts\/[^/?#]+/i;
const FACEBOOK_VIDEO_PATTERN = /^https?:\/\/(www\.)?facebook\.com\/(reel\/[^/?#]+|[^/]+\/videos\/[^/?#]+)/i;

export const facebookProvider: EmbedProvider = {
  platform: "facebook",

  matches(url) {
    return FACEBOOK_POST_PATTERN.test(url) || FACEBOOK_VIDEO_PATTERN.test(url);
  },

  fetchEmbed(url) {
    const endpoint = FACEBOOK_VIDEO_PATTERN.test(url) ? "oembed_video" : "oembed_post";
    // Tokenless since Meta's June 2026 policy change — see docs/PRD.md §8.
    return fetchStandardOEmbed(`https://graph.facebook.com/v25.0/${endpoint}?url=${encodeURIComponent(url)}`);
  },
};
