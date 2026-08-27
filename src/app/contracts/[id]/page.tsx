import Link from "next/link";
import { notFound } from "next/navigation";
import { formatLeagueDate } from "@/lib/datetime";
import {
  markContractApplied,
  resolveSevereSigning,
  voidContractSigning,
} from "@/actions/contracts";
import { ContractResultPanel } from "@/components/contracts/contract-result-panel";
import { OfferGuidancePanel } from "@/components/contracts/contract-offer-guidance";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getSessionUser, isCommissioner } from "@/lib/auth";
import { resolveOfferGuidance } from "@/lib/contracts/calculator";
import { penaltyBadgeVariant } from "@/lib/contracts/format";
import {
  PENALTY_LABELS,
  STATUS_LABELS,
  type ContractSnapshot,
} from "@/lib/contracts/types";
import { prisma } from "@/lib/prisma";

export default async function ContractSigningPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const signing = await prisma.playerContractSigning.findUnique({
    where: { id },
    include: {
      franchise: true,
      submittedBy: { select: { name: true, email: true } },
      season: { select: { number: true, name: true } },
    },
  });
  if (!signing) notFound();

  const user = await getSessionUser();
  const commissionerUi = user ? await isCommissioner(user) : false;
  const snapshot = signing.snapshot as unknown as ContractSnapshot;

  if (!snapshot?.input || !snapshot.blended) {
    notFound();
  }

  const offers = resolveOfferGuidance(snapshot, snapshot.input);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
            Season {signing.season.number} · {signing.franchise.abbreviation}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {signing.playerName}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Logged {formatLeagueDate(signing.createdAt, "MMM d, yyyy · h:mm a")} by{" "}
            {signing.submittedBy.name ?? signing.submittedBy.email}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={penaltyBadgeVariant(signing.penaltyTier)}>
            {PENALTY_LABELS[signing.penaltyTier]}
          </Badge>
          <Badge variant="outline">{STATUS_LABELS[signing.status]}</Badge>
          <Button asChild variant="outline" size="sm">
            <Link href="/contracts?tab=league">League history</Link>
          </Button>
        </div>
      </div>

      {commissionerUi ? (
        <CommissionerActions
          signingId={signing.id}
          penaltyTier={signing.penaltyTier}
          status={signing.status}
          severeResolution={signing.severeResolution}
          note={signing.commissionerNote}
        />
      ) : null}

      {offers ? (
        <OfferGuidancePanel
          offers={offers}
          playerName={signing.playerName}
          position={signing.position}
          teamAbbr={signing.franchise.abbreviation}
          asSigned={{
            apy: snapshot.asSignedApy,
            length: snapshot.input.asSignedLength,
          }}
          longContractYears={snapshot.rulesUsed?.longContractYears ?? 7}
        />
      ) : null}

      <ContractResultPanel
        calc={snapshot}
        input={snapshot.input}
        teamAbbr={signing.franchise.abbreviation}
      />
    </div>
  );
}

function CommissionerActions({
  signingId,
  penaltyTier,
  status,
  severeResolution,
  note,
}: {
  signingId: string;
  penaltyTier: string;
  status: string;
  severeResolution: string;
  note: string | null;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Commissioner actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {penaltyTier === "SEVERE" && severeResolution === "PENDING" ? (
          <div className="space-y-2">
            <Label htmlFor="commissionerNote">Severe resolution</Label>
            <form
              action={async (formData) => {
                "use server";
                await resolveSevereSigning(formData);
              }}
              className="space-y-2"
            >
              <input type="hidden" name="signingId" value={signingId} />
              <input type="hidden" name="resolution" value="VOID_SIGNING" />
              <Textarea
                id="commissionerNote"
                name="commissionerNote"
                defaultValue={note ?? ""}
                placeholder="Why void vs keep-player with a small APY bump"
              />
              <div className="flex flex-wrap gap-2">
                <SubmitButton variant="destructive">Void signing rights</SubmitButton>
              </div>
            </form>
            <form
              action={async (formData) => {
                "use server";
                await resolveSevereSigning(formData);
              }}
            >
              <input type="hidden" name="signingId" value={signingId} />
              <input type="hidden" name="resolution" value="STEEP_BELOW_MARKET" />
              <input type="hidden" name="commissionerNote" value={note ?? ""} />
              <SubmitButton variant="outline">Keep player — slightly shorter, small APY bump</SubmitButton>
            </form>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {status !== "VOIDED" && status !== "APPLIED" ? (
              <form
                action={async (formData) => {
                  "use server";
                  await markContractApplied(formData);
                }}
              >
                <input type="hidden" name="signingId" value={signingId} />
                <SubmitButton>Mark edited in Madden</SubmitButton>
              </form>
            ) : null}
            {status !== "VOIDED" ? (
              <form
                action={async (formData) => {
                  "use server";
                  await voidContractSigning(formData);
                }}
              >
                <input type="hidden" name="signingId" value={signingId} />
                <SubmitButton variant="destructive">Void signing</SubmitButton>
              </form>
            ) : null}
          </div>
        )}
        {note ? (
          <p className="text-sm text-[var(--muted-foreground)]">Note: {note}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
