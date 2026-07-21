import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { accountsTrackingPeriods } from "@/db/schema/accounts-tracking";
import { clients } from "@/db/schema/clients";
import { clientServices } from "@/db/schema/client-services";
import { serviceTypes } from "@/db/schema/service-types";
import {
  selfAssessmentProfiles,
  selfAssessmentTaxYears,
} from "@/db/schema/self-assessment";
import { staffUsers } from "@/db/schema/staff-users";

import { calculateAccountsFilingDeadline } from "@/lib/services/accounts-tracking/date-rules";
import {
  getAccountsTrackingProgressLabel,
  getSelfAssessmentProgressLabel,
} from "@/lib/services/client-overview/progress-labels";
import { calculateServiceUrgency } from "@/lib/services/client-overview/urgency";
import { calculateSelfAssessmentDates } from "@/lib/services/self-assessment/date-rules";

import type {
  DashboardOverview,
  DashboardServiceCount,
  DashboardWorkItem,
} from "./types";

const COMPLETED_PROGRESS_STATUSES = new Set([
  "filed",
  "not_applicable",
  "not_applicable_this_year",
]);

const WAITING_ON_CLIENT_STATUSES = new Set([
  "records_requested",
  "waiting_for_records",
  "with_client",
]);

const SERVICE_PRIORITY: Record<string, number> = {
  self_assessment: 1,
  accounts_tracking: 2,
  confirmation_statement: 3,
  vat: 4,
  paye: 5,
  cis: 6,
  mtd_itsa: 7,
  aml: 8,
};

export async function getDashboardOverview({
  staffUserId,
}: {
  staffUserId: string;
}): Promise<DashboardOverview> {
  const [selfAssessmentItems, accountsTrackingItems] =
    await Promise.all([
      getSelfAssessmentWorkItems(),
      getAccountsTrackingWorkItems(),
    ]);

  const allWorkItems = [
    ...selfAssessmentItems,
    ...accountsTrackingItems,
  ]
    .filter(
      (item) =>
        !COMPLETED_PROGRESS_STATUSES.has(
          item.progressStatus
        )
    )
    .sort(compareWorkItems);

  const myWork = allWorkItems
    .filter(
      (item) =>
        item.assignedToStaffId === staffUserId
    )
    .slice(0, 6);

  const firmUrgentWork = allWorkItems
    .filter(
      (item) =>
        item.urgency === "overdue" ||
        item.urgency ===
          "due_within_two_weeks"
    )
    .slice(0, 8);

  const upcomingDeadlines = allWorkItems
    .filter(
      (item) =>
        item.daysUntilDeadline !== null &&
        item.daysUntilDeadline >= 0 &&
        item.daysUntilDeadline <= 28
    )
    .sort(compareDeadlines)
    .slice(0, 8);

  return {
    metrics: {
      overdue: allWorkItems.filter(
        (item) => item.urgency === "overdue"
      ).length,

      dueWithinSevenDays: allWorkItems.filter(
        (item) =>
          item.daysUntilDeadline !== null &&
          item.daysUntilDeadline >= 0 &&
          item.daysUntilDeadline <= 7
      ).length,

      dueWithinTwentyEightDays:
        allWorkItems.filter(
          (item) =>
            item.daysUntilDeadline !== null &&
            item.daysUntilDeadline >= 0 &&
            item.daysUntilDeadline <= 28
        ).length,

      waitingOnClient: allWorkItems.filter(
        (item) =>
          WAITING_ON_CLIENT_STATUSES.has(
            item.progressStatus
          )
      ).length,

      totalActiveWork: allWorkItems.length,
    },

    myWork,
    firmUrgentWork,
    upcomingDeadlines,

    workloadByService:
      buildWorkloadByService(allWorkItems),
  };
}

async function getSelfAssessmentWorkItems(): Promise<
  DashboardWorkItem[]
