import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { clients } from "@/db/schema/clients";
import { clientServices } from "@/db/schema/client-services";
import { serviceTypes } from "@/db/schema/service-types";

import { buildAccountsTrackingSummary } from "./accounts-tracking-summary";
import { buildSelfAssessmentSummary } from "./self-assessment-summary";
import { sortClientServiceSummaries } from "./urgency";
import type {
  BaseClientService,
  ClientOverview,
  ClientServiceSummary,
} from "./types";

export async function getClientOverview(
  clientId: string
): Promise<ClientOverview | null> {
  const client = await db.query.clients.findFirst({
    where: eq(clients.id, clientId),
  });

  if (!client) {
    return null;
  }

  const serviceRows = await db
    .select({
      clientServiceId: clientServices.id,
      serviceTypeId: clientServices.serviceTypeId,

      serviceCode: serviceTypes.code,
      serviceName: serviceTypes.name,

      serviceStatus: clientServices.status,
    })
    .from(clientServices)
    .innerJoin(
      serviceTypes,
      eq(
        clientServices.serviceTypeId,
        serviceTypes.id
      )
    )
    .where(
      eq(
        clientServices.clientId,
        client.id
      )
    );

  const serviceSummaries = await Promise.all(
    serviceRows.map((service) => {
      return buildServiceSummary({
        clientId: client.id,
        service,
      });
    })
  );

  const services = sortClientServiceSummaries(
    serviceSummaries
  );

  return {
    client: {
      id: client.id,
      clientType: client.clientType,
      status: client.status,

      displayName: client.displayName,
      registeredName: client.registeredName,

      companyNumber: client.companyNumber,
      email: client.email,
      phone: client.phone,

      addressLine1: client.addressLine1,
      addressLine2: client.addressLine2,
      town: client.town,
      county: client.county,
      postcode: client.postcode,
    },

    services,
  };
}

async function buildServiceSummary({
  clientId,
  service,
}: {
  clientId: string;
  service: BaseClientService;
}): Promise<ClientServiceSummary> {
  if (
    service.serviceCode ===
    "self_assessment"
  ) {
    return buildSelfAssessmentSummary({
      clientId,
      service,
    });
  }

  if (
    service.serviceCode ===
    "accounts_tracking"
  ) {
    return buildAccountsTrackingSummary({
      clientId,
      service,
    });
  }

  return {
    clientServiceId:
      service.clientServiceId,

    serviceTypeId:
      service.serviceTypeId,

    serviceCode:
      service.serviceCode,

    serviceName:
      service.serviceName,

    serviceStatus:
      service.serviceStatus,

    workspaceHref:
      `/clients/${clientId}/services/${service.clientServiceId}`,

    periodLabel: null,

    progressStatus: null,
    progressLabel: null,

    assignedTo: null,

    yearEnd: null,
    filingDeadline: null,

    nextDeadline: null,
    urgency: "normal",
    daysUntilDeadline: null,

    summaryState: "not_supported",
  };
}