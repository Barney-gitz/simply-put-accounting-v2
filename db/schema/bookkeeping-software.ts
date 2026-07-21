import { pgEnum } from "drizzle-orm/pg-core";

export const bookkeepingSoftwareEnum = pgEnum("bookkeeping_software", [
  "freeagent",
  "quickbooks",
  "sage",
  "xero",
]);