import "server-only";

import {
  calculateAccountsFilingDeadline,
  getNextAccountsPeriodEnd,
} from "./date-rules";

type AccountsTrackingCurrentPeriod = {
  periodEndDate: string | null;
  assignedToStaffId: string | null;
  approvedByStaffId: string | null;
};

export type NextAccountsTrackingPeriod = {
  periodEndDate: string;
  filingDeadline: string;
  progressStatus: "not_started";
  assignedToStaffId: string | null;
  approvedByStaffId: string | null;
  filedAt: null;
  notes: null;
  isCurrent: true;
};

export function buildNextAccountsTrackingPeriod(
  currentPeriod: AccountsTrackingCurrentPeriod
): NextAccountsTrackingPeriod {
  if (!currentPeriod.periodEndDate) {
    throw new Error(
      "Accounts Tracking cannot be archived until a year-end date has been entered."
    );
  }

  const nextPeriodEndDate =
    getNextAccountsPeriodEnd(
      currentPeriod.periodEndDate
    );

  return {
    periodEndDate: nextPeriodEndDate,
    filingDeadline:
      calculateAccountsFilingDeadline(
        nextPeriodEndDate
      ),
    progressStatus: "not_started",
    assignedToStaffId:
      currentPeriod.assignedToStaffId,
    approvedByStaffId:
      currentPeriod.approvedByStaffId,
    filedAt: null,
    notes: null,
    isCurrent: true,
  };
}