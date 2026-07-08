"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef, useState, useTransition } from "react";

import { updateSelfAssessmentWorkspaceAction } from "./self-assessment-actions";

type SaveState = "idle" | "dirty" | "saving" | "saved";

export function SelfAssessmentWorkspaceForm({
  clientName,
  serviceName,
  currentTaxYear,
  profileId,
  taxYearId,
  isReadOnly = false,
  currentYearHref,
  children,
}: {
  clientName: string;
  serviceName: string;
  currentTaxYear: string;
  profileId: string;
  taxYearId: string;
  isReadOnly?: boolean;
  currentYearHref?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const savedTimerRef = useRef<number | null>(null);

  const hasUnsavedChanges = !isReadOnly && saveState === "dirty";

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) {
        window.clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  return (
    <form
      onChange={() => {
        if (!isReadOnly && saveState !== "saving") {
          setSaveState("dirty");
        }
      }}
      onSubmit={(event) => {
        event.preventDefault();

        if (!hasUnsavedChanges || isPending) {
          return;
        }

        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          setSaveState("saving");

          const result = await updateSelfAssessmentWorkspaceAction(formData);

          if (!result.success) {
            setSaveState("dirty");
            return;
          }

          router.refresh();
          setSaveState("saved");

          savedTimerRef.current = window.setTimeout(() => {
            setSaveState("idle");
          }, 2000);
        });
      }}
    >
      <input type="hidden" name="profileId" value={profileId} />
      <input type="hidden" name="taxYearId" value={taxYearId} />

      <div className="mt-4 flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              {serviceName}
            </h1>
          </div>

          <p className="mt-2 text-sm text-gray-600">
            {clientName} ·{" "}
            {isReadOnly
                ? `Historical tax year ${currentTaxYear}`
                : `Current year ${currentTaxYear}`}
          </p>
        </div>

        {isReadOnly ? (
            <div className="text-right">
                <span className="inline-flex rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800">
                Historical · Read Only
                </span>

                {currentYearHref && (
                <a
                    href={currentYearHref}
                    className="mt-2 block text-sm font-medium text-orange-800 underline underline-offset-4 hover:text-orange-700"
                >
                    ← Return to current tax year
                </a>
                )}
            </div>
            ) : (
            <button
                type="submit"
                disabled={saveState !== "dirty"}
                className={getButtonClassName(saveState, hasUnsavedChanges)}
            >
                {getButtonLabel(saveState)}
            </button>
            )}
      </div>

      <div className="mt-8">{children}</div>
    </form>
  );
}

function getButtonLabel(saveState: SaveState) {
  if (saveState === "saving") return "Saving...";
  if (saveState === "saved") return "✓ Saved";
  return "Save Changes";
}

function getButtonClassName(saveState: SaveState, hasUnsavedChanges: boolean) {
  const base =
    "rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed";

  if (saveState === "saved") {
    return `${base} bg-emerald-600 text-white`;
  }

  if (hasUnsavedChanges || saveState === "saving") {
    return `${base} bg-[#6BC1B7] text-white hover:bg-[#58B2A8]`;
  }

  return `${base} border border-gray-200 bg-gray-50 text-gray-400`;
}