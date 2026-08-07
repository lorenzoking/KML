import { getCoachAvatarUrl, getCoachInitials } from "@/lib/coach/avatar";
import { cn } from "@/lib/utils";

export function CoachAvatar({
  user,
  size = "md",
  className,
}: {
  user: {
    name?: string | null;
    image?: string | null;
    coachProfile?: { avatarUrl?: string | null } | null;
  };
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const url = getCoachAvatarUrl(user);
  const initials = getCoachInitials(user.name);
  const sizeClass =
    size === "sm" ? "size-10 text-xs" : size === "lg" ? "size-20 text-xl" : "size-14 text-sm";

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={user.name ?? "Coach"}
        className={cn(
          "shrink-0 rounded-full border border-[var(--border)] object-cover",
          sizeClass,
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--primary)_18%,var(--muted))] font-semibold text-[var(--foreground)]",
        sizeClass,
        className
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}
