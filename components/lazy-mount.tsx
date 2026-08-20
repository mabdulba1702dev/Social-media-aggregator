"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Defers mounting `children` until the wrapper scrolls near the viewport.
 * Used for embeds specifically: unlike CSS content-visibility, this actually
 * delays the oEmbed <script> tags (in EmbedHtml) from being created and
 * fetching each platform's widget JS/iframe until needed, not just the
 * layout/paint cost of an already-mounted DOM subtree.
 */
export function LazyMount({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  if (visible) return <>{children}</>;

  return (
    <div
      ref={ref}
      className="h-[220px] w-full animate-pulse bg-surface-2"
      aria-hidden="true"
    />
  );
}
