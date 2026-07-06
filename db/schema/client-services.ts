import {
  pgEnum,
  pgTable,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { clients } from "./clients";
import { serviceTypes } from "./service-types";
import { staffUsers } from "./staff-users";

export const clientServiceStatusEnum = pgEnum("client_service_status", [
  "active",
  "inactive",
]);

export const clientServices = pgTable(
  "client_services",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),

    serviceTypeId: uuid("service_type_id")
      .references(() => serviceTypes.id)
      .notNull(),

    leadStaffId: uuid("lead_staff_id")
      .references(() => staffUsers.id),

    status: clientServiceStatusEnum("status")
      .default("active")
      .notNull(),

    startDate: timestamp("start_date"),

    endDate: timestamp("end_date"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    clientServiceUnique: unique().on(
      table.clientId,
      table.serviceTypeId
    ),
  })
);