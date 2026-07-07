import "dotenv/config";

import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

import { db, client } from "./client";
import { serviceTypes } from "./seed-data";
import { staffUsers } from "./schema/staff-users";
import { serviceTypes as serviceTypesTable } from "./schema/service-types";

async function seed() {
  console.log("🌱 Seeding database...\n");

  for (const service of serviceTypes) {
    await db
      .insert(serviceTypesTable)
      .values(service)
      .onConflictDoUpdate({
        target: serviceTypesTable.code,
        set: {
          name: service.name,
          description: service.description,
          availableForIndividuals: service.availableForIndividuals,
          availableForCompanies: service.availableForCompanies,
          availableForPartnerships: service.availableForPartnerships,
          isActive: true,
        },
      });

    console.log(`✓ ${service.name}`);
  }

  const existingAdmin = await db.query.staffUsers.findFirst({
    where: eq(staffUsers.email, process.env.ADMIN_EMAIL!),
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD!, 12);

    await db.insert(staffUsers).values({
      firstName: process.env.ADMIN_FIRST_NAME!,
      lastName: process.env.ADMIN_LAST_NAME!,
      email: process.env.ADMIN_EMAIL!,
      passwordHash,
      isAdmin: true,
    });

    console.log("✓ Admin user");
  }

  console.log("\n✅ Database seeded.");
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
  });