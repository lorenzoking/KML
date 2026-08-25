import type { MaddenInputs } from "@/lib/contracts/types";
import { cn } from "@/lib/utils";

export function MaddenFields({ inputs }: { inputs: MaddenInputs }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Stat label="Contract Year" value="1" mono />
      <Stat label="Length" value={String(inputs.length)} mono />
      <Stat label="Total Salary" value={inputs.totalSalary.toFixed(1)} mono />
      <Stat label="Signing Bonus" value={inputs.signingBonus.toFixed(1)} mono />
    </div>
  );
}

export function Stat({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className={cn("mt-0.5 text-sm font-semibold", mono && "font-mono")}>{value}</p>
    </div>
  );
}
