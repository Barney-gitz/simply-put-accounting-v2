import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { accountsTrackingPeriods } from "@/db/schema/accounts-tracking";
import { staffUsers } from "@/db/schema/staff-users";
import { calculateAccountsFilingDeadline } from "@/lib/services/accounts-tracking/date-rules";

import { getAccountsTrackingProgressLabel } from "./progress-labels";
import { calculateServiceUrgency } from "./urgency";
import type {
  BaseClientService,
  ClientServiceSummary,
} from "./types";

export async function buildAccountsTrackingSummary({
  clientId,
  service,
}: {
  clientId: string;
  service: BaseClientService;
}): Promise<ClientServiceSummary> {
  const workspaceHref =
    `/clients/${clientId}/services/${service.clientServiceId}`;

  const rows = await db
    .select({
      periodEndDate: accountsTrackingPeriods.periodEndDate,
      filingDeadline: accountsTrackingPeriods.filingDeadline,
      progressStatus: accountsTrackingPeriods.progressStatus,

      assignedFirstName: staffUsers.firstName,
      assignedLastName: staffUsers.lastName,
    })
    .from(accountsTrackingPeriods)
    .leftJoin(
      staffUsers,
      eq(
        accountsTrackingPeriods.assignedToStaffId,
        staffUsers.id
      )
    )
    .where(
      and(
        eq(
          accountsTrackingPeriods.clientServiceId,
          service.clientServiceId
        ),
        eq(accountsTrackingPeriods.isCurrent, true)
      )
    )
    .limit(1);

  const currentPeriod = rows[0];

  if (!currentPeriod) {
    return {
      clientServiceId: service.clientServiceId,
      serviceTypeId: service.serviceTypeId,

      serviceCode: service.serviceCode,
      serviceName: service.serviceName,
      serviceStatus: service.serviceStatus,

      workspaceHref,

      periodLabel: null,

      progressStatus: null,
      progressLabel: null,

      assignedTo: null,

      yearEnd: null,
      filingDeadline: null,

      nextDeadline: null,
      urgency: "normal",
      daysUntilDeadline: null,

      summaryState: "missing_current_period",
    };
  }

  const filingDeadline =
    currentPeriod.filingDeadline ??
    (currentPeriod.periodEndDate
      ? calculateAccountsFilingDeadline(
          currentPeriod.periodEndDate
        )
      : null);

  const urgency = calculateServiceUrgency({
    deadline: filingDeadline,
    progressStatus: currentPeriod.progressStatus,
    serviceStatus: service.serviceStatus,
  });

  return {
    clientServiceId: service.clientServiceId,
    serviceTypeId: service.serviceTypeId,

    serviceCode: service.serviceCode,
    serviceName: service.serviceName,
    serviceStatus: service.serviceStatus,

    workspaceHref,

    periodLabel: currentPeriod.periodEndDate
      ? formatAccountsPeriodLabel(
          currentPeriod.periodEndDate
        )
      : null,

    progressStatus: currentPeriod.progressStatus,
    progressLabel: getAccountsTrackingProgressLabel(
      currentPeriod.progressStatus
    ),

    assignedTo: formatStaffName(
      currentPeriod.assignedFirstName,
      currentPeriod.assignedLastName
    ),

    yearEnd: currentPeriod.periodEndDate,
    filingDeadline,

    nextDeadline: filingDeadline,
    urgency: urgency.urgency,
    daysUntilDeadline: urgency.daysUntilDeadline,

    summaryState: "ready",
  };
}

function formatAccountsPeriodLabel(
  periodEndDate: string
) {
  return `Year ended ${formatDate(periodEndDate)}`;
}

function formatDate(value: string) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return value;
  }

  const [, year, month, day] = match;

  const date = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day)
    )
  );

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatStaffName(
  firstName: string | null,
  lastName: string | null
) {
  const name = [
    firstName,
    lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return name || null;
}