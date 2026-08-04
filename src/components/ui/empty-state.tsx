export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/30 px-6 py-12 text-center">
      <p className="font-[family-name:var(--font-display)] text-lg tracking-wide">
        {title}
      </p>
      {description ? (
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">{description}</p>
      ) : null}
    </div>
  );
}
