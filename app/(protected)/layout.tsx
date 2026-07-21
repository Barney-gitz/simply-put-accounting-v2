import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getCurrentStaffUser } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staffUser = await getCurrentStaffUser();

  if (!staffUser) {
    redirect("/login");
  }

  return (
    <AppShell
      firstName={staffUser.firstName}
      lastName={staffUser.lastName}
    >
      {children}
    </AppShell>
  );
}