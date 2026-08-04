import { setCommissionerViewMode } from "@/actions/view-mode";
import { Button } from "@/components/ui/button";

export function ViewModeToggle({
  viewingAsUser,
}: {
  viewingAsUser: boolean;
}) {
  return (
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
        title={
          viewingAsUser
            ? "Switch back to full commissioner tools"
            : "Preview the app as a regular coach"
        }
      >
        {viewingAsUser ? "Admin mode" : "User mode"}
      </Button>
    </form>
  );
}

export function ViewAsUserBanner() {
  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
        <p className="text-amber-900 dark:text-amber-100">
          <span className="font-medium">User mode:</span> you&apos;re seeing the
          app as a regular coach. Admin tools are hidden.
        </p>
        <form action={setCommissionerViewMode}>
          <input type="hidden" name="mode" value="admin" />
          <Button type="submit" size="sm" variant="outline">
            Exit to Admin mode
          </Button>
        </form>
      </div>
    </div>
  );
}
