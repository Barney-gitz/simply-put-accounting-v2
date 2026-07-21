import "dotenv/config";

import { asc, eq, inArray, like } from "drizzle-orm";

import { db, client } from "./client";
import { accountsTrackingPeriods } from "./schema/accounts-tracking";
import { clients } from "./schema/clients";
import { clientServices } from "./schema/client-services";
import { selfAssessmentProfiles, selfAssessmentTaxYears } from "./schema/self-assessment";
import { serviceTypes } from "./schema/service-types";
import { staffUsers } from "./schema/staff-users";

const DEMO_CLIENT_PREFIX = "[Demo]";

type StaffAssignment = {
  id: string;
  firstName: string;
  lastName: string;
};

type AccountsDemoRecord = {
  clientName: string;
  periodEndDate: string;
  deadlineOffsetDays: number;
  progressStatus:
    | "not_started"
    | "waiting_for_records"
    | "records_received"
    | "in_progress"
    | "ready_for_review"
    | "with_client"
    | "ready_to_file"
    | "filed"
    | "not_applicable";
  assignedStaffIndex: number | null;
};

type SelfAssessmentDemoRecord = {
  clientName: string;
  taxYear: string;
  progressStatus:
    | "not_started"
    | "records_requested"
    | "records_received"
    | "in_progress"
    | "with_client"
    | "ready_for_review"
    | "filed"
    | "not_applicable_this_year";
  assignedStaffIndex: number | null;
};

async function seedDashboardDemo() {
  console.log("🌱 Seeding dashboard demo data...\n");

  await removeExistingDemoClients();

  const activeStaff = await db
    .select({
      id: staffUsers.id,
      firstName: staffUsers.firstName,
      lastName: staffUsers.lastName,
    })
    .from(staffUsers)
    .where(eq(staffUsers.isActive, true))
    .orderBy(asc(staffUsers.firstName), asc(staffUsers.lastName));

  if (activeStaff.length === 0) {
    throw new Error(
      "No active staff users exist. Run npm run db:seed first."
    );
  }

  console.log(
    `✓ Using ${activeStaff.length} active staff ${
      activeStaff.length === 1 ? "member" : "members"
    }`
  );

  const requiredServiceTypes = await db
    .select({
      id: serviceTypes.id,
      code: serviceTypes.code,
      name: serviceTypes.name,
    })
    .from(serviceTypes)
    .where(
      inArray(serviceTypes.code, [
        "accounts_tracking",
        "self_assessment",
      ])
    );

  const accountsServiceType = requiredServiceTypes.find(
    (service) => service.code === "accounts_tracking"
  );

  const selfAssessmentServiceType = requiredServiceTypes.find(
    (service) => service.code === "self_assessment"
  );

  if (!accountsServiceType || !selfAssessmentServiceType) {
    throw new Error(
      "Accounts Tracking and Self Assessment service types must exist. Run npm run db:seed first."
    );
  }

  const accountsRecords: AccountsDemoRecord[] = [
    {
      clientName: "Alpha Manufacturing Ltd",
      periodEndDate: "2025-09-30",
      deadlineOffsetDays: -22,
      progressStatus: "waiting_for_records",
      assignedStaffIndex: 0,
    },
    {
      clientName: "Bright Ideas Ltd",
      periodEndDate: "2025-10-31",
      deadlineOffsetDays: -6,
      progressStatus: "in_progress",
      assignedStaffIndex: 1,
    },
    {
      clientName: "Greenfield Properties Ltd",
      periodEndDate: "2025-11-30",
      deadlineOffsetDays: 0,
      progressStatus: "ready_for_review",
      assignedStaffIndex: 0,
    },
    {
      clientName: "Oakwood Consulting Ltd",
      periodEndDate: "2025-12-31",
      deadlineOffsetDays: 2,
      progressStatus: "records_received",
      assignedStaffIndex: 0,
    },
    {
      clientName: "Willow Design Studio Ltd",
      periodEndDate: "2026-01-31",
      deadlineOffsetDays: 5,
      progressStatus: "with_client",
      assignedStaffIndex: 1,
    },
    {
      clientName: "Northstar Engineering Ltd",
      periodEndDate: "2026-02-28",
      deadlineOffsetDays: 9,
      progressStatus: "not_started",
      assignedStaffIndex: 2,
    },
    {
      clientName: "Harbour Technology Ltd",
      periodEndDate: "2026-03-31",
      deadlineOffsetDays: 13,
      progressStatus: "ready_to_file",
      assignedStaffIndex: 0,
    },
    {
      clientName: "Silver Birch Holdings Ltd",
      periodEndDate: "2026-04-30",
      deadlineOffsetDays: 18,
      progressStatus: "waiting_for_records",
      assignedStaffIndex: 1,
    },
    {
      clientName: "Cedar Finance Ltd",
      periodEndDate: "2026-05-31",
      deadlineOffsetDays: 25,
      progressStatus: "in_progress",
      assignedStaffIndex: null,
    },
    {
      clientName: "Riverside Retail Ltd",
      periodEndDate: "2026-06-30",
      deadlineOffsetDays: 45,
      progressStatus: "not_started",
      assignedStaffIndex: 2,
    },
    {
      clientName: "Summit Logistics Ltd",
      periodEndDate: "2026-07-31",
      deadlineOffsetDays: 90,
      progressStatus: "records_received",
      assignedStaffIndex: 0,
    },
    {
      clientName: "Maple Healthcare Ltd",
      periodEndDate: "2025-08-31",
      deadlineOffsetDays: -10,
      progressStatus: "filed",
      assignedStaffIndex: 0,
    },
  ];

  const selfAssessmentRecords: SelfAssessmentDemoRecord[] = [
    {
      clientName: "Mary Johnson",
      taxYear: "2025/26",
      progressStatus: "in_progress",
      assignedStaffIndex: 0,
    },
    {
      clientName: "David Williams",
      taxYear: "2025/26",
      progressStatus: "records_requested",
      assignedStaffIndex: 1,
    },
    {
      clientName: "Sarah Thompson",
      taxYear: "2025/26",
      progressStatus: "records_received",
      assignedStaffIndex: 2,
    },
    {
      clientName: "Michael Brown",
      taxYear: "2025/26",
      progressStatus: "with_client",
      assignedStaffIndex: 0,
    },
    {
      clientName: "Emma Taylor",
      taxYear: "2025/26",
      progressStatus: "ready_for_review",
      assignedStaffIndex: 1,
    },
    {
      clientName: "James Wilson",
      taxYear: "2024/25",
      progressStatus: "not_started",
      assignedStaffIndex: 0,
    },
    {
      clientName: "Olivia Harris",
      taxYear: "2024/25",
      progressStatus: "records_requested",
      assignedStaffIndex: null,
    },
    {
      clientName: "Daniel Clarke",
      taxYear: "2024/25",
      progressStatus: "filed",
      assignedStaffIndex: 2,
    },
  ];

  for (const record of accountsRecords) {
    await createAccountsDemoClient({
      record,
      staff: activeStaff,
      serviceTypeId: accountsServiceType.id,
    });
  }

  for (const record of selfAssessmentRecords) {
    await createSelfAssessmentDemoClient({
      record,
      staff: activeStaff,
      serviceTypeId: selfAssessmentServiceType.id,
    });
  }

  console.log("\n✅ Dashboard demo data seeded.");
  console.log(
    `   ${accountsRecords.length} Accounts Tracking records`
  );
  console.log(
    `   ${selfAssessmentRecords.length} Self Assessment records`
  );
  console.log(
    "   Filed records were included to confirm they are excluded from active dashboard work."
  );
}

