import type {
  ClientServiceSummary,
  ClientServiceUrgency,
} from "./types";

const COMPLETED_PROGRESS_STATUSES = new Set([
  "filed",
  "not_applicable",
  "not_applicable_this_year",
]);

export function calculateServiceUrgency({
  deadline,
  progressStatus,
  serviceStatus,
  today = new Date(),
}: {
  deadline: string | null;
  progressStatus: string | null;
  serviceStatus: "active" | "inactive";
  today?: Date;
}): {
  urgency: ClientServiceUrgency;
  daysUntilDeadline: number | null;
} {
  if (
    !deadline ||
    serviceStatus !== "active" ||
    (progressStatus &&
      COMPLETED_PROGRESS_STATUSES.has(progressStatus))
  ) {
    return {
      urgency: "normal",
      daysUntilDeadline: null,
    };
  }

  const deadlineDate = parseDateOnly(deadline);
  const currentDate = startOfUtcDay(today);

  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  const daysUntilDeadline = Math.round(
    (deadlineDate.getTime() - currentDate.getTime()) /
      millisecondsPerDay
  );

  if (daysUntilDeadline < 0) {
    return {
      urgency: "overdue",
      daysUntilDeadline,
    };
  }

  if (daysUntilDeadline <= 14) {
    return {
      urgency: "due_within_two_weeks",
      daysUntilDeadline,
    };
  }

  if (daysUntilDeadline <= 28) {
    return {
      urgency: "due_within_four_weeks",
      daysUntilDeadline,
    };
  }

  return {
    urgency: "normal",
    daysUntilDeadline,
  };
}

export function sortClientServiceSummaries(
  services: ClientServiceSummary[]
) {
  return [...services].sort((a, b) => {
    const urgencyDifference =
      getUrgencyPriority(a.urgency) -
      getUrgencyPriority(b.urgency);

    if (urgencyDifference !== 0) {
      return urgencyDifference;
    }

    /*
     * Among urgent services, show the earliest deadline first.
     */
    if (
      isPromotedUrgency(a.urgency) &&
      isPromotedUrgency(b.urgency)
    ) {
      const deadlineDifference =
        (a.daysUntilDeadline ?? Number.MAX_SAFE_INTEGER) -
        (b.daysUntilDeadline ?? Number.MAX_SAFE_INTEGER);

      if (deadlineDifference !== 0) {
        return deadlineDifference;
      }
    }

    const servicePriorityDifference =
      getServicePriority(a) - getServicePriority(b);

    if (servicePriorityDifference !== 0) {
      return servicePriorityDifference;
    }

    return a.serviceName.localeCompare(b.serviceName);
  });
}

function getUrgencyPriority(
  urgency: ClientServiceUrgency
) {
  switch (urgency) {
    case "overdue":
      return 0;

    case "due_within_two_weeks":
      return 1;

    case "due_within_four_weeks":
    case "normal":
      return 2;
  }
}

function isPromotedUrgency(
  urgency: ClientServiceUrgency
) {
  return (
    urgency === "overdue" ||
    urgency === "due_within_two_weeks"
  );
}

function getServicePriority(
  service: ClientServiceSummary
) {
  const code = normalise(service.serviceCode);
  const name = normalise(service.serviceName);

  const matches = (...values: string[]) => {
    return values.some((value) => {
      const normalisedValue = normalise(value);

      return (
        code === normalisedValue ||
        name === normalisedValue
      );
    });
  };

  if (
    matches(
      "self_assessment",
      "self assessment"
    )
  ) {
    return 1;
  }

  if (
    matches(
      "accounts_tracking",
      "accounts",
      "accounts tracking"
    )
  ) {
    return 2;
  }

  if (
    matches(
      "confirmation_statement",
      "confirmation_statements",
      "confirmation statement",
      "confirmation statements"
    )
  ) {
    return 3;
  }

  if (matches("vat")) {
    return 4;
  }

  if (matches("paye", "payroll")) {
    return 5;
  }

  if (matches("cis")) {
    return 6;
  }

  if (
    matches(
      "mtd_itsa",
      "mtd itsa"
    )
  ) {
    return 7;
  }

  if (matches("aml")) {
    return 8;
  }

  return 999;
}

function normalise(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseDateOnly(value: string) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error(
      `Invalid deadline date: ${value}`
    );
  }

  const [, year, month, day] = match;

  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day)
    )
  );
}

function startOfUtcDay(value: Date) {
  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate()
    )
  );
}