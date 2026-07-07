import {
  boolean,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const serviceTypes = pgTable("service_types", {
  id: uuid("id").defaultRandom().primaryKey(),

  code: varchar("code", { length: 50 }).notNull().unique(),

  name: varchar("name", { length: 100 }).notNull().unique(),

  description: varchar("description", { length: 255 }),

  availableForIndividuals: boolean("available_for_individuals")
    .default(false)
    .notNull(),

  availableForCompanies: boolean("available_for_companies")
    .default(false)
    .notNull(),

  availableForPartnerships: boolean("available_for_partnerships")
    .default(false)
    .notNull(),

  isActive: boolean("is_active").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});