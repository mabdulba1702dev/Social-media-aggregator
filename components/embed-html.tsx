"use client";

import { useEffect, useRef } from "react";

/**
 * Renders raw oEmbed HTML from Instagram/X/TikTok/Facebook/Reddit/etc.
 * These responses ship a <blockquote> placeholder plus a <script> tag that's
 * supposed to hydrate it into the real widget — but scripts inserted via
 * dangerouslySetInnerHTML never execute (a browser behavior, not a bug), so
 * without this the card is stuck showing the static fallback forever.
 * Re-creating each <script> node as a genuine DOM element makes it run.
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
  }, [html]);

  return <div ref={ref} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
