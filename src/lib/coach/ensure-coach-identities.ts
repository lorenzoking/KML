import { IdentityStatus, IdentityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  COACH_IDENTITY_RULES,
  coachIdentityCatalogFields,
} from "@/lib/coach/coach-identity-rules";

/** Keeps Coaching Identity catalog rows aligned with the published rulebook. */
export async function ensureDefaultCoachIdentities() {
  for (const rule of COACH_IDENTITY_RULES) {
    const fields = coachIdentityCatalogFields(rule);
    await prisma.identityCatalog.upsert({
      where: { slug: rule.slug },
      update: {
        name: fields.name,
        coreBenefit: fields.coreBenefit,
        restriction: fields.restriction,
        changeRule: fields.changeRule,
        level: fields.level,
        status: IdentityStatus.AVAILABLE,
        type: IdentityType.COACH,
      },
      create: {
        ...fields,
        type: IdentityType.COACH,
        status: IdentityStatus.AVAILABLE,
      },
    });
  }
}
