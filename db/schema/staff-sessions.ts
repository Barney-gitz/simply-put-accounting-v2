import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { staffUsers } from "./staff-users";

export const staffSessions = pgTable("staff_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),

  staffUserId: uuid("staff_user_id")
    .references(() => staffUsers.id, { onDelete: "cascade" })
    .notNull(),

  tokenHash: varchar("token_hash", { length: 255 }).notNull().unique(),

  expiresAt: timestamp("expires_at").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});