async function removeExistingDemoClients() {
  const deletedClients = await db
    .delete(clients)
    .where(like(clients.displayName, `${DEMO_CLIENT_PREFIX}%`))
    .returning({
      id: clients.id,
    });

  if (deletedClients.length > 0) {
    console.log(
      `✓ Removed ${deletedClients.length} existing demo ${
        deletedClients.length === 1 ? "client" : "clients"
      }`
    );
  }
}

async function createAccountsDemoClient({
  record,
  staff,
  serviceTypeId,
}: {
  record: AccountsDemoRecord;
  staff: StaffAssignment[];
  serviceTypeId: string;
}) {
  const assignedStaff = getAssignedStaff(
    staff,
    record.assignedStaffIndex
  );

  const demoClient = await createDemoClient({
    displayName: record.clientName,
    clientType: "limited_company",
  });

  const createdServices = await db
    .insert(clientServices)
    .values({
      clientId: demoClient.id,
      serviceTypeId,
      leadStaffId: assignedStaff?.id ?? null,
      status: "active",
    })
    .returning({
      id: clientServices.id,
    });

  const createdService = createdServices[0];

  if (!createdService) {
    throw new Error(
      `Failed to create Accounts service for ${record.clientName}`
    );
  }

  const filingDeadline = addDaysToToday(
    record.deadlineOffsetDays
  );

  await db.insert(accountsTrackingPeriods).values({
    clientServiceId: createdService.id,
    periodEndDate: record.periodEndDate,
    filingDeadline,
    progressStatus: record.progressStatus,
    assignedToStaffId: assignedStaff?.id ?? null,
    filedAt:
      record.progressStatus === "filed"
        ? filingDeadline
        : null,
    notes: createAccountsNote(record),
    isCurrent: true,
  });

  console.log(
    `✓ Accounts · ${record.clientName} · ${formatDeadlineDescription(
      record.deadlineOffsetDays
    )}`
  );
}

