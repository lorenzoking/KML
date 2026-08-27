import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveSeason } from "@/lib/league";
import {
  classifyCompanionPath,
  inspectPayload,
  resolveKind,
} from "@/lib/madden/companion";
import { indexMaddenDump } from "@/lib/madden/index-dumps";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 4_500_000;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store",
};

type RouteContext = {
  params: Promise<{ token: string; path?: string[] }>;
};

async function authorizedToken(token: string) {
  const settings = await prisma.leagueSetting.findUnique({
    where: { key: "default" },
    select: { maddenExportToken: true },
  });
  return Boolean(settings?.maddenExportToken && settings.maddenExportToken === token);
}

function probeBody() {
  return new NextResponse("KML Madden Companion receiver", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ...CORS_HEADERS,
    },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  if (!(await authorizedToken(token))) {
    return new NextResponse("Unauthorized", { status: 401, headers: CORS_HEADERS });
  }
  return probeBody();
}

export async function HEAD(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  if (!(await authorizedToken(token))) {
    return new NextResponse(null, { status: 401, headers: CORS_HEADERS });
  }
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "GET, HEAD, POST, OPTIONS",
      ...CORS_HEADERS,
    },
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { token, path = [] } = await context.params;
  if (!(await authorizedToken(token))) {
    return new NextResponse("Unauthorized", { status: 401, headers: CORS_HEADERS });
  }

  const raw = await request.text();
  const byteSize = Buffer.byteLength(raw, "utf8");
  if (byteSize > MAX_BYTES) {
    return new NextResponse("Payload too large", { status: 413, headers: CORS_HEADERS });
  }

  let payload: Prisma.InputJsonValue = { _raw: raw.slice(0, 20_000) };
  try {
    payload = raw ? (JSON.parse(raw) as Prisma.InputJsonValue) : {};
  } catch {
    payload = { _unparsed: true, _raw: raw.slice(0, 20_000) };
  }

  const pathInfo = classifyCompanionPath(path);
  const inspected = inspectPayload(payload);
  const kind = resolveKind(pathInfo.kind, inspected.kindFromBody, path);

  let seasonId: string | null = null;
  try {
    const { season } = await getActiveSeason();
    seasonId = season.id;
  } catch {
    seasonId = null;
  }

  const dump = await prisma.maddenExportDump.create({
    data: {
      seasonId,
      method: "POST",
      path: `/${path.join("/")}`,
      kind,
      platform: pathInfo.platform,
      leagueId: pathInfo.leagueId,
      weekType: pathInfo.weekType,
      weekNumber: inspected.weekIndex ?? pathInfo.weekNumber,
      teamId: pathInfo.teamId,
      dataType: pathInfo.dataType,
      payload,
      payloadKeys: inspected.keys,
      listCounts: inspected.listCounts,
      success: inspected.success,
      message: inspected.message,
      byteSize,
    },
  });

  try {
    await indexMaddenDump(dump);
  } catch (error) {
    console.error("Madden dump index failed", dump.id, error);
  }

  return new NextResponse("OK", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ...CORS_HEADERS,
    },
  });
}
