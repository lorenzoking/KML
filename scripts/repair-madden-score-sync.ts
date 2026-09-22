import { prisma } from "../src/lib/prisma";
import { indexPendingMaddenDumps } from "../src/lib/madden/index-dumps";
import { resyncMaddenScoresFromWeek } from "../src/lib/madden/sync-scores";

async function main() {
  const pending = await indexPendingMaddenDumps(40);
  console.log(`Indexed ${pending} pending dumps`);
  const updated = await resyncMaddenScoresFromWeek(14);
  console.log(`Filed or filled ${updated} games from week 14 on`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
