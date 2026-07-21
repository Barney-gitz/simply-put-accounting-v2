"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "./sign-out-button";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: DashboardIcon,
  },
  {
    name: "Clients",
    href: "/clients",
    icon: ClientsIcon,
  },
  {
    name: "Administration",
    href: "/administration",
    icon: AdministrationIcon,
  },
];

type AppSidebarProps = {
  firstName: string;
  lastName: string;

  isExpanded: boolean;
  isPinned: boolean;

  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onPinnedChange: (isPinned: boolean) => void;
};

export function AppSidebar({
  firstName,
  lastName,
  isExpanded,
  isPinned,
  onMouseEnter,
  onMouseLeave,
  onPinnedChange,
}: AppSidebarProps) {
  const pathname = usePathname();

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <aside
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-200 ease-out ${
        isExpanded ? "w-60 shadow-lg" : "w-20 shadow-sm"
      }`}
    >
      <div className="relative flex h-28 shrink-0 items-center">
        <div
          className={`flex items-center transition-all duration-200 ${
            isExpanded
              ? "w-full justify-start px-5"
              : "w-20 justify-center px-3"
          }`}
        >
          <Image
            src="/simply-put-logo.webp"
            alt="Simply Put"
            width={150}
            height={80}
            priority
            className={`h-auto object-contain transition-[width] duration-200 ${
              isExpanded ? "w-36" : "w-11"
            }`}
          />
        </div>

        {isExpanded && (
          <button
            type="button"
            onClick={() => onPinnedChange(!isPinned)}
            title={
              isPinned
                ? "Unpin sidebar"
                : "Pin sidebar open"
            }
            aria-label={
              isPinned
                ? "Unpin sidebar"
                : "Pin sidebar open"
            }
            aria-pressed={isPinned}
            className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg border transition ${
              isPinned
                ? "border-[#6BC1B7] bg-[#6BC1B7]/15 text-[#2F7F77]"
                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <PinIcon isPinned={isPinned} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-2 px-3">
        {navigation.map((item) => {
          const active =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={!isExpanded ? item.name : undefined}
              className={`flex h-12 items-center rounded-xl transition ${
                active
                  ? "bg-[#6BC1B7]/15 text-[#2F7F77]"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="flex w-14 shrink-0 items-center justify-center">
                <Icon />
              </span>

              <span
                className={`whitespace-nowrap text-sm font-medium transition-opacity duration-150 ${
                  isExpanded
                    ? "opacity-100"
                    : "pointer-events-none opacity-0"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-gray-100 px-3 py-4">
        <div className="mb-3 flex h-14 items-center rounded-xl bg-gray-50">
          <div className="flex w-14 shrink-0 items-center justify-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6BC1B7] text-xs font-semibold text-white">
              {initials}
            </span>
          </div>

          <div
            className={`min-w-0 whitespace-nowrap transition-opacity duration-150 ${
              isExpanded
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            }`}
          >
            <p className="truncate text-sm font-medium text-gray-900">
              {firstName} {lastName}
            </p>

            <p className="text-xs text-gray-500">
              Signed in
            </p>
          </div>
        </div>

        <div
          className={`sidebar-sign-out ${
            isExpanded
              ? "sidebar-sign-out-expanded"
              : ""
          }`}
        >
          <SignOutButton />
        </div>
      </div>

      <style jsx global>{`
        .sidebar-sign-out button {
          display: flex;
          height: 48px;
          width: 100%;
          align-items: center;
          overflow: hidden;
          white-space: nowrap;
          border-radius: 12px;
          padding-left: 17px;
          padding-right: 17px;
          transition:
            background-color 150ms ease,
            color 150ms ease;
        }

        .sidebar-sign-out button:hover {
          background: rgb(243 244 246);
        }

        .sidebar-sign-out button::before {
          content: "↪";
          display: inline-flex;
          width: 30px;
          flex-shrink: 0;
          align-items: center;
          font-size: 18px;
        }

        .sidebar-sign-out button {
          font-size: 0;
        }

        .sidebar-sign-out-expanded button {
          font-size: 14px;
        }
      `}</style>
    </aside>
  );
}

function PinIcon({
  isPinned,
}: {
  isPinned: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="m8 4 8 8M14.5 3.5l6 6-3 1-4 4-1 4-3-3-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {isPinned && (
        <circle
          cx="18"
          cy="18"
          r="3"
          fill="currentColor"
          stroke="none"
        />
      )}
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClientsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M16 20v-1.5A3.5 3.5 0 0 0 12.5 15h-5A3.5 3.5 0 0 0 4 18.5V20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle
        cx="10"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M16 5.5a3 3 0 0 1 0 5.8M18 15.4a3.5 3.5 0 0 1 2 3.1V20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AdministrationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="m19 13.5 1.5 1.1-2 3.4-1.8-.8a7.4 7.4 0 0 1-2.2 1.3l-.2 2H9.7l-.2-2a7.4 7.4 0 0 1-2.2-1.3l-1.8.8-2-3.4L5 13.5a7.5 7.5 0 0 1 0-3L3.5 9.4l2-3.4 1.8.8a7.4 7.4 0 0 1 2.2-1.3l.2-2h4.6l.2 2a7.4 7.4 0 0 1 2.2 1.3l1.8-.8 2 3.4-1.5 1.1a7.5 7.5 0 0 1 0 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}