/** Public-facing coach label — never falls back to email. */
export function displayCoachName(
  user: { name?: string | null } | null | undefined,
  fallback = "Unnamed coach"
) {
  const name = user?.name?.trim();
  return name || fallback;
}
