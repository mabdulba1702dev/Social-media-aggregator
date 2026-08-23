"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    twttr?: { widgets?: { load?: (el?: HTMLElement) => void } };
    instgrm?: { Embeds?: { process?: () => void } };
    FB?: { XFBML?: { parse?: (el?: HTMLElement) => void } };
  }
}

/**
 * Renders raw oEmbed HTML from Instagram/X/TikTok/Facebook/Reddit/etc.
 * These responses ship a <blockquote> placeholder plus a <script> tag that's
 * supposed to hydrate it into the real widget — but scripts inserted via
 * dangerouslySetInnerHTML never execute (a browser behavior, not a bug), so
 * without this the card is stuck showing the static fallback forever.
 * Re-creating each <script> node as a genuine DOM element makes it run.
 *
 * That alone only actually hydrates the *first* card of a given platform on
 * the page — with lazy-mounted cards (see LazyMount), a card further down
 * often mounts well after an earlier card already loaded that platform's
 * widget script, and these scripts guard against re-initializing (Twitter's
 * widgets.js, Instagram's embed.js), so re-inserting the tag silently
 * no-ops. Each platform exposes its own on-demand re-scan API for exactly
 * this "content added after the page's initial load" case — call it too,
 * scoped to this card. Harmless no-op for a card whose platform isn't
 * loaded/doesn't apply.
 */
export function EmbedHtml({ html, className }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    container.querySelectorAll("script").forEach((oldScript) => {
      const newScript = document.createElement("script");
      for (const attr of oldScript.attributes) {
        newScript.setAttribute(attr.name, attr.value);
      }
      newScript.text = oldScript.text;
      oldScript.replaceWith(newScript);
    });

    window.twttr?.widgets?.load?.(container);
    window.instgrm?.Embeds?.process?.();
    window.FB?.XFBML?.parse?.(container);
  }, [html]);

  return <div ref={ref} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
