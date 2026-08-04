"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
      <h2 className="text-xl font-semibold uppercase tracking-wide">
        Something went wrong
      </h2>
      <p className="text-sm text-[var(--muted-foreground)]">
        {error.message || "Unexpected application error"}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
