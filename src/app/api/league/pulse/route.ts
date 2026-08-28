import { NextResponse } from "next/server";
import { getMaddenLivePulse } from "@/lib/madden/query";

export const dynamic = "force-dynamic";

export async function GET() {
  const pulse = await getMaddenLivePulse();
  return NextResponse.json(
    {
      stamp: pulse.stamp,
      pending: pulse.pending,
      indexedAt: pulse.indexedAt?.toISOString() ?? null,
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}
