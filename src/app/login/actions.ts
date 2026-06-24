"use server";

import { signIn } from "@/lib/auth/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  await signIn("credentials", {
    email,
    password,
    redirectTo: "/",
  });
}
