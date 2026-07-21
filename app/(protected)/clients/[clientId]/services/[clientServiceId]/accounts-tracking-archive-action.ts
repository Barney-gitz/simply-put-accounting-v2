"use server";

import { archiveAccountsTrackingPeriod } from "@/lib/services/accounts-tracking/archive";

type ArchiveActionResult =
  | {
      success: true;
      redirectTo: string;
    }
  | {
      success: false;
      error: string;
    };

function optionalValue(value: FormDataEntryValue | null) {
  const stringValue = String(value ?? "").trim();

  return stringValue.length > 0 ? stringValue : null;
}

export async function archiveAccountsTrackingPeriodAction(
  formData: FormData
): Promise<ArchiveActionResult> {
  const clientId = optionalValue(formData.get("clientId"));
  const clientServiceId = optionalValue(
    formData.get("clientServiceId")
  );
  const periodId = optionalValue(formData.get("periodId"));

  if (!clientId || !clientServiceId || !periodId) {
    return {
      success: false,
      error: "The archive request is missing required information.",
    };
  }

  try {
    await archiveAccountsTrackingPeriod({
      clientId,
      clientServiceId,
      periodId,
    });

    return {
      success: true,
      redirectTo: `/clients/${clientId}/services/${clientServiceId}`,
    };
  } catch (error) {
    console.error("Accounts Tracking archive failed:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unknown archive error occurred.",
    };
  }
}