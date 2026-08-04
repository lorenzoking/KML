import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/constants";
import type { SubmissionStatus } from "@prisma/client";
import {
  reputationBadgeVariant,
  type ReputationLabel,
} from "@/lib/reputation";

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const variant =
    status === "PENDING"
      ? "pending"
      : status === "APPROVED"
        ? "approved"
        : "rejected";
  return <Badge variant={variant}>{STATUS_LABELS[status]}</Badge>;
}

export function ReputationBadge({
  label,
  score,
}: {
  label: ReputationLabel;
  score?: number;
}) {
  return (
    <Badge variant={reputationBadgeVariant(label)}>
      {label}
      {typeof score === "number" ? ` · ${score}` : ""}
    </Badge>
  );
}
