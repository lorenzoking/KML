/** Prefer custom coach avatar, then Google/user image. */
export function getCoachAvatarUrl(user: {
  image?: string | null;
  coachProfile?: { avatarUrl?: string | null } | null;
}) {
  return user.coachProfile?.avatarUrl?.trim() || user.image?.trim() || null;
}

export function getCoachInitials(name?: string | null) {
  const source = (name?.trim() || "Coach").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
