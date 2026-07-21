import "server-only";

import type { AccountsTrackingSnapshot } from "@/db/schema/accounts-tracking";

type SnapshotClient = {
  displayName: string;
  companyNumber: string | null;
};

type SnapshotClientDetails = {
  utr: string | null;
  companiesHouseAuthCode: string | null;
  bookkeepingSoftware:
    | "freeagent"
    | "quickbooks"
    | "sage"
    | "xero"
    | null;
};

type SnapshotCompaniesHouseCode = {
  id: string;
  code: string;
  belongsTo: string;
  sortOrder: number;
};

type SnapshotPeriod = {
  periodEndDate: string | null;
  filingDeadline: string | null;
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
  assignedToStaffId: string | null;
  approvedByStaffId: string | null;
  filedAt: string | null;
  notes: string | null;
};

export function buildAccountsTrackingSnapshot({
  client,
  details,
  companiesHouseCodes,
  period,
  capturedAt = new Date(),
}: {
  client: SnapshotClient;
  details: SnapshotClientDetails | null;
  companiesHouseCodes: SnapshotCompaniesHouseCode[];
  period: SnapshotPeriod;
  capturedAt?: Date;
}): AccountsTrackingSnapshot {
  return {
    version: 1,

    capturedAt: capturedAt.toISOString(),

    client: {
      displayName: client.displayName,
      companyNumber: client.companyNumber,
    },

    permanentInformation: {
      /*
       * These strings are copied directly from PostgreSQL.
       * Sensitive values stay encrypted inside the JSONB snapshot.
       */
      encryptedUtr: details?.utr ?? null,
      encryptedCompaniesHouseAuthCode:
        details?.companiesHouseAuthCode ?? null,

      bookkeepingSoftware:
        details?.bookkeepingSoftware ?? null,

      companiesHouseCodes: companiesHouseCodes.map((code) => ({
        id: code.id,
        encryptedCode: code.code,
        belongsTo: code.belongsTo,
        sortOrder: code.sortOrder,
      })),
    },

    period: {
      periodEndDate: period.periodEndDate,
      filingDeadline: period.filingDeadline,
      progressStatus: period.progressStatus,
      assignedToStaffId: period.assignedToStaffId,
      approvedByStaffId: period.approvedByStaffId,
      filedAt: period.filedAt,
      notes: period.notes,
    },
  };
}