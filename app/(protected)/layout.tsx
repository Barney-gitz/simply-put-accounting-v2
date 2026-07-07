import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
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
    <div className="min-h-screen bg-[#F6F8FB]">
      <AppSidebar
        firstName={staffUser.firstName}
        lastName={staffUser.lastName}
      />

      <main className="pl-60">
        <div className="mx-auto max-w-7xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}