import { redirect } from "next/navigation";

export default async function StandingsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  qs.set("tab", "standings");
  Object.entries(params).forEach(([key, value]) => {
    if (value) qs.set(key, value);
  });
  redirect(`/games?${qs.toString()}`);
}
