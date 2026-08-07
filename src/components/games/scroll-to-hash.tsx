"use client";

import { useEffect } from "react";

/** Scroll to #submit-result after soft navigation (Next often skips hash scroll). */
export function ScrollToHash({ id = "submit-result" }: { id?: string }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== `#${id}`) return;

    const run = () => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // Wait a tick so the week-tab content is painted.
    const t = window.setTimeout(run, 50);
    return () => window.clearTimeout(t);
  }, [id]);

  return null;
}
