import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSeason, getUserMembership } from "@/lib/league";
import { requestTeam } from "@/actions/users";

export default async function RequestTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { season } = await getActiveSeason();
  const params = await searchParams;

  const [membership, franchises, takenMemberships, freshUser] = await Promise.all([
    getUserMembership(user.id, season.id),
    prisma.franchise.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.leagueMembership.findMany({
      where: { seasonId: season.id, isActive: true },
      select: { franchiseId: true, user: { select: { name: true, email: true } } },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      include: { requestedFranchise: true },
    }),
  ]);

  if (membership) {
    redirect("/dashboard");
  }

  const takenByFranchiseId = new Map(
    takenMemberships.map((m) => [
      m.franchiseId,
      m.user.name?.trim() || "another coach",
    ])
  );

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
          New coach setup
        </p>
        <h1 className="text-3xl font-semibold uppercase tracking-[0.04em]">
          Request your team
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Google only knows your Gmail name. Tell the commissioner which franchise
          you drafted so they can assign you correctly.
        </p>
      </div>

      {params.error ? (
        <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
          {params.error}
        </p>
      ) : null}

      {freshUser?.requestedFranchise ? (
        <Card>
          <CardHeader>
            <CardTitle>Request on file</CardTitle>
            <CardDescription>
              You can update this anytime until a commissioner assigns you.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline">{freshUser.requestedFranchise.abbreviation}</Badge>
            <span>{freshUser.requestedFranchise.name}</span>
            {freshUser.teamRequestNote ? (
              <span className="w-full text-[var(--muted-foreground)]">
                Note: {freshUser.teamRequestNote}
              </span>
            ) : null}
            <Button asChild variant="ghost" size="sm" className="ml-auto">
              <Link href="/dashboard">Back to desk</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Which team is yours?</CardTitle>
          <CardDescription>
            Use the league name coaches know you by — not necessarily your Google
            name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              "use server";
              const result = await requestTeam(formData);
              if (result?.error) {
                redirect(`/request-team?error=${encodeURIComponent(result.error)}`);
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="displayName">League display name</Label>
              <Input
                id="displayName"
                name="displayName"
                defaultValue={freshUser?.name ?? ""}
                placeholder="e.g. Lefty, Curry, Big Al"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="franchiseId">Requested franchise</Label>
              <Select
                id="franchiseId"
                name="franchiseId"
                required
                defaultValue={freshUser?.requestedFranchiseId ?? ""}
              >
                <option value="" disabled>
                  Select a team
                </option>
                {franchises.map((f) => {
                  const takenBy = takenByFranchiseId.get(f.id);
                  return (
                    <option key={f.id} value={f.id}>
                      {f.abbreviation} — {f.name}
                      {takenBy ? ` (already assigned to ${takenBy})` : ""}
                    </option>
                  );
                })}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Optional note</Label>
              <Textarea
                id="note"
                name="note"
                defaultValue={freshUser?.teamRequestNote ?? ""}
                placeholder="Anything that helps match you — Discord name, draft pick #, etc."
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <SubmitButton>
                {freshUser?.requestedFranchiseId
                  ? "Update team request"
                  : "Submit team request"}
              </SubmitButton>
              <Button asChild variant="outline">
                <Link href="/dashboard">Skip for now</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
