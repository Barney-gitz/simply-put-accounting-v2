import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { clientDetails } from "@/db/schema/client-details";
import { clientServices } from "@/db/schema/client-services";
import { clients } from "@/db/schema/clients";
import {
  selfAssessmentProfiles,
  selfAssessmentTaxYears,
} from "@/db/schema/self-assessment";

import { getNextTaxYear } from "./period-builder";
import { buildSelfAssessmentSnapshot } from "./snapshot-builder";

export type ArchiveSelfAssessmentTaxYearInput = {
  clientId: string;
  clientServiceId: string;
  profileId: string;
  taxYearId: string;
};

export type ArchiveSelfAssessmentTaxYearResult = {
  archivedTaxYearId: string;
  nextTaxYearId: string;
};

export function archiveSelfAssessmentTaxYear({
  clientId,
  clientServiceId,
  profileId,
  taxYearId,
}: ArchiveSelfAssessmentTaxYearInput): Promise<ArchiveSelfAssessmentTaxYearResult> {
  return db.transaction(async (tx) => {
    /*
     * Validate the complete ownership chain:
     *
     * Client
     *   → Client Service
     *     → Self Assessment Profile
     *       → Tax Year
     *
     * IDs supplied by the browser must never be trusted independently.
     */
    const serviceRows = await tx
      .select({
        id: clientServices.id,
      })
      .from(clientServices)
      .where(
        and(
          eq(clientServices.id, clientServiceId),
          eq(clientServices.clientId, clientId)
        )
      )
      .limit(1);

    if (!serviceRows[0]) {
      throw new Error(
        "The selected service does not belong to this client."
      );
    }

    const profileRows = await tx
      .select({
        id: selfAssessmentProfiles.id,
        isMtd: selfAssessmentProfiles.isMtd,
      })
      .from(selfAssessmentProfiles)
      .where(
        and(
          eq(selfAssessmentProfiles.id, profileId),
          eq(
            selfAssessmentProfiles.clientServiceId,
            clientServiceId
          )
        )
      )
      .limit(1);

    const profile = profileRows[0];

    if (!profile) {
      throw new Error(
        "The selected Self Assessment profile does not belong to this service."
      );
    }

    const taxYearRows = await tx
      .select()
      .from(selfAssessmentTaxYears)
      .where(
        and(
          eq(selfAssessmentTaxYears.id, taxYearId),
          eq(
            selfAssessmentTaxYears.selfAssessmentProfileId,
            profileId
          ),
          eq(selfAssessmentTaxYears.isCurrent, true)
        )
      )
      .limit(1);

    const currentTaxYear = taxYearRows[0];

    if (!currentTaxYear) {
      throw new Error(
        "The selected Self Assessment tax year is not the current tax year."
      );
    }

    /*
     * Calculate and validate the next tax year before changing any records.
     *
     * Example:
     * 2025/26 → 2026/27
     */
    const nextTaxYear = getNextTaxYear(
      currentTaxYear.taxYear
    );

    const clientRows = await tx
      .select({
        displayName: clients.displayName,
      })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    const client = clientRows[0];

    if (!client) {
      throw new Error("The client could not be found.");
    }

    const detailRows = await tx
      .select({
        utr: clientDetails.utr,
        niNumber: clientDetails.niNumber,
        dateOfBirth: clientDetails.dateOfBirth,
        bookkeepingSoftware:
          clientDetails.bookkeepingSoftware,
      })
      .from(clientDetails)
      .where(eq(clientDetails.clientId, clientId))
      .limit(1);

    const details = detailRows[0] ?? null;

    const archivedAt = new Date();

    const snapshot = buildSelfAssessmentSnapshot({
      clientName: client.displayName,

      encryptedUtr: details?.utr ?? null,
      encryptedNiNumber: details?.niNumber ?? null,
      dateOfBirth: details?.dateOfBirth ?? null,
      bookkeepingSoftware:
        details?.bookkeepingSoftware ?? null,

      isMtd: profile.isMtd,

      taxYear: currentTaxYear.taxYear,
      progressStatus: currentTaxYear.progressStatus,
      assignedToStaffId:
        currentTaxYear.assignedToStaffId,
      approvedByStaffId:
        currentTaxYear.approvedByStaffId,
      filedAt: currentTaxYear.filedAt,
      notes: currentTaxYear.notes,
    });

    /*
     * Include isCurrent=true in the update condition.
     *
     * If two archive requests are submitted, only the first request can
     * archive the record. The second receives no returned row and cannot
     * create another current tax year.
     */
    const archivedTaxYears = await tx
      .update(selfAssessmentTaxYears)
      .set({
        snapshot,
        isCurrent: false,
        archivedAt,
        updatedAt: archivedAt,
      })
      .where(
        and(
          eq(selfAssessmentTaxYears.id, taxYearId),
          eq(
            selfAssessmentTaxYears.selfAssessmentProfileId,
            profileId
          ),
          eq(selfAssessmentTaxYears.isCurrent, true)
        )
      )
      .returning({
        id: selfAssessmentTaxYears.id,
      });

    const archivedTaxYear = archivedTaxYears[0];

    if (!archivedTaxYear) {
      throw new Error(
        "This tax year has already been archived. Refresh the workspace and try again."
      );
    }

    /*
     * Workflow values intentionally reset.
     *
     * Permanent information remains owned by the client/profile and is read
     * live by the new current workspace. The archived snapshot preserves the
     * old values for history.
     */
    const nextTaxYears = await tx
      .insert(selfAssessmentTaxYears)
      .values({
        selfAssessmentProfileId: profileId,
        taxYear: nextTaxYear,

        progressStatus: "not_started",
        assignedToStaffId: null,
        approvedByStaffId: null,
        filedAt: null,
        notes: null,

        snapshot: null,
        isCurrent: true,
        archivedAt: null,
      })
      .returning({
        id: selfAssessmentTaxYears.id,
      });

    const createdTaxYear = nextTaxYears[0];

    if (!createdTaxYear) {
      throw new Error(
        "The next Self Assessment tax year could not be created."
      );
    }

    return {
      archivedTaxYearId: archivedTaxYear.id,
      nextTaxYearId: createdTaxYear.id,
    };
  });
}