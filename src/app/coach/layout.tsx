import { requireUser, isCommissioner } from "@/lib/auth";
import { CoachNav } from "@/components/coach/coach-nav";

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Coach Hub</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Coaching identities, XP races, job security, carousel, and reputation.
          {isCommissioner(user) ? " Commissioner actions are enabled." : ""}
        </p>
      </div>
      <CoachNav />
      {children}
    </div>
  );
}
