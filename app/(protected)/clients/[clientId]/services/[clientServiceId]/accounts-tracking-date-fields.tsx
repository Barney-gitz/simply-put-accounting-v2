"use client";

import { useState } from "react";

import { calculateAccountsFilingDeadline } from "@/lib/services/accounts-tracking/date-rules";

export function AccountsTrackingDateFields({
  defaultPeriodEndDate,
  defaultFilingDeadline,
  disabled = false,
}: {
  defaultPeriodEndDate: string | null;
  defaultFilingDeadline: string | null;
  disabled?: boolean;
}) {
  const [periodEndDate, setPeriodEndDate] =
    useState(defaultPeriodEndDate ?? "");

  const [filingDeadline, setFilingDeadline] =
    useState(defaultFilingDeadline ?? "");

  function handlePeriodEndDateChange(
    value: string
  ) {
    setPeriodEndDate(value);

    if (!value) {
      setFilingDeadline("");
      return;
    }

    try {
      setFilingDeadline(
        calculateAccountsFilingDeadline(value)
      );
    } catch {
      setFilingDeadline("");
    }
  }

  return (
    <>
      <div>
        <label className="text-sm font-medium text-gray-700">
          Year End
        </label>

        <input
          type="date"
          name="periodEndDate"
          value={periodEndDate}
          disabled={disabled}
          onChange={(event) =>
            handlePeriodEndDateChange(
              event.target.value
            )
          }
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#6BC1B7] focus:ring-2 focus:ring-[#6BC1B7]/20 disabled:bg-gray-50 disabled:text-gray-500"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">
          Filing Deadline
        </label>

        <input
          type="date"
          name="filingDeadline"
          value={filingDeadline}
          readOnly
          disabled={disabled}
          className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none disabled:text-gray-500"
        />

        {!disabled && (
          <p className="mt-1 text-xs text-gray-400">
            Calculated automatically from the year end.
          </p>
        )}
      </div>
    </>
  );
}