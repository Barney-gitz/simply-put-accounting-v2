import {
  boolean,
  date,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { clientServices } from "./client-services";
import { staffUsers } from "./staff-users";

export const selfAssessmentBookkeepingSoftwareEnum = pgEnum(
  "self_assessment_bookkeeping_software",
  ["freeagent", "quickbooks", "sage", "xero"]
);

export const selfAssessmentProgressStatusEnum = pgEnum(
  "self_assessment_progress_status",
  [
    "not_started",
    "records_requested",
    "records_received",
    "in_progress",
    "with_client",
    "ready_for_review",
    "filed",
    "not_applicable_this_year",
  ]
);

export const selfAssessmentProfiles = pgTable(
  "self_assessment_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    clientServiceId: uuid("client_service_id")
      .references(() => clientServices.id, { onDelete: "cascade" })
      .notNull(),

    utr: varchar("utr", { length: 20 }),

    niNumber: varchar("ni_number", { length: 20 }),

    dateOfBirth: date("date_of_birth"),

    bookkeepingSoftware: selfAssessmentBookkeepingSoftwareEnum(
      "bookkeeping_software"
    ),

    isMtd: boolean("is_mtd").default(false).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    clientServiceUnique: unique().on(table.clientServiceId),
  })
);

export const selfAssessmentTaxYears = pgTable(
  "self_assessment_tax_years",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    selfAssessmentProfileId: uuid("self_assessment_profile_id")
      .references(() => selfAssessmentProfiles.id, {
        onDelete: "cascade",
      })
      .notNull(),

    taxYear: varchar("tax_year", { length: 9 }).notNull(),

    assignedToStaffId: uuid("assigned_to_staff_id").references(
      () => staffUsers.id
    ),

    approvedByStaffId: uuid("approved_by_staff_id").references(
      () => staffUsers.id
    ),

    progressStatus: selfAssessmentProgressStatusEnum("progress_status")
      .default("not_started")
      .notNull(),

    notes: text("notes"),

    filedAt: timestamp("filed_at"),

    archivedAt: timestamp("archived_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    profileTaxYearUnique: unique().on(
      table.selfAssessmentProfileId,
      table.taxYear
    ),
  })
);