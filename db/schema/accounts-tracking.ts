import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { clientServices } from "./client-services";
import { staffUsers } from "./staff-users";

export const accountsTrackingProgressStatusEnum = pgEnum(
  "accounts_tracking_progress_status",
  [
    "not_started",
    "waiting_for_records",
    "records_received",
    "in_progress",
    "ready_for_review",
    "with_client",
    "ready_to_file",
    "filed",
    "not_applicable",
  ]
);

export type AccountsTrackingSnapshot = {
  version: 1;

  capturedAt: string;

  client: {
    displayName: string;
    companyNumber: string | null;
  };

  permanentInformation: {
    /*
     * Sensitive values remain encrypted in PostgreSQL.
     * They are decrypted only when rendering the historical workspace.
     */
    encryptedUtr: string | null;
    encryptedCompaniesHouseAuthCode: string | null;

    bookkeepingSoftware:
      | "freeagent"
      | "quickbooks"
      | "sage"
      | "xero"
      | null;

    companiesHouseCodes: {
      id: string;
      encryptedCode: string;
      belongsTo: string;
      sortOrder: number;
    }[];
  };

  period: {
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
};

export const accountsTrackingPeriods = pgTable(
  "accounts_tracking_periods",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    clientServiceId: uuid("client_service_id")
      .references(() => clientServices.id, {
        onDelete: "cascade",
      })
      .notNull(),

    periodEndDate: date("period_end_date"),

    filingDeadline: date("filing_deadline"),

    progressStatus: accountsTrackingProgressStatusEnum(
      "progress_status"
    )
      .default("not_started")
      .notNull(),

    assignedToStaffId: uuid("assigned_to_staff_id").references(
      () => staffUsers.id
    ),

    approvedByStaffId: uuid("approved_by_staff_id").references(
      () => staffUsers.id
    ),

    filedAt: date("filed_at"),

    notes: text("notes"),

    snapshot: jsonb("snapshot").$type<AccountsTrackingSnapshot>(),

    isCurrent: boolean("is_current").default(true).notNull(),

    archivedAt: timestamp("archived_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    servicePeriodEndUnique: unique().on(
      table.clientServiceId,
      table.periodEndDate
    ),

    oneCurrentPeriodPerService: uniqueIndex(
      "accounts_tracking_one_current_period_per_service"
    )
      .on(table.clientServiceId)
      .where(sql`${table.isCurrent} = true`),
  })
);