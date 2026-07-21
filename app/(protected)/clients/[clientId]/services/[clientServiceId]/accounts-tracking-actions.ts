"use server";

import { and, eq, notInArray } from "drizzle-orm";

import { db } from "@/db/client";
import { accountsTrackingPeriods } from "@/db/schema/accounts-tracking";
import { clientCompaniesHouseCodes } from "@/db/schema/client-companies-house-codes";
import { clientDetails } from "@/db/schema/client-details";
import { clients } from "@/db/schema/clients";
import { encryptNullable } from "@/lib/encryption";
import { calculateAccountsFilingDeadline } from "@/lib/services/accounts-tracking/date-rules";

const bookkeepingValues = [
  "freeagent",
  "quickbooks",
  "sage",
  "xero",
] as const;

const progressValues = [
  "not_started",
  "waiting_for_records",
  "records_received",
  "in_progress",
  "ready_for_review",
  "with_client",
  "ready_to_file",
  "filed",
  "not_applicable",
] as const;

type SubmittedCompaniesHouseCode = {
  id: string | null;
  code: string;
  belongsTo: string;
  sortOrder: number;
};

function optionalValue(value: FormDataEntryValue | null) {
  const stringValue = String(value ?? "").trim();

  return stringValue.length > 0 ? stringValue : null;
}

function enumValue<T extends readonly string[]>(
  value: FormDataEntryValue | null,
  allowedValues: T
): T[number] | null {
  const stringValue = optionalValue(value);

  if (!stringValue) {
    return null;
  }

  if (allowedValues.includes(stringValue)) {
    return stringValue as T[number];
  }

  return null;
}

function optionalDate(value: FormDataEntryValue | null) {
  return optionalValue(value);
}

function parseCompaniesHouseCodes(formData: FormData) {
  const ids = formData.getAll("companiesHouseCodeId");
  const codes = formData.getAll("companiesHouseCode");
  const belongsToValues = formData.getAll(
    "companiesHouseCodeBelongsTo"
  );

  if (
    ids.length !== codes.length ||
    codes.length !== belongsToValues.length
  ) {
    return null;
  }

  const submittedCodes: SubmittedCompaniesHouseCode[] = [];

  for (let index = 0; index < codes.length; index += 1) {
    const id = optionalValue(ids[index]);
    const code = optionalValue(codes[index]);
    const belongsTo = optionalValue(belongsToValues[index]);

    // Completely blank rows are ignored.
    if (!code && !belongsTo) {
      continue;
    }

    // A row cannot have an owner without an actual code.
    if (!code) {
      return null;
    }

    submittedCodes.push({
      id,
      code,
      belongsTo: belongsTo ?? "",
      sortOrder: submittedCodes.length,
    });
  }

  return submittedCodes;
}

export async function updateAccountsTrackingWorkspaceAction(
  formData: FormData
) {
  const clientId = optionalValue(formData.get("clientId"));
  const periodId = optionalValue(formData.get("periodId"));
  const submittedCodes = parseCompaniesHouseCodes(formData);

  const periodEndDate = optionalDate(
    formData.get("periodEndDate")
  );

  const filingDeadline = periodEndDate
    ? calculateAccountsFilingDeadline(
        periodEndDate
      )
    : null;

  if (!clientId || !periodId || !submittedCodes) {
    return { success: false };
  }

  try {
    await db.transaction(async (tx) => {
      const existingCodes = await tx
        .select({
          id: clientCompaniesHouseCodes.id,
        })
        .from(clientCompaniesHouseCodes)
        .where(eq(clientCompaniesHouseCodes.clientId, clientId));

      const existingCodeIds = new Set(
        existingCodes.map((code) => code.id)
      );

      const submittedExistingIds = submittedCodes
        .map((code) => code.id)
        .filter((id): id is string => Boolean(id));

      const containsInvalidId = submittedExistingIds.some(
        (id) => !existingCodeIds.has(id)
      );

      if (containsInvalidId) {
        throw new Error(
          "A submitted Companies House code does not belong to this client."
        );
      }

      await tx
        .update(clients)
        .set({
          companyNumber: optionalValue(
            formData.get("companyNumber")
          ),
          updatedAt: new Date(),
        })
        .where(eq(clients.id, clientId));

      await tx
        .update(clientDetails)
        .set({
          utr: encryptNullable(optionalValue(formData.get("utr"))),
          companiesHouseAuthCode: encryptNullable(
            optionalValue(
              formData.get("companiesHouseAuthCode")
            )
          ),
          bookkeepingSoftware: enumValue(
            formData.get("bookkeepingSoftware"),
            bookkeepingValues
          ),
          updatedAt: new Date(),
        })
        .where(eq(clientDetails.clientId, clientId));

      await tx
        .update(accountsTrackingPeriods)
        .set({
          periodEndDate,
          filingDeadline,
          progressStatus:
            enumValue(
              formData.get("progressStatus"),
              progressValues
            ) ?? "not_started",
          assignedToStaffId: optionalValue(
            formData.get("assignedToStaffId")
          ),
          approvedByStaffId: optionalValue(
            formData.get("approvedByStaffId")
          ),
          filedAt: optionalDate(formData.get("filedAt")),
          notes: optionalValue(formData.get("notes")),
          updatedAt: new Date(),
        })
        .where(eq(accountsTrackingPeriods.id, periodId));

      /*
       * Delete removed database records before inserting new rows.
       *
       * Previously this happened after insertion. When every submitted row
       * was new, submittedExistingIds was empty, so the action inserted the
       * rows and then immediately deleted all of them.
       */
      if (submittedExistingIds.length === 0) {
        await tx
          .delete(clientCompaniesHouseCodes)
          .where(
            eq(clientCompaniesHouseCodes.clientId, clientId)
          );
      } else {
        await tx
          .delete(clientCompaniesHouseCodes)
          .where(
            and(
              eq(
                clientCompaniesHouseCodes.clientId,
                clientId
              ),
              notInArray(
                clientCompaniesHouseCodes.id,
                submittedExistingIds
              )
            )
          );
      }

      for (const submittedCode of submittedCodes) {
        if (submittedCode.id) {
          await tx
            .update(clientCompaniesHouseCodes)
            .set({
              code: encryptNullable(submittedCode.code)!,
              belongsTo: submittedCode.belongsTo,
              sortOrder: submittedCode.sortOrder,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(
                  clientCompaniesHouseCodes.id,
                  submittedCode.id
                ),
                eq(
                  clientCompaniesHouseCodes.clientId,
                  clientId
                )
              )
            );

          continue;
        }

        await tx.insert(clientCompaniesHouseCodes).values({
          clientId,
          code: encryptNullable(submittedCode.code)!,
          belongsTo: submittedCode.belongsTo,
          sortOrder: submittedCode.sortOrder,
        });
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Accounts Tracking save failed:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unknown save error occurred.",
    };
  }
}