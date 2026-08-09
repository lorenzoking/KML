import Link from "next/link";
import { redirect } from "next/navigation";
import { selectMyTeamIdentity } from "@/actions/coach";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  TEAM_IDENTITY_CHANGE_RULE,
  TEAM_IDENTITY_SNAPSHOT,
  getTeamIdentityRuleBySlug,
} from "@/lib/coach/team-identity-rules";

type IdentityOption = {
  id: string;
  name: string;
  slug: string;
};

export function TeamIdentityPicker({
  options,
  currentIdentity,
  chosenSeason,
  currentSeason,
  franchiseName,
  franchiseId,
  returnTo = "/coach/me",
  allowAdminOverride = false,
}: {
  options: IdentityOption[];
  currentIdentity?: IdentityOption | null;
  chosenSeason?: number | null;
  currentSeason: number;
  franchiseName: string;
  franchiseId?: string;
  returnTo?: string;
  allowAdminOverride?: boolean;
}) {
  const rule = getTeamIdentityRuleBySlug(currentIdentity?.slug);
  const unlockSeason = chosenSeason != null ? chosenSeason + 3 : null;
  const locked =
    !allowAdminOverride &&
    Boolean(currentIdentity) &&
    chosenSeason != null &&
    unlockSeason != null &&
    currentSeason < unlockSeason;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Identity</CardTitle>
        <CardDescription>
          {franchiseName} — this is how your franchise builds in Free Agency, trades,
          and development.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentIdentity ? (
          <div className="rounded-lg border border-[var(--border)] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{currentIdentity.name}</Badge>
              {locked ? (
                <span className="text-xs text-[var(--muted-foreground)]">
                  Locked until Season {unlockSeason}
                </span>
              ) : allowAdminOverride && currentIdentity && chosenSeason != null ? (
                <span className="text-xs text-[var(--primary)]">
                  Admin override available
                </span>
              ) : (
                <span className="text-xs text-[var(--muted-foreground)]">
                  Can still be changed
                </span>
              )}
            </div>
            {rule ? (
              <div className="mt-2 space-y-1 text-sm text-[var(--muted-foreground)]">
                <p className="font-medium text-[var(--foreground)]">{rule.tagline}</p>
                <p>{rule.summary}</p>
                <p>
                  Development:{" "}
                  {TEAM_IDENTITY_SNAPSHOT.find((s) => s.slug === rule.slug)
                    ?.development ?? "See rules"}
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-[var(--border)] px-3 py-2 text-sm text-[var(--muted-foreground)]">
            No Team Identity selected yet. Pick one below — this is a 3-season
            commitment.
          </p>
        )}

        <form
          action={async (formData) => {
            "use server";
            const next = String(formData.get("returnTo") || "/coach/me");
            const safeNext = next.startsWith("/coach") ? next : "/coach/me";
            const result = await selectMyTeamIdentity(formData);
            if (result?.error) {
              redirect(`${safeNext}?error=${encodeURIComponent(result.error)}`);
            }
            redirect(`${safeNext}?updated=1`);
          }}
          className="space-y-3"
        >
          <input type="hidden" name="returnTo" value={returnTo} />
          {franchiseId ? (
            <input type="hidden" name="franchiseId" value={franchiseId} />
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="identityId">
              {currentIdentity ? "Change Team Identity" : "Choose Team Identity"}
            </Label>
            <Select
              id="identityId"
              name="identityId"
              required
              defaultValue={currentIdentity?.id ?? ""}
              disabled={locked}
            >
              <option value="" disabled>
                Select an identity
              </option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            {TEAM_IDENTITY_CHANGE_RULE}{" "}
            {allowAdminOverride
              ? "Commissioners can override this lock at any time."
              : null}{" "}
            <Link
              href="/rules?tab=team-identity"
              className="text-[var(--primary)] hover:underline"
            >
              Read full rules
            </Link>
          </p>
          {!locked ? (
            <SubmitButton>
              {allowAdminOverride && currentIdentity
                ? "Override Team Identity"
                : currentIdentity
                  ? "Update Team Identity"
                  : "Save Team Identity"}
            </SubmitButton>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              Contact a commissioner if you need an extraordinary identity change.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
