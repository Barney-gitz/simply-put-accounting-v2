import {
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const clientTypeEnum = pgEnum("client_type", [
  "individual",
  "limited_company",
  "partnership",
]);

export const clientStatusEnum = pgEnum("client_status", [
  "active",
  "archived",
]);

export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),

  clientType: clientTypeEnum("client_type").notNull(),

  status: clientStatusEnum("status")
    .default("active")
    .notNull(),

  displayName: varchar("display_name", { length: 255 }).notNull(),

  registeredName: varchar("registered_name", { length: 255 }),

  utr: varchar("utr", { length: 20 }),

  companyNumber: varchar("company_number", { length: 20 }),

  email: varchar("email", { length: 255 }),

  phone: varchar("phone", { length: 50 }),

  addressLine1: varchar("address_line_1", { length: 255 }),

  addressLine2: varchar("address_line_2", { length: 255 }),

  town: varchar("town", { length: 100 }),

  county: varchar("county", { length: 100 }),

  postcode: varchar("postcode", { length: 20 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  archivedAt: timestamp("archived_at"),
});