async function createSelfAssessmentDemoClient({
  record,
  staff,
  serviceTypeId,
}: {
  record: SelfAssessmentDemoRecord;
  staff: StaffAssignment[];
  serviceTypeId: string;
}) {
  const assignedStaff = getAssignedStaff(
    staff,
    record.assignedStaffIndex
  );

  const demoClient = await createDemoClient({
    displayName: record.clientName,
    clientType: "individual",
  });

  const createdServices = await db
    .insert(clientServices)
    .values({
      clientId: demoClient.id,
      serviceTypeId,
      leadStaffId: assignedStaff?.id ?? null,
      status: "active",
    })
    .returning({
      id: clientServices.id,
    });

  const createdService = createdServices[0];

  if (!createdService) {
    throw new Error(
      `Failed to create Self Assessment service for ${record.clientName}`
    );
  }

  const createdProfiles = await db
    .insert(selfAssessmentProfiles)
    .values({
      clientServiceId: createdService.id,
      isMtd: false,
    })
    .returning({
      id: selfAssessmentProfiles.id,
    });

  const createdProfile = createdProfiles[0];

  if (!createdProfile) {
    throw new Error(
      `Failed to create Self Assessment profile for ${record.clientName}`
    );
  }

  await db.insert(selfAssessmentTaxYears).values({
    selfAssessmentProfileId: createdProfile.id,
    taxYear: record.taxYear,
    progressStatus: record.progressStatus,
    assignedToStaffId: assignedStaff?.id ?? null,
    filedAt:
      record.progressStatus === "filed"
        ? new Date()
        : null,
    notes: createSelfAssessmentNote(record),
    isCurrent: true,
  });

  console.log(
    `✓ Self Assessment · ${record.clientName} · ${record.taxYear}`
  );
}

async function createDemoClient({
  displayName,
  clientType,
}: {
  displayName: string;
  clientType: "individual" | "limited_company";
}) {
  const fullDisplayName = `${DEMO_CLIENT_PREFIX} ${displayName}`;

  const createdClients = await db
    .insert(clients)
    .values({
      clientType,
      status: "active",
      displayName: fullDisplayName,
      registeredName:
        clientType === "limited_company"
          ? displayName
          : null,
      companyNumber:
        clientType === "limited_company"
          ? createCompanyNumber(displayName)
          : null,
      email: createEmailAddress(displayName),
      phone: createPhoneNumber(displayName),
      addressLine1: "10 Demo Street",
      town: "Aylesbury",
      county: "Buckinghamshire",
      postcode: "HP20 1AA",
    })
    .returning({
      id: clients.id,
      displayName: clients.displayName,
    });

  const createdClient = createdClients[0];

  if (!createdClient) {
    throw new Error(
      `Failed to create demo client ${fullDisplayName}`
    );
  }

  return createdClient;
}

function getAssignedStaff(
  staff: StaffAssignment[],
  requestedIndex: number | null
) {
  if (requestedIndex === null) {
    return null;
  }

  return staff[requestedIndex % staff.length];
}

function addDaysToToday(offsetDays: number) {
  const now = new Date();

  const date = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
  );

  date.setUTCDate(date.getUTCDate() + offsetDays);

  return formatDateOnly(date);
}

function formatDateOnly(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function createCompanyNumber(value: string) {
  let total = 0;

  for (const character of value) {
    total += character.charCodeAt(0);
  }

  return String(10_000_000 + (total % 89_999_999)).slice(
    0,
    8
  );
}

function createEmailAddress(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/\bltd\b/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");

  return `${slug}@example.com`;
}

function createPhoneNumber(value: string) {
  let total = 0;

  for (const character of value) {
    total += character.charCodeAt(0);
  }

  const suffix = String(total).padStart(7, "0").slice(-7);

  return `01296 ${suffix.slice(0, 3)} ${suffix.slice(3)}`;
}

function createAccountsNote(record: AccountsDemoRecord) {
  switch (record.progressStatus) {
    case "waiting_for_records":
      return "Demo: records requested from the client.";

    case "records_received":
      return "Demo: records received and ready to begin.";

    case "in_progress":
      return "Demo: accounts preparation is in progress.";

    case "ready_for_review":
      return "Demo: accounts are ready for manager review.";

    case "with_client":
      return "Demo: accounts sent to the client for approval.";

    case "ready_to_file":
      return "Demo: approved and ready to file.";

    case "filed":
      return "Demo: accounts filed successfully.";

    default:
      return "Demo dashboard record.";
  }
}

function createSelfAssessmentNote(
  record: SelfAssessmentDemoRecord
) {
  switch (record.progressStatus) {
    case "records_requested":
      return "Demo: tax return records requested.";

    case "records_received":
      return "Demo: tax return records received.";

    case "in_progress":
      return "Demo: tax return preparation is in progress.";

    case "with_client":
      return "Demo: return sent to the client for approval.";

    case "ready_for_review":
      return "Demo: tax return ready for review.";

    case "filed":
      return "Demo: tax return filed successfully.";

    default:
      return "Demo dashboard record.";
  }
}

function formatDeadlineDescription(offsetDays: number) {
  if (offsetDays < 0) {
    const days = Math.abs(offsetDays);

    return `${days} ${days === 1 ? "day" : "days"} overdue`;
  }

  if (offsetDays === 0) {
    return "due today";
  }

  return `due in ${offsetDays} ${
    offsetDays === 1 ? "day" : "days"
  }`;
}

seedDashboardDemo()
  .catch((error) => {
    console.error("\n❌ Dashboard demo seed failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });