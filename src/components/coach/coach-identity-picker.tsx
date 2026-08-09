import Link from "next/link";
import { redirect } from "next/navigation";
import { selectMyCoachIdentity } from "@/actions/coach";
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
  COACH_IDENTITY_CHANGE_RULE,
  getCoachIdentityRuleBySlug,
} from "@/lib/coach/coach-identity-rules";

type IdentityOption = {
  id: string;
  name: string;
  slug: string;
};

export function CoachIdentityPicker({
  options,
  currentIdentity,
  chosenSeason,
  currentSeason,
  targetUserId,
  returnTo = "/coach/me",
  allowAdminOverride = false,
}: {
  options: IdentityOption[];
  currentIdentity?: IdentityOption | null;
  chosenSeason?: number | null;
  currentSeason: number;
  targetUserId?: string;
  returnTo?: string;
  allowAdminOverride?: boolean;
}) {
  const rule = getCoachIdentityRuleBySlug(currentIdentity?.slug);
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
        <CardTitle>Coaching Identity</CardTitle>
        <CardDescription>
          Your specialty for offseason development — how players improve, not how the
          roster is acquired.
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
                <p className="font-medium text-[var(--foreground)]">{rule.summary}</p>
                <p className="italic">Philosophy: {rule.philosophy}</p>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-[var(--border)] px-3 py-2 text-sm text-[var(--muted-foreground)]">
            No Coaching Identity selected yet. Pick one below — this is a 3-season
            commitment.
          </p>
        )}

        <form
          action={async (formData) => {
            "use server";
            const next = String(formData.get("returnTo") || "/coach/me");
            const safeNext = next.startsWith("/coach") ? next : "/coach/me";
            const result = await selectMyCoachIdentity(formData);
            if (result?.error) {
              redirect(`${safeNext}?error=${encodeURIComponent(result.error)}`);
            }
            redirect(`${safeNext}?updated=1`);
          }}
          className="space-y-3"
        >
          <input type="hidden" name="returnTo" value={returnTo} />
          {targetUserId ? (
            <input type="hidden" name="userId" value={targetUserId} />
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="coachIdentityId">
              {currentIdentity
                ? "Change Coaching Identity"
                : "Choose Coaching Identity"}
            </Label>
            <Select
              id="coachIdentityId"
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
            {COACH_IDENTITY_CHANGE_RULE}{" "}
            {allowAdminOverride
              ? "Commissioners can override this lock at any time."
              : null}{" "}
            <Link
              href="/rules?tab=coaching-identity"
              className="text-[var(--primary)] hover:underline"
            >
              Read full rules
            </Link>
          </p>
          {!locked ? (
            <SubmitButton>
              {allowAdminOverride && currentIdentity
                ? "Override Coaching Identity"
                : currentIdentity
                  ? "Update Coaching Identity"
                  : "Save Coaching Identity"}
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
