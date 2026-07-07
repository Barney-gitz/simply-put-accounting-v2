"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function SaveToast({ show }: { show: boolean }) {
  const router = useRouter();
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);

    if (!show) return;

    window.history.replaceState(
      null,
      "",
      window.location.pathname
    );

    const timer = window.setTimeout(() => {
      setVisible(false);
      router.refresh();
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [show, router]);

  if (!visible) return null;

  return (
    <div className="fixed right-6 top-6 z-50 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-700 shadow-lg">
      Saved changes
    </div>
  );
}