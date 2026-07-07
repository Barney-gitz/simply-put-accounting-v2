"use server";

import { redirect } from "next/navigation";

import { login } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const success = await login(email, password);

  if (!success) {
    redirect("/login?error=invalid");
  }

  redirect("/dashboard");
}