> {
  const rows = await db
    .select({
      clientId: clients.id,
      clientName: clients.displayName,

      clientServiceId: clientServices.id,
      serviceCode: serviceTypes.code,
      serviceName: serviceTypes.name,

      taxYear: selfAssessmentTaxYears.taxYear,
      progressStatus:
        selfAssessmentTaxYears.progressStatus,

      assignedToStaffId:
        selfAssessmentTaxYears.assignedToStaffId,

      assignedFirstName: staffUsers.firstName,
      assignedLastName: staffUsers.lastName,
    })
    .from(selfAssessmentTaxYears)
    .innerJoin(
      selfAssessmentProfiles,
      eq(
        selfAssessmentTaxYears
          .selfAssessmentProfileId,
        selfAssessmentProfiles.id
      )
    )
    .innerJoin(
      clientServices,
      eq(
        selfAssessmentProfiles.clientServiceId,
        clientServices.id
      )
    )
    .innerJoin(
      clients,
      eq(clientServices.clientId, clients.id)
    )
    .innerJoin(
      serviceTypes,
      eq(
        clientServices.serviceTypeId,
        serviceTypes.id
      )
    )
    .leftJoin(
      staffUsers,
      eq(
        selfAssessmentTaxYears
          .assignedToStaffId,
        staffUsers.id
      )
    )
    .where(
      and(
        eq(
          selfAssessmentTaxYears.isCurrent,
          true
        ),
        eq(clientServices.status, "active"),
        eq(clients.status, "active")
      )
    );

  return rows.map((row) => {
    const dates =
      calculateSelfAssessmentDates(
        row.taxYear
      );

    const urgency = calculateServiceUrgency({
      deadline: dates.filingDeadline,
      progressStatus: row.progressStatus,
      serviceStatus: "active",
    });

    return {
      clientId: row.clientId,
      clientName: row.clientName,

      clientServiceId: row.clientServiceId,
      serviceCode: row.serviceCode,
      serviceName: row.serviceName,

      periodLabel: `${row.taxYear} Tax Year`,

      progressStatus: row.progressStatus,
      progressLabel:
        getSelfAssessmentProgressLabel(
          row.progressStatus
        ),

      assignedToStaffId:
        row.assignedToStaffId,

      assignedTo: formatStaffName(
        row.assignedFirstName,
        row.assignedLastName
      ),

      deadline: dates.filingDeadline,
      urgency: urgency.urgency,
      daysUntilDeadline:
        urgency.daysUntilDeadline,

      workspaceHref:
        `/clients/${row.clientId}/services/${row.clientServiceId}`,
    };
  });
}

async function getAccountsTrackingWorkItems(): Promise<
  DashboardWorkItem[]
> {
  const rows = await db
    .select({
      clientId: clients.id,
      clientName: clients.displayName,

      clientServiceId: clientServices.id,
      serviceCode: serviceTypes.code,
      serviceName: serviceTypes.name,

      periodEndDate:
        accountsTrackingPeriods.periodEndDate,

      filingDeadline:
        accountsTrackingPeriods.filingDeadline,

      progressStatus:
        accountsTrackingPeriods.progressStatus,

      assignedToStaffId:
        accountsTrackingPeriods.assignedToStaffId,

      assignedFirstName: staffUsers.firstName,
      assignedLastName: staffUsers.lastName,
    })
    .from(accountsTrackingPeriods)
    .innerJoin(
      clientServices,
      eq(
        accountsTrackingPeriods
          .clientServiceId,
        clientServices.id
      )
    )
    .innerJoin(
      clients,
      eq(clientServices.clientId, clients.id)
    )
    .innerJoin(
      serviceTypes,
      eq(
        clientServices.serviceTypeId,
        serviceTypes.id
      )
    )
    .leftJoin(
      staffUsers,
      eq(
        accountsTrackingPeriods
          .assignedToStaffId,
        staffUsers.id
      )
    )
    .where(
      and(
        eq(
          accountsTrackingPeriods.isCurrent,
          true
        ),
        eq(clientServices.status, "active"),
        eq(clients.status, "active")
      )
    );

  return rows.flatMap((row) => {
    if (!row.periodEndDate) {
      return [];
    }

    const filingDeadline =
      row.filingDeadline ??
      calculateAccountsFilingDeadline(
        row.periodEndDate
      );

    const urgency = calculateServiceUrgency({
      deadline: filingDeadline,
      progressStatus: row.progressStatus,
      serviceStatus: "active",
    });

    return [
      {
        clientId: row.clientId,
        clientName: row.clientName,

        clientServiceId: row.clientServiceId,
        serviceCode: row.serviceCode,
        serviceName: row.serviceName,

        periodLabel: `Year ended ${formatDate(
          row.periodEndDate
        )}`,

        progressStatus: row.progressStatus,
        progressLabel:
          getAccountsTrackingProgressLabel(
            row.progressStatus
          ),

        assignedToStaffId:
          row.assignedToStaffId,

        assignedTo: formatStaffName(
          row.assignedFirstName,
          row.assignedLastName
        ),

        deadline: filingDeadline,
        urgency: urgency.urgency,
        daysUntilDeadline:
          urgency.daysUntilDeadline,

        workspaceHref:
          `/clients/${row.clientId}/services/${row.clientServiceId}`,
      },
    ];
  });
}

