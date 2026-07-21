"use client";

import { useRouter } from "next/navigation";
import {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type SaveState = "idle" | "dirty" | "saving" | "saved";
type ArchiveState = "idle" | "archiving";

type WorkspaceActionResult = {
  success: boolean;
  error?: string;
};

type WorkspaceArchiveActionResult = {
  success: boolean;
  redirectTo?: string;
  error?: string;
};

type WorkspaceFormProps = {
  action: (
    formData: FormData
  ) => Promise<WorkspaceActionResult>;

  archiveAction?: (
    formData: FormData
  ) => Promise<WorkspaceArchiveActionResult>;

  clientName: string;
  serviceName: string;
  contextLabel: string;
  hiddenFields: Record<string, string>;
  children: ReactNode;

  serviceDotClassName?: string;
  isReadOnly?: boolean;
  currentRecordHref?: string;
  readOnlyLabel?: string;
  returnLabel?: string;

  archiveLabel?: string;
  archiveConfirmationMessage?: string;
};

export function WorkspaceForm({
  action,
  archiveAction,
  clientName,
  serviceName,
  contextLabel,
  hiddenFields,
  children,
  serviceDotClassName = "bg-gray-400",
  isReadOnly = false,
  currentRecordHref,
  readOnlyLabel = "Historical · Read Only",
  returnLabel = "Return to current record",
  archiveLabel = "Archive",
  archiveConfirmationMessage =
    "Archive this period and create the next current period?",
}: WorkspaceFormProps) {
  const router = useRouter();

  const [saveState, setSaveState] =
    useState<SaveState>("idle");

  const [archiveState, setArchiveState] =
    useState<ArchiveState>("idle");

  const [actionError, setActionError] =
    useState<string | null>(null);

  const savedTimerRef = useRef<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const hasUnsavedChanges =
    !isReadOnly && saveState === "dirty";

  const archiveIsAvailable =
    Boolean(archiveAction) &&
    !isReadOnly &&
    saveState !== "dirty" &&
    saveState !== "saving" &&
    archiveState !== "archiving";

  const markDirty = useCallback(() => {
    if (!isReadOnly) {
      setActionError(null);

      setSaveState((currentState) =>
        currentState === "saving"
          ? currentState
          : "dirty"
      );
    }
  }, [isReadOnly]);

  useEffect(() => {
    const form = formRef.current;

    if (!form) {
      return;
    }

    form.addEventListener("workspace-dirty", markDirty);

    return () => {
      form.removeEventListener(
        "workspace-dirty",
        markDirty
      );
    };
  }, [markDirty]);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) {
        window.clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  async function handleArchive() {
    if (
      !archiveAction ||
      !formRef.current ||
      !archiveIsAvailable
    ) {
      return;
    }

    const confirmed = window.confirm(
      archiveConfirmationMessage
    );

    if (!confirmed) {
      return;
    }

    setActionError(null);
    setArchiveState("archiving");

    try {
      const formData = new FormData(formRef.current);
      const result = await archiveAction(formData);

      if (!result.success) {
        setActionError(
          result.error ?? "The period could not be archived."
        );
        setArchiveState("idle");
        return;
      }

      if (!result.redirectTo) {
        setActionError(
          "The period was archived, but no destination was returned."
        );
        setArchiveState("idle");
        return;
      }

      /*
      * The current-period URL does not change after rollover.
      * Use a full navigation so the workspace state is recreated and the
      * Archive button does not remain stuck on "Archiving...".
      */
      window.location.assign(result.redirectTo);
    } catch {
      setActionError(
        "The period could not be archived."
      );
      setArchiveState("idle");
    }
  }

  return (
    <form
      ref={formRef}
      onChange={markDirty}
      onSubmit={async (event) => {
        event.preventDefault();

        if (!hasUnsavedChanges) {
          return;
        }

        const formData = new FormData(
          event.currentTarget
        );

        setActionError(null);
        setSaveState("saving");

        const savingStartedAt = Date.now();

        try {
          const result = await action(formData);

          if (!result.success) {
            setActionError(
              result.error ??
                "The workspace could not be saved."
            );
            setSaveState("dirty");
            return;
          }

          const elapsedTime =
            Date.now() - savingStartedAt;

          const minimumSavingTime = 400;

          if (elapsedTime < minimumSavingTime) {
            await new Promise((resolve) =>
              window.setTimeout(
                resolve,
                minimumSavingTime - elapsedTime
              )
            );
          }

          router.refresh();
          setSaveState("saved");

          if (savedTimerRef.current) {
            window.clearTimeout(
              savedTimerRef.current
            );
          }

          savedTimerRef.current =
            window.setTimeout(() => {
              setSaveState("idle");
            }, 2000);
        } catch {
          setActionError(
            "The workspace could not be saved."
          );
          setSaveState("dirty");
        }
      }}
    >
      {Object.entries(hiddenFields).map(
        ([name, value]) => (
          <input
            key={name}
            type="hidden"
            name={name}
            value={value}
          />
        )
      )}

      <div className="mt-4 flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span
              className={`h-3 w-3 rounded-full ${serviceDotClassName}`}
            />

            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              {serviceName}
            </h1>
          </div>

          <p className="mt-2 text-sm text-gray-600">
            {clientName} · {contextLabel}
          </p>
        </div>

        {isReadOnly ? (
          <div className="text-right">
            <span className="inline-flex rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800">
              {readOnlyLabel}
            </span>

            {currentRecordHref && (
              <a
                href={currentRecordHref}
                className="mt-2 block text-sm font-medium text-orange-800 underline underline-offset-4 hover:text-orange-700"
              >
                ← {returnLabel}
              </a>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {archiveAction && (
              <button
                type="button"
                onClick={handleArchive}
                disabled={!archiveIsAvailable}
                title={
                  hasUnsavedChanges
                    ? "Save your changes before archiving."
                    : undefined
                }
                className="w-36 rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
              >
                {archiveState === "archiving"
                  ? "Archiving..."
                  : archiveLabel}
              </button>
            )}

            <button
              type="submit"
              disabled={
                saveState !== "dirty" ||
                archiveState === "archiving"
              }
              className={getButtonClassName(
                saveState,
                hasUnsavedChanges
              )}
            >
              {getButtonLabel(saveState)}
            </button>
          </div>
        )}
      </div>

      {actionError && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {actionError}
        </div>
      )}

      <div className="mt-8">{children}</div>
    </form>
  );
}

function getButtonLabel(saveState: SaveState) {
  if (saveState === "saving") {
    return "Saving...";
  }

  if (saveState === "saved") {
    return "Saved";
  }

  return "Save";
}

function getButtonClassName(
  saveState: SaveState,
  hasUnsavedChanges: boolean
) {
  const base =
    "w-36 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed";

  if (saveState === "saved") {
    return `${base} bg-emerald-600 text-white`;
  }

  if (
    hasUnsavedChanges ||
    saveState === "saving"
  ) {
    return `${base} bg-[#6BC1B7] text-white hover:bg-[#58B2A8]`;
  }

  return `${base} border border-gray-200 bg-gray-50 text-gray-400`;
}