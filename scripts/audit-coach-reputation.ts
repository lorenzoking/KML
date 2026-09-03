import { Role } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";
import { repairMissingAutomaticReputation } from "../src/lib/coach/reputation-from-game";
import { getActiveSeason } from "../src/lib/league";

async function main() {
  const apply = process.argv.includes("--apply");
  const { season, settings } = await getActiveSeason();
  const commissioner = await prisma.user.findFirst({
    where: { role: Role.COMMISSIONER, isActive: true, deletedAt: null },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (!commissioner) {
    throw new Error("No commissioner user found to attribute ledger rows.");
  }

  const report = apply
    ? await prisma.$transaction(
        (tx) =>
          repairMissingAutomaticReputation(tx, {
            seasonId: season.id,
            createdById: commissioner.id,
            dryRun: false,
          }),
        { timeout: 180000, maxWait: 15000 }
      )
    : await repairMissingAutomaticReputation(prisma, {
        seasonId: season.id,
        createdById: commissioner.id,
        dryRun: true,
      });

  console.log(
    `Season ${settings.currentSeason} · ${apply ? "APPLY" : "DRY RUN"} · starting rep ${settings.startingRepScore}`
  );
  console.log("TEAM  COACH                  REC    EXPECT  ACTUAL  MISS  EXTRA  MISS$  EXTRA$");
  for (const team of report.teams) {
    console.log(
      [
        team.teamAbbr.padEnd(5),
        team.coach.slice(0, 21).padEnd(22),
        team.record.padEnd(6),
        String(team.expectedAutoNet).padStart(6),
        String(team.actualAutoNet).padStart(7),
        String(team.missing).padStart(5),
        String(team.extra).padStart(6),
        String(team.missingNet).padStart(6),
        String(team.extraNet).padStart(7),
      ].join(" ")
    );
  }
  console.log("");
  console.log(`Missing ${report.missing.length} automatic rows:`);
  for (const row of report.missing) {
    console.log(
      `  W${row.week} ${row.teamAbbr.padEnd(4)} ${row.coach.slice(0, 16).padEnd(16)} ${String(row.amount).padStart(3)} ${row.ruleKey}  ${row.reason}`
    );
  }
  if (report.extra.length) {
    console.log("");
    console.log(`Extra ${report.extra.length} automatic rows not in the current engine:`);
    for (const row of report.extra) {
      console.log(
        `  W${row.week} ${row.teamAbbr.padEnd(4)} ${row.coach.slice(0, 16).padEnd(16)} ${String(row.amount).padStart(3)} ${row.ruleKey}  ${row.reason}`
      );
    }
  }
  if (!apply) {
    console.log("\nRe-run with --apply to write missing automatic credits/penalties.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