function buildWorkloadByService(
  items: DashboardWorkItem[]
): DashboardServiceCount[] {
  const counts = new Map<
    string,
    DashboardServiceCount
  >();

  for (const item of items) {
    const existing = counts.get(
      item.serviceCode
    );

    if (existing) {
      existing.count += 1;
      continue;
    }

    counts.set(item.serviceCode, {
      serviceCode: item.serviceCode,
      serviceName: item.serviceName,
      count: 1,
    });
  }

  return [...counts.values()].sort(
    (a, b) => {
      const countDifference =
        b.count - a.count;

      if (countDifference !== 0) {
        return countDifference;
      }

      return (
        getServicePriority(
          a.serviceCode
        ) -
        getServicePriority(
          b.serviceCode
        )
      );
    }
  );
}

function compareDeadlines(
  a: DashboardWorkItem,
  b: DashboardWorkItem
) {
  const difference =
    (a.daysUntilDeadline ??
      Number.MAX_SAFE_INTEGER) -
    (b.daysUntilDeadline ??
      Number.MAX_SAFE_INTEGER);

  if (difference !== 0) {
    return difference;
  }

  return compareWorkItems(a, b);
}

function compareWorkItems(
  a: DashboardWorkItem,
  b: DashboardWorkItem
) {
  const urgencyDifference =
    getUrgencyPriority(a) -
    getUrgencyPriority(b);

  if (urgencyDifference !== 0) {
    return urgencyDifference;
  }

  const deadlineDifference =
    (a.daysUntilDeadline ??
      Number.MAX_SAFE_INTEGER) -
    (b.daysUntilDeadline ??
      Number.MAX_SAFE_INTEGER);

  if (deadlineDifference !== 0) {
    return deadlineDifference;
  }

  const serviceDifference =
    getServicePriority(a.serviceCode) -
    getServicePriority(b.serviceCode);

  if (serviceDifference !== 0) {
    return serviceDifference;
  }

  return a.clientName.localeCompare(
    b.clientName
  );
}

function getUrgencyPriority(
  item: DashboardWorkItem
) {
  switch (item.urgency) {
    case "overdue":
      return 0;

    case "due_within_two_weeks":
      return 1;

    case "due_within_four_weeks":
      return 2;

    case "normal":
      return 3;
  }
}

function getServicePriority(
  serviceCode: string
) {
  return (
    SERVICE_PRIORITY[serviceCode] ?? 999
  );
}

function formatStaffName(
  firstName: string | null,
  lastName: string | null
) {
  const name = [firstName, lastName]
    .filter(Boolean)
    .join(" ");

  return name || null;
}

function formatDate(value: string) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value
    );

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