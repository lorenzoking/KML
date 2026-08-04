import { setCommissionerViewMode } from "@/actions/view-mode";
import { Button } from "@/components/ui/button";

export function ViewModeToggle({
  viewingAsUser,
}: {
  viewingAsUser: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/50 px-1.5 py-1">
      <span
        className={
          viewingAsUser
            ? "hidden rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300 sm:inline"
            : "hidden rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--primary)] sm:inline"
        }
      >
        {viewingAsUser ? "Viewing: Coach" : "Viewing: Admin"}
      </span>
      <form action={setCommissionerViewMode}>
        <input
          type="hidden"
          name="mode"
          value={viewingAsUser ? "admin" : "user"}
        />
        <Button
          type="submit"
          size="sm"
          variant={viewingAsUser ? "default" : "outline"}
          className="h-8 whitespace-nowrap rounded-lg"
          title={
            viewingAsUser
              ? "Leave coach preview and return to commissioner tools"
              : "Preview the app exactly as a regular coach sees it"
          }
        >
          {viewingAsUser ? "Switch to Admin" : "Switch to Coach view"}
        </Button>
      </form>
    </div>
  );
}

export function ViewAsUserBanner() {
  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
        <p className="text-amber-900 dark:text-amber-100">
          <span className="font-medium">Currently viewing as a coach.</span>{" "}
          Admin tools and the Admin nav are hidden until you switch back.
        </p>
        <form action={setCommissionerViewMode}>
          <input type="hidden" name="mode" value="admin" />
          <Button type="submit" size="sm">
            Switch to Admin
          </Button>
        </form>
      </div>
    </div>
  );
}
