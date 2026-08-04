"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  isActualCommissioner,
  requireUser,
  setViewAsUser,
} from "@/lib/auth";

export async function setCommissionerViewMode(formData: FormData) {
  const user = await requireUser();
  if (!isActualCommissioner(user)) {
    redirect("/dashboard");
  }

  const mode = String(formData.get("mode") || "");
  if (mode === "user") {
    await setViewAsUser(true);
    revalidatePath("/", "layout");
    redirect("/dashboard?view=user");
  }

  if (mode === "admin") {
    await setViewAsUser(false);
    revalidatePath("/", "layout");
    redirect("/admin");
  }

  redirect("/dashboard");
}
