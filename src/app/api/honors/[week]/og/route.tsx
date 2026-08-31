import { ImageResponse } from "next/og";
import { buildHonorsBoard, type HonorsPlayer } from "@/lib/madden/honors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GOLD = "#d4af37";
const INK = "#0a0a0a";
const CARD = "#16110a";

export async function GET(
  _request: Request,
  context: { params: Promise<{ week: string }> }
) {
  const week = Number((await context.params).week);
  if (!Number.isInteger(week) || week < 1 || week > 22) {
    return new Response("Invalid week", { status: 400 });
  }

  const board = await buildHonorsBoard(week - 1);
  const { persistHonorsBoard } = await import("@/lib/madden/stories");
  await persistHonorsBoard(board);
  const tapeLabel =
    board.expected > 0 && board.finalCount < board.expected
      ? `${board.finalCount} / ${board.expected} in`
      : "Companion tape";

  const image = new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: INK,
          backgroundImage:
            "radial-gradient(900px 420px at 12% -10%, rgba(212,175,55,0.28), transparent 55%), radial-gradient(700px 360px at 100% 110%, rgba(212,175,55,0.12), transparent 50%)",
          color: "white",
          padding: "48px 56px 40px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 36,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                color: GOLD,
                fontSize: 22,
                letterSpacing: 6,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Honors desk
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 72,
                fontWeight: 800,
                letterSpacing: -2,
                lineHeight: 1,
                marginTop: 8,
                textTransform: "uppercase",
              }}
            >
              {`Week ${week}`}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              border: `1px solid ${GOLD}`,
              color: GOLD,
              padding: "10px 16px",
              fontSize: 18,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {tapeLabel}
          </div>
        </div>

        <div style={{ display: "flex", width: "100%", gap: 28, flex: 1 }}>
          {stampCard("Offensive stamp", board.opoy)}
          {stampCard("Defensive stamp", board.dpoy)}
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 28,
            color: "rgba(255,255,255,0.7)",
            fontSize: 22,
          }}
        >
          <div style={{ display: "flex" }}>
            {board.rec
              ? `Heater · ${board.rec.fullName} (${board.rec.teamAbbr})`
              : "Kings Madden League"}
          </div>
          <div
            style={{
              display: "flex",
              color: GOLD,
              letterSpacing: 3,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            #KMLREBORN
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );

  image.headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  return image;
}

function stampCard(label: string, player: HonorsPlayer | null) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        backgroundColor: CARD,
        border: "1px solid rgba(212,175,55,0.45)",
        padding: "28px 32px",
      }}
    >
      <div
        style={{
          display: "flex",
          color: GOLD,
          fontSize: 18,
          letterSpacing: 4,
          textTransform: "uppercase",
          marginBottom: 18,
        }}
      >
        {label}
      </div>
      {player ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              color: GOLD,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 3,
            }}
          >
            {player.teamAbbr}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 42,
              fontWeight: 800,
              lineHeight: 1.05,
              marginTop: 6,
              textTransform: "uppercase",
            }}
          >
            {player.lastName}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 14,
              fontSize: 22,
              color: "rgba(255,255,255,0.82)",
            }}
          >
            {player.line}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 8,
              fontSize: 18,
              color: "rgba(255,255,255,0.55)",
            }}
          >
            {player.coachName ?? " "}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "rgba(255,255,255,0.45)",
          }}
        >
          Waiting on the tape
        </div>
      )}
    </div>
  );
}
