import {
  applyToCarousel,
  createCarouselVacancy,
  reviewCarouselApplication,
  setCarouselOpen,
} from "@/actions/coach";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { isCommissioner, requireUser } from "@/lib/auth";
import { getActiveSeason, getUserMembership } from "@/lib/league";
import { prisma } from "@/lib/prisma";

export default async function CoachCarouselPage() {
  const user = await requireUser();
  const commissioner = await isCommissioner(user);
  const { season, settings } = await getActiveSeason();

  const [vacancies, applications, franchises, membership] = await Promise.all([
    prisma.carouselVacancy.findMany({
      where: { seasonId: season.id },
      include: { franchise: true },
      orderBy: [{ isOpen: "desc" }, { createdAt: "desc" }],
    }),
    prisma.carouselApplication.findMany({
      where: { seasonId: season.id },
      include: {
        applicant: true,
        currentTeam: true,
        requestedTeam: true,
        vacancy: { include: { franchise: true } },
      },
      orderBy: [{ status: "asc" }, { priorityScore: "desc" }],
    }),
    prisma.franchise.findMany({ orderBy: { sortOrder: "asc" } }),
    getUserMembership(user.id, season.id),
  ]);

  const myOpenApp = applications.find(
    (a) => a.applicantId === user.id && a.status === "PENDING"
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Carousel controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Carousel status: <span className="font-medium">{settings.carouselOpen ? "Open" : "Closed"}</span>
          </p>
          <p className="text-[var(--muted-foreground)]">
            Buyout minimum rep {settings.buyoutMinCoachRep} · Base XP cost {settings.buyoutXpCost}
          </p>
          {commissioner ? (
            <form
              action={async (formData) => {
                "use server";
                await setCarouselOpen(formData);
              }}
              className="grid max-w-xs gap-2 sm:flex sm:items-end"
            >
              <div className="w-full">
                <Label htmlFor="carouselOpen">Status</Label>
                <Select id="carouselOpen" name="carouselOpen" defaultValue={settings.carouselOpen ? "false" : "true"}>
                  <option value={settings.carouselOpen ? "false" : "true"}>
                    {settings.carouselOpen ? "Close carousel" : "Open carousel"}
                  </option>
                </Select>
              </div>
              <SubmitButton size="sm">Apply</SubmitButton>
            </form>
          ) : null}
        </CardContent>
      </Card>

      {commissioner ? (
        <Card>
          <CardHeader>
            <CardTitle>Create vacancy</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                "use server";
                await createCarouselVacancy(formData);
              }}
              className="grid gap-3 sm:grid-cols-2 md:grid-cols-3"
            >
              <div className="space-y-2">
                <Label htmlFor="franchiseId">Franchise</Label>
                <Select id="franchiseId" name="franchiseId" required defaultValue="">
                  <option value="" disabled>
                    Select franchise
                  </option>
                  {franchises.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="reason">Reason</Label>
                <Input id="reason" name="reason" required />
              </div>
              <div className="md:col-span-3">
                <SubmitButton>Create vacancy</SubmitButton>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Apply to carousel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {!membership ? (
            <p className="text-[var(--muted-foreground)]">You must be assigned to a team first.</p>
          ) : myOpenApp ? (
            <p className="text-[var(--muted-foreground)]">
              You already have a pending application for this season.
            </p>
          ) : (
            <form
              action={async (formData) => {
                "use server";
                await applyToCarousel(formData);
              }}
              className="grid gap-3 sm:grid-cols-2 md:grid-cols-2"
            >
              <div className="space-y-2">
                <Label htmlFor="moveType">Move type</Label>
                <Select id="moveType" name="moveType" defaultValue="VACANCY_APPLICATION">
                  <option value="VACANCY_APPLICATION">Vacancy application</option>
                  <option value="VOLUNTARY_BUYOUT">Voluntary buyout</option>
                  <option value="REASSIGNMENT">Commissioner reassignment request</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vacancyId">Vacancy (optional)</Label>
                <Select id="vacancyId" name="vacancyId" defaultValue="">
                  <option value="">None</option>
                  {vacancies
                    .filter((v) => v.isOpen)
                    .map((vacancy) => (
                      <option key={vacancy.id} value={vacancy.id}>
                        {vacancy.franchise.name}
                      </option>
                    ))}
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="requestedTeamId">Requested team (optional)</Label>
                <Select id="requestedTeamId" name="requestedTeamId" defaultValue="">
                  <option value="">No direct request</option>
                  {franchises.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="md:col-span-2">
                <SubmitButton disabled={!settings.carouselOpen}>Submit application</SubmitButton>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vacancies & applications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {vacancies.map((v) => (
              <div key={v.id} className="rounded-md border p-2 text-sm">
                {v.franchise.abbreviation} · {v.reason} · {v.isOpen ? "Open" : "Closed"}
              </div>
            ))}
          </div>

          <div className="space-y-3 md:hidden">
            {applications.map((app) => (
              <div key={app.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{app.applicant.name ?? app.applicant.email}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {app.currentTeam?.abbreviation ?? "—"} →{" "}
                  {app.requestedTeam?.abbreviation ?? app.vacancy?.franchise.abbreviation ?? "—"} ·{" "}
                  {app.moveType}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Priority {app.priorityScore.toFixed(2)} · {app.status}
                </p>
                <div className="mt-2">
                  {commissioner && app.status === "PENDING" ? (
                    <form
                      action={async (formData) => {
                        "use server";
                        await reviewCarouselApplication(formData);
                      }}
                      className="space-y-2"
                    >
                      <input type="hidden" name="applicationId" value={app.id} />
                      <Select name="decision" defaultValue="APPROVE">
                        <option value="APPROVE">Approve</option>
                        <option value="DENY">Deny</option>
                        <option value="WITHDRAW">Withdraw</option>
                      </Select>
                      <Input name="decisionNote" placeholder="Note" />
                      <Input name="contractYears" type="number" placeholder="Contract years" />
                      <SubmitButton size="sm">Submit</SubmitButton>
                    </form>
                  ) : (
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Decision: {app.decisionNote ?? "—"}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="text-left text-[var(--muted-foreground)]">
                <tr className="border-b">
                  <th className="py-2 pr-3">Applicant</th>
                  <th className="py-2 pr-3">Current</th>
                  <th className="py-2 pr-3">Requested</th>
                  <th className="py-2 pr-3">Move Type</th>
                  <th className="py-2 pr-3">Priority</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Decision</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-b align-top">
                    <td className="py-2 pr-3">{app.applicant.name ?? app.applicant.email}</td>
                    <td className="py-2 pr-3">{app.currentTeam?.abbreviation ?? "—"}</td>
                    <td className="py-2 pr-3">
                      {app.requestedTeam?.abbreviation ?? app.vacancy?.franchise.abbreviation ?? "—"}
                    </td>
                    <td className="py-2 pr-3">{app.moveType}</td>
                    <td className="py-2 pr-3">{app.priorityScore.toFixed(2)}</td>
                    <td className="py-2 pr-3">{app.status}</td>
                    <td className="py-2 pr-3">
                      {commissioner && app.status === "PENDING" ? (
                        <form
                          action={async (formData) => {
                            "use server";
                            await reviewCarouselApplication(formData);
                          }}
                          className="space-y-2"
                        >
                          <input type="hidden" name="applicationId" value={app.id} />
                          <Select name="decision" defaultValue="APPROVE">
                            <option value="APPROVE">Approve</option>
                            <option value="DENY">Deny</option>
                            <option value="WITHDRAW">Withdraw</option>
                          </Select>
                          <Input name="decisionNote" placeholder="Note" />
                          <Input name="contractYears" type="number" placeholder="Contract years" />
                          <SubmitButton size="sm">Submit</SubmitButton>
                        </form>
                      ) : (
                        <span className="text-[var(--muted-foreground)]">{app.decisionNote ?? "—"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
