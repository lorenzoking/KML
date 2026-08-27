import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { MaddenExportExplorer } from "@/components/admin/madden-export-explorer";
import { buildDumpPreview, summarizeKinds } from "@/lib/madden/preview";

export const dynamic = "force-dynamic";

export default async function MaddenExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ dump?: string }>;
}) {
  const { dump: dumpId } = await searchParams;
  const dumps = await prisma.maddenExportDump.findMany({
    orderBy: { receivedAt: "desc" },
    take: 80,
  });
  const previews = dumps.map((dump) =>
    buildDumpPreview({
      ...dump,
      payload: dump.payload,
    })
  );
  const summaries = summarizeKinds(previews);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold uppercase tracking-wide">
            Export lab
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Read-only view of whatever the Companion App posted. Use this to
            decide what is worth wiring up. Public league pages are unchanged.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/madden">Export URL</Link>
          </Button>
        </div>
      </div>

      <MaddenExportExplorer
        dumps={previews}
        summaries={summaries}
        initialDumpId={dumpId}
      />
    </div>
  );
}
