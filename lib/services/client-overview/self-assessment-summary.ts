import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import {
  selfAssessmentProfiles,
  selfAssessmentTaxYears,
} from "@/db/schema/self-assessment";
import { staffUsers } from "@/db/schema/staff-users";
import { calculateSelfAssessmentDates } from "@/lib/services/self-assessment/date-rules";

import { getSelfAssessmentProgressLabel } from "./progress-labels";
import { calculateServiceUrgency } from "./urgency";
import type {
  BaseClientService,
  ClientServiceSummary,
} from "./types";

export async function buildSelfAssessmentSummary({
  clientId,
  service,
}: {
  clientId: string;
  service: BaseClientService;
}): Promise<ClientServiceSummary> {
  const workspaceHref = `/clients/${clientId}/services/${service.clientServiceId}`;

  const rows = await db
    .select({
      taxYear: selfAssessmentTaxYears.taxYear,
      progressStatus: selfAssessmentTaxYears.progressStatus,
      assignedFirstName: staffUsers.firstName,
      assignedLastName: staffUsers.lastName,
    })
    .from(selfAssessmentProfiles)
    .innerJoin(
      selfAssessmentTaxYears,
      and(
        eq(
          selfAssessmentTaxYears.selfAssessmentProfileId,
          selfAssessmentProfiles.id
        ),
        eq(selfAssessmentTaxYears.isCurrent, true)
      )
    )
    .leftJoin(
      staffUsers,
      eq(
        selfAssessmentTaxYears.assignedToStaffId,
        staffUsers.id
      )
    )
    .where(
      eq(
        selfAssessmentProfiles.clientServiceId,
        service.clientServiceId
      )
    )
    .limit(1);

  const currentYear = rows[0];

  if (!currentYear) {
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

      summaryState: "missing_current_period",
        nextDeadline: null,
        urgency: "normal",
        daysUntilDeadline: null,
    };
  }

  const dates = calculateSelfAssessmentDates(currentYear.taxYear);

  const urgency = calculateServiceUrgency({
    deadline: dates.filingDeadline,
    progressStatus: currentYear.progressStatus,
    serviceStatus: service.serviceStatus,
    });  

  return {
    clientServiceId: service.clientServiceId,
    serviceTypeId: service.serviceTypeId,
    serviceCode: service.serviceCode,
    serviceName: service.serviceName,
    serviceStatus: service.serviceStatus,
    workspaceHref,

    periodLabel: currentYear.taxYear,

    progressStatus: currentYear.progressStatus,
    progressLabel: getSelfAssessmentProgressLabel(
      currentYear.progressStatus
    ),

    assignedTo: formatStaffName(
      currentYear.assignedFirstName,
      currentYear.assignedLastName
    ),

    yearEnd: dates.yearEnd,
    filingDeadline: dates.filingDeadline,

    nextDeadline: dates.filingDeadline,
    urgency: urgency.urgency,
    daysUntilDeadline: urgency.daysUntilDeadline,

    summaryState: "ready",
  };
}

function formatStaffName(
  firstName: string | null,
  lastName: string | null
) {
  const name = [firstName, lastName].filter(Boolean).join(" ");

  return name || null;
}