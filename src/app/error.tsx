"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = error.message || "Unexpected application error";
  const looksLikeDb =
    /Can't reach database server|PrismaClientInitializationError|League settings not seeded|Timed out fetching a new connection/i.test(
      message
    );

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
      <h2 className="text-xl font-semibold uppercase tracking-wide">
        Something went wrong
      </h2>
      <p className="text-sm text-[var(--muted-foreground)]">{message}</p>
      {looksLikeDb ? (
        <p className="text-left text-xs text-[var(--muted-foreground)]">
          Database connection failed. On Vercel, set <code>DATABASE_URL</code> to
          the Supabase <strong>Transaction pooler</strong> URI (port 6543) with
          <code>?pgbouncer=true&amp;connection_limit=1</code>, and keep{" "}
          <code>DIRECT_URL</code> as the direct URI for migrations.
        </p>
      ) : null}
      {error.digest ? (
        <p className="text-xs text-[var(--muted-foreground)]">Digest: {error.digest}</p>
      ) : null}
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
