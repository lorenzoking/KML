import { redirect } from "next/navigation";

export default function SubmissionsRedirectPage() {
  redirect("/games?tab=week");
}
