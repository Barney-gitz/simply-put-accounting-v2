"use client";

import { useRef, useState } from "react";

type CompaniesHouseCodeRow = {
  id: string;
  code: string;
  belongsTo: string;
};

export function CompaniesHouseCodesField({
  initialCodes,
  disabled = false,
}: {
  initialCodes: CompaniesHouseCodeRow[];
  disabled?: boolean;
}) {
  const [codes, setCodes] =
    useState<CompaniesHouseCodeRow[]>(initialCodes);

  const containerRef = useRef<HTMLDivElement>(null);

  function markWorkspaceDirty() {
    const form = containerRef.current?.closest("form");

    form?.dispatchEvent(
      new CustomEvent("workspace-dirty", {
        bubbles: true,
      })
    );
  }

  function updateCode(
    index: number,
    field: "code" | "belongsTo",
    value: string
  ) {
    setCodes((currentCodes) =>
      currentCodes.map((code, codeIndex) =>
        codeIndex === index
          ? {
              ...code,
              [field]: value,
            }
          : code
      )
    );
  }

  function addCode() {
    setCodes((currentCodes) => [
      ...currentCodes,
      {
        id: "",
        code: "",
        belongsTo: "",
      },
    ]);

    markWorkspaceDirty();
  }

  function removeCode(index: number) {
    setCodes((currentCodes) =>
      currentCodes.filter(
        (_, codeIndex) => codeIndex !== index
      )
    );

    markWorkspaceDirty();
  }

  return (
    <div
      ref={containerRef}
      className="mt-6 rounded-xl border border-gray-200 p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Companies House Codes
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Shared encrypted codes available to Companies House
            services.
          </p>
        </div>

        {!disabled && (
          <button
            type="button"
            onClick={addCode}
            className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Add Code
          </button>
        )}
      </div>

      {codes.length === 0 ? (
        <p className="mt-4 rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-500">
          No Companies House codes recorded.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {codes.map((code, index) => (
            <div
              key={code.id || `new-${index}`}
              className="grid gap-3 rounded-lg bg-gray-50 p-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <input
                type="hidden"
                name="companiesHouseCodeId"
                value={code.id}
              />

              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Code
                </label>

                <input
                  name="companiesHouseCode"
                  value={code.code}
                  onChange={(event) =>
                    updateCode(
                      index,
                      "code",
                      event.target.value
                    )
                  }
                  disabled={disabled}
                  autoComplete="off"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#6BC1B7] focus:ring-2 focus:ring-[#6BC1B7]/20 disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Belongs To
                </label>

                <input
                  name="companiesHouseCodeBelongsTo"
                  value={code.belongsTo}
                  onChange={(event) =>
                    updateCode(
                      index,
                      "belongsTo",
                      event.target.value
                    )
                  }
                  disabled={disabled}
                  placeholder="For example, Company"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#6BC1B7] focus:ring-2 focus:ring-[#6BC1B7]/20 disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              {!disabled && (
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeCode(index)}
                    className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 sm:w-auto"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}