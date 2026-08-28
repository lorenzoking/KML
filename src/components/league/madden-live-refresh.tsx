"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function MaddenLiveRefresh({
  stamp,
  pending,
}: {
  stamp: string;
  pending: number;
}) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/league/pulse", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { stamp?: string; pending?: number };
        if (
          (data.stamp && data.stamp !== stamp) ||
          (typeof data.pending === "number" && data.pending !== pending)
        ) {
          router.refresh();
        }
      } catch {
        // Stay on the current tape if the pulse check fails.
      }
    }

    const intervalMs = pending > 0 ? 6000 : 15000;
    const id = window.setInterval(check, intervalMs);
    document.addEventListener("visibilitychange", check);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, [pending, router, stamp]);

  return null;
}
