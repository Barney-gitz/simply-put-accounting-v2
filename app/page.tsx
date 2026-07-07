import { redirect } from "next/navigation";

import { getCurrentStaffUser } from "@/lib/auth";

export default async function HomePage() {
  const staffUser = await getCurrentStaffUser();

  if (staffUser) {
    redirect("/dashboard");
  }

  redirect("/login");
}