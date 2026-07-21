export type ClientServiceSummaryState =
  | "ready"
  | "missing_current_period"
  | "not_supported";

export type ClientServiceUrgency =
  | "overdue"
  | "due_within_two_weeks"
  | "due_within_four_weeks"
  | "normal";

export type ClientServiceSummary = {
  clientServiceId: string;
  serviceTypeId: string;

  serviceCode: string;
  serviceName: string;
  serviceStatus: "active" | "inactive";

  workspaceHref: string;

  periodLabel: string | null;

  progressStatus: string | null;
  progressLabel: string | null;

  assignedTo: string | null;

  yearEnd: string | null;
  filingDeadline: string | null;

  nextDeadline: string | null;
  urgency: ClientServiceUrgency;
  daysUntilDeadline: number | null;

  summaryState: ClientServiceSummaryState;
};

export type ClientOverview = {
  client: {
    id: string;
    clientType:
      | "individual"
      | "limited_company"
      | "partnership";

    status: "active" | "archived";

    displayName: string;
    registeredName: string | null;

    companyNumber: string | null;
    email: string | null;
    phone: string | null;

    addressLine1: string | null;
    addressLine2: string | null;
    town: string | null;
    county: string | null;
    postcode: string | null;
  };

  services: ClientServiceSummary[];
};

export type BaseClientService = {
  clientServiceId: string;
  serviceTypeId: string;

  serviceCode: string;
  serviceName: string;
  serviceStatus: "active" | "inactive";
};