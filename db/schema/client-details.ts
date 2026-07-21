import {
  date,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { bookkeepingSoftwareEnum } from "./bookkeeping-software";
import { clients } from "./clients";

export const clientDetails = pgTable(
  "client_details",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),

    utr: text("utr"),

    niNumber: text("ni_number"),

    dateOfBirth: date("date_of_birth"),

    companiesHouseAuthCode: text("companies_house_auth_code"),

    bookkeepingSoftware: bookkeepingSoftwareEnum("bookkeeping_software"),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    clientUnique: unique().on(table.clientId),
  })
);