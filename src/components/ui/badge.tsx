import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-[var(--secondary)] text-[var(--secondary-foreground)]",
        pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
        approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        rejected: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
        elite: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
        stable: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
        pressured: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
        hotseat: "bg-red-500/15 text-red-700 dark:text-red-300",
        outline: "border border-[var(--border)] text-[var(--foreground)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
