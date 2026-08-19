import { createHash } from "node:crypto";

const TRACKING_PARAM_PREFIXES = ["utm_"];
const TRACKING_PARAMS = new Set(["fbclid", "gclid", "igshid", "si", "feature"]);

/**
 * Does not resolve shortlinks (t.co, etc.) — that requires following an HTTP
 * redirect, an async network call that belongs in the caller (embed-provider
 * fetch step), not this synchronous normalizer.
 */
export function normalizeUrl(rawUrl: string): string {
  const url = new URL(rawUrl);

  let host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "twitter.com") host = "x.com";

  const params = new URLSearchParams(url.search);
  for (const key of [...params.keys()]) {
    if (TRACKING_PARAMS.has(key) || TRACKING_PARAM_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      params.delete(key);
    }
  }
  params.sort();

  const path = url.pathname.replace(/\/+$/, "") || "/";
  const query = params.toString();

  return `https://${host}${path}${query ? `?${query}` : ""}`;
}

export function hashUrl(rawUrl: string): string {
  return createHash("sha256").update(normalizeUrl(rawUrl)).digest("hex");
}
