import { revalidatePath } from "next/cache";
import { MaddenExportKind } from "@/generated/prisma/client";
import { indexMaddenDump } from "@/lib/madden/index-dumps";

const STORY_KINDS = new Set<MaddenExportKind>([
  MaddenExportKind.PLAYER_STATS,
  MaddenExportKind.SCHEDULE,
  MaddenExportKind.STANDINGS,
  MaddenExportKind.TEAM_STATS,
  MaddenExportKind.LEAGUE_TEAMS,
]);

export function revalidateMaddenPages() {
  revalidatePath("/league");
  revalidatePath("/league/leaders");
  revalidatePath("/league/teams");
  revalidatePath("/league/teams", "layout");
  revalidatePath("/storylines");
  revalidatePath("/admin/madden");
  revalidatePath("/");
}

export async function applyMaddenDump(
  dump: Parameters<typeof indexMaddenDump>[0] & { kind: MaddenExportKind }
) {
  await indexMaddenDump(dump);
  if (STORY_KINDS.has(dump.kind)) {
    const { generateMaddenStories } = await import("@/lib/madden/stories");
    await generateMaddenStories();
  }
  revalidateMaddenPages();
}
