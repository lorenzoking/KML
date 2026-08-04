import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--card)]/70 px-3.5 py-2 text-base shadow-sm outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[var(--muted-foreground)] focus-visible:border-[var(--ring)] focus-visible:bg-[var(--card)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--ring)_25%,transparent)] sm:h-10 sm:text-sm",
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";
