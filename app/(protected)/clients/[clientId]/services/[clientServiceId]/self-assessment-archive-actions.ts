"use server";

import { archiveSelfAssessmentTaxYear } from "@/lib/services/self-assessment/archive-tax-year";

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

export async function archiveSelfAssessmentTaxYearAction(
  formData: FormData
): Promise<ArchiveActionResult> {
  const clientId = optionalValue(formData.get("clientId"));

  const clientServiceId = optionalValue(
    formData.get("clientServiceId")
  );

  const profileId = optionalValue(formData.get("profileId"));

  const taxYearId = optionalValue(formData.get("taxYearId"));

  if (
    !clientId ||
    !clientServiceId ||
    !profileId ||
    !taxYearId
  ) {
    return {
      success: false,
      error:
        "The archive request is missing required information.",
    };
  }

  try {
    await archiveSelfAssessmentTaxYear({
      clientId,
      clientServiceId,
      profileId,
      taxYearId,
    });

    return {
      success: true,
      redirectTo: `/clients/${clientId}/services/${clientServiceId}`,
    };
  } catch (error) {
    console.error(
      "Self Assessment archive failed:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unknown archive error occurred.",
    };
  }
}