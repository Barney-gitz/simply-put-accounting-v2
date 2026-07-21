"use client";

import { ReactNode } from "react";

import { WorkspaceForm } from "@/components/workspace/workspace-form";

import { updateSelfAssessmentWorkspaceAction } from "./self-assessment-actions";
import { archiveSelfAssessmentTaxYearAction } from "./self-assessment-archive-actions";

export function SelfAssessmentWorkspaceForm({
  clientId,
  clientServiceId,
  clientName,
  serviceName,
  currentTaxYear,
  profileId,
  taxYearId,
  isReadOnly = false,
  currentYearHref,
  children,
}: {
  clientId: string;
  clientServiceId: string;
  clientName: string;
  serviceName: string;
  currentTaxYear: string;
  profileId: string;
  taxYearId: string;
  isReadOnly?: boolean;
  currentYearHref?: string;
  children: ReactNode;
}) {
  return (
    <WorkspaceForm
      action={updateSelfAssessmentWorkspaceAction}
      archiveAction={archiveSelfAssessmentTaxYearAction}
      clientName={clientName}
      serviceName={serviceName}
      contextLabel={
        isReadOnly
          ? `Historical tax year ${currentTaxYear}`
          : `Current year ${currentTaxYear}`
      }
      hiddenFields={{
        clientId,
        clientServiceId,
        profileId,
        taxYearId,
      }}
      serviceDotClassName="bg-emerald-500"
      isReadOnly={isReadOnly}
      currentRecordHref={currentYearHref}
      returnLabel="Return to current tax year"
      archiveLabel="Archive"
      archiveConfirmationMessage="Archive this Self Assessment tax year and create the next current tax year?"
    >
      {children}
    </WorkspaceForm>
  );
}