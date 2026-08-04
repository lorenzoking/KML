import { requireUser, isCommissioner } from "@/lib/auth";
import { CoachNav } from "@/components/coach/coach-nav";

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const commissionerUi = await isCommissioner(user);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Coach Hub</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Coaching identities, XP races, job security, carousel, and reputation.
          {commissionerUi ? " Commissioner actions are enabled." : ""}
        </p>
      </div>
      <CoachNav />
      {children}
    </div>
  );
}
