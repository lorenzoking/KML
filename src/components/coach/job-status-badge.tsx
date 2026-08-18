import { Badge } from "@/components/ui/badge";
import { formatJobStatus, jobStatusBadgeVariant } from "@/lib/coach/job-security";

export function JobStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <Badge variant={jobStatusBadgeVariant(status)} className={className}>
      {formatJobStatus(status)}
    </Badge>
  );
}
