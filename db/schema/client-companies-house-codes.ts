import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { clients } from "./clients";

export const clientCompaniesHouseCodes = pgTable(
  "client_companies_house_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),

    code: text("code").notNull(),

    belongsTo: varchar("belongs_to", { length: 255 }).notNull(),

    sortOrder: integer("sort_order").default(0).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }
);