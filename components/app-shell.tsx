"use client";

import { useEffect, useState } from "react";

import { AppSidebar } from "@/components/app-sidebar";

type AppShellProps = {
  firstName: string;
  lastName: string;
  children: React.ReactNode;
};

const SIDEBAR_PIN_STORAGE_KEY = "simply-put-sidebar-pinned";

export function AppShell({
  firstName,
  lastName,
  children,
}: AppShellProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [hasLoadedPreference, setHasLoadedPreference] =
    useState(false);

  useEffect(() => {
    const storedPreference = window.localStorage.getItem(
      SIDEBAR_PIN_STORAGE_KEY
    );

    setIsPinned(storedPreference === "true");
    setHasLoadedPreference(true);
  }, []);

  function handlePinnedChange(nextPinned: boolean) {
    setIsPinned(nextPinned);

    window.localStorage.setItem(
      SIDEBAR_PIN_STORAGE_KEY,
      String(nextPinned)
    );
  }

  const isExpanded = isPinned || isHovered;

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <AppSidebar
        firstName={firstName}
        lastName={lastName}
        isExpanded={isExpanded}
        isPinned={isPinned}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onPinnedChange={handlePinnedChange}
      />

      <main
        className={`min-h-screen transition-[padding-left] duration-200 ease-out ${
          isExpanded ? "pl-60" : "pl-20"
        } ${
          hasLoadedPreference
            ? ""
            : "motion-reduce:transition-none"
        }`}
      >
        <div className="mx-auto w-full max-w-[1800px] px-6 py-8 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}