"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { clientServices } from "@/db/schema/client-services";

export async function updateClientServicesAction(formData: FormData) {
  const clientId = String(formData.get("clientId"));
  const serviceTypeIds = formData.getAll("serviceTypeIds").map(String);

  if (!clientId) return;

  await db
    .delete(clientServices)
    .where(eq(clientServices.clientId, clientId));

  if (serviceTypeIds.length > 0) {
    await db.insert(clientServices).values(
      serviceTypeIds.map((serviceTypeId) => ({
        clientId,
        serviceTypeId,
      }))
    );
  }

  revalidatePath(`/clients/${clientId}`);
}