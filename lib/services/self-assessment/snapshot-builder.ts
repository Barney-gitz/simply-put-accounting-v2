import { SelfAssessmentSnapshot } from "@/db/schema/self-assessment";

export function buildSelfAssessmentSnapshot({
  clientName,
  encryptedUtr,
  encryptedNiNumber,
  dateOfBirth,
  bookkeepingSoftware,
  isMtd,
  taxYear,
  progressStatus,
  assignedToStaffId,
  approvedByStaffId,
  filedAt,
  notes,
}: {
  clientName: string;

  encryptedUtr: string | null;
  encryptedNiNumber: string | null;
  dateOfBirth: string | null;
  bookkeepingSoftware: string | null;

  isMtd: boolean;

  taxYear: string;
  progressStatus: SelfAssessmentSnapshot["taxYear"]["progressStatus"];
  assignedToStaffId: string | null;
  approvedByStaffId: string | null;
  filedAt: Date | null;
  notes: string | null;
}): SelfAssessmentSnapshot {
  return {
    version: 1,

    capturedAt: new Date().toISOString(),

    client: {
      displayName: clientName,
    },

    permanentInformation: {
      encryptedUtr,
      encryptedNiNumber,
      dateOfBirth,
      bookkeepingSoftware,
      isMtd,
    },

    taxYear: {
      taxYear,
      progressStatus,
      assignedToStaffId,
      approvedByStaffId,
      filedAt: filedAt?.toISOString() ?? null,
      notes,
    },
  };
}