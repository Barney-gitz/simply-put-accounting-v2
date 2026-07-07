"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "./sign-out-button";

const navigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Clients", href: "/clients" },
  { name: "Administration", href: "/administration" },
];

type AppSidebarProps = {
  firstName: string;
  lastName: string;
};

export function AppSidebar({ firstName, lastName }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-60 flex-col border-r border-gray-200 bg-white">
      <div className="px-5 py-6">
        <Image
          src="/simply-put-logo.webp"
          alt="Simply Put"
          width={150}
          height={80}
          priority
        />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navigation.map((item) => {
          const active = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-[#6BC1B7]/15 text-[#2F7F77]"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-4">
        <div className="mb-3 rounded-xl bg-gray-50 px-4 py-3">
          <p className="text-sm font-medium text-gray-900">
            {firstName} {lastName}
          </p>
          <p className="text-xs text-gray-500">Signed in</p>
        </div>

        <SignOutButton />
      </div>
    </aside>
  );
}