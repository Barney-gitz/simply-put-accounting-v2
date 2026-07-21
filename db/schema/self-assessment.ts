import { sql } from "drizzle-orm";
import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { clientServices } from "./client-services";
import { staffUsers } from "./staff-users";

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

export type SelfAssessmentSnapshot = {
  version: 1;
  capturedAt: string;

  client: {
    displayName: string;
  };

  permanentInformation: {
    encryptedUtr: string | null;
    encryptedNiNumber: string | null;
    dateOfBirth: string | null;
    bookkeepingSoftware: string | null;
    isMtd: boolean;
  };

  taxYear: {
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

    assignedToStaffId: string | null;
    approvedByStaffId: string | null;
    filedAt: string | null;
    notes: string | null;
  };
};

export const selfAssessmentProfiles = pgTable(
  "self_assessment_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    clientServiceId: uuid("client_service_id")
      .references(() => clientServices.id, {
        onDelete: "cascade",
      })
      .notNull(),

    isMtd: boolean("is_mtd").default(false).notNull(),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    clientServiceUnique: unique().on(
      table.clientServiceId
    ),
  })
);

export const selfAssessmentTaxYears = pgTable(
  "self_assessment_tax_years",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    selfAssessmentProfileId: uuid(
      "self_assessment_profile_id"
    )
      .references(() => selfAssessmentProfiles.id, {
        onDelete: "cascade",
      })
      .notNull(),

    taxYear: varchar("tax_year", {
      length: 9,
    }).notNull(),

    assignedToStaffId: uuid(
      "assigned_to_staff_id"
    ).references(() => staffUsers.id),

    approvedByStaffId: uuid(
      "approved_by_staff_id"
    ).references(() => staffUsers.id),

    progressStatus:
      selfAssessmentProgressStatusEnum(
        "progress_status"
      )
        .default("not_started")
        .notNull(),

    notes: text("notes"),

    snapshot: jsonb("snapshot").$type<SelfAssessmentSnapshot>(),

    filedAt: timestamp("filed_at"),

    isCurrent: boolean("is_current")
      .default(false)
      .notNull(),

    archivedAt: timestamp("archived_at"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    profileTaxYearUnique: unique().on(
      table.selfAssessmentProfileId,
      table.taxYear
    ),

    oneCurrentTaxYearPerProfile: uniqueIndex(
      "self_assessment_one_current_tax_year_per_profile"
    )
      .on(table.selfAssessmentProfileId)
      .where(sql`${table.isCurrent} = true`),
  })
);