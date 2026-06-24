"use server";

import { redirect } from "next/navigation";
import { acceptInvite } from "@/lib/auth/invite";

export async function acceptInviteAction(token: string, formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const password = String(formData.get("password") ?? "");
  await acceptInvite({ token, name, password });
  redirect("/login");
}
