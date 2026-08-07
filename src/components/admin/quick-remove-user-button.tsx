"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

function RemoveSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" size="sm" disabled={pending}>
      {pending ? "Removing..." : "Remove"}
    </Button>
  );
}

export function QuickRemoveUserButton({
  userId,
  userLabel,
  action,
}: {
  userId: string;
  userLabel: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const ok = window.confirm(
          `Remove ${userLabel} from the league?\n\nThis hides them from Manage users but keeps history. You can restore later via Sync / Add by email.`
        );
        if (!ok) event.preventDefault();
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <RemoveSubmit />
    </form>
  );
}
