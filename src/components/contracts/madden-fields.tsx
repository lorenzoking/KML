import type { MaddenInputs } from "@/lib/contracts/types";
import { cn } from "@/lib/utils";

export function MaddenFields({
  inputs,
  size = "default",
}: {
  inputs: MaddenInputs;
  size?: "default" | "lg";
}) {
  const large = size === "lg";
  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4", large && "gap-3")}>
      <Stat label="Contract Year" value="1" mono large={large} />
      <Stat label="Length" value={String(inputs.length)} mono large={large} />
      <Stat label="Total Salary" value={inputs.totalSalary.toFixed(1)} mono large={large} />
      <Stat label="Signing Bonus" value={inputs.signingBonus.toFixed(1)} mono large={large} />
    </div>
  );
}

export function Stat({
  label,
  value,
  mono,
  large,
}: {
  label: string;
  value: string;
  mono?: boolean;
  large?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 px-3 py-2",
        large && "px-4 py-3"
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-semibold",
          large ? "text-2xl" : "text-sm",
          mono && "font-mono"
        )}
      >
        {value}
      </p>
    </div>
  );
}
