"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { encryptNullable } from "@/lib/encryption";
import { clientDetails } from "@/db/schema/client-details";
import {
  selfAssessmentProfiles,
  selfAssessmentTaxYears,
} from "@/db/schema/self-assessment";

const bookkeepingValues = ["freeagent", "quickbooks", "sage", "xero"] as const;

const progressValues = [
  "not_started",
  "records_requested",
  "records_received",
  "in_progress",
  "with_client",
  "ready_for_review",
  "filed",
  "not_applicable_this_year",
] as const;

function optionalValue(value: FormDataEntryValue | null) {
  const stringValue = String(value ?? "").trim();
  return stringValue.length > 0 ? stringValue : null;
}

function enumValue<T extends readonly string[]>(
  value: FormDataEntryValue | null,
  allowedValues: T
): T[number] | null {
  const stringValue = optionalValue(value);

  if (!stringValue) return null;

  if (allowedValues.includes(stringValue)) {
    return stringValue as T[number];
  }

  return null;
}

function optionalDate(value: FormDataEntryValue | null) {
  const stringValue = optionalValue(value);

  if (!stringValue) return null;

  return new Date(`${stringValue}T00:00:00`);
}

export async function updateSelfAssessmentWorkspaceAction(formData: FormData) {
  const profileId = String(formData.get("profileId"));
  const taxYearId = String(formData.get("taxYearId"));
  const clientId = String(formData.get("clientId"));

  if (!clientId || !profileId || !taxYearId) {
    return { success: false };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(clientDetails)
      .set({
        utr: encryptNullable(optionalValue(formData.get("utr"))),
        niNumber: encryptNullable(optionalValue(formData.get("niNumber"))),
        dateOfBirth: optionalValue(formData.get("dateOfBirth")),
        bookkeepingSoftware: enumValue(
          formData.get("bookkeepingSoftware"),
          bookkeepingValues
        ),
        updatedAt: new Date(),
      })
      .where(eq(clientDetails.clientId, clientId));
      await tx
      .update(selfAssessmentProfiles)
      .set({
        isMtd: String(formData.get("isMtd")) === "true",
        updatedAt: new Date(),
      })
      .where(eq(selfAssessmentProfiles.id, profileId));

    await tx
      .update(selfAssessmentTaxYears)
      .set({
        assignedToStaffId: optionalValue(formData.get("assignedToStaffId")),
        approvedByStaffId: optionalValue(formData.get("approvedByStaffId")),
        progressStatus:
          enumValue(formData.get("progressStatus"), progressValues) ??
          "not_started",
        filedAt: optionalDate(formData.get("filedAt")),
        notes: optionalValue(formData.get("notes")),
        updatedAt: new Date(),
      })
      .where(eq(selfAssessmentTaxYears.id, taxYearId));
  });

  return { success: true };
}