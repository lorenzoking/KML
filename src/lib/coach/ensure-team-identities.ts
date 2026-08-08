import { IdentityStatus, IdentityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  TEAM_IDENTITY_RULES,
  teamIdentityCatalogFields,
} from "@/lib/coach/team-identity-rules";

/** Keeps the four Team Identity catalog rows aligned with the published rulebook. */
export async function ensureDefaultTeamIdentities() {
  for (const rule of TEAM_IDENTITY_RULES) {
    const fields = teamIdentityCatalogFields(rule);
    await prisma.identityCatalog.upsert({
      where: { slug: rule.slug },
      update: {
        name: fields.name,
        coreBenefit: fields.coreBenefit,
        restriction: fields.restriction,
        changeRule: fields.changeRule,
        level: fields.level,
        status: IdentityStatus.AVAILABLE,
        type: IdentityType.TEAM,
      },
      create: {
        ...fields,
        type: IdentityType.TEAM,
        status: IdentityStatus.AVAILABLE,
      },
    });
  }
}
