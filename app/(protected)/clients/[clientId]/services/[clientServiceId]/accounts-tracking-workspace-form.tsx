"use client";

import { ReactNode } from "react";

import { WorkspaceForm } from "@/components/workspace/workspace-form";

import { updateAccountsTrackingWorkspaceAction } from "./accounts-tracking-actions";
import { archiveAccountsTrackingPeriodAction } from "./accounts-tracking-archive-action";

export function AccountsTrackingWorkspaceForm({
  clientId,
  clientServiceId,
  clientName,
  serviceName,
  periodId,
  contextLabel,
  isReadOnly = false,
  currentPeriodHref,
  children,
}: {
  clientId: string;
  clientServiceId: string;
  clientName: string;
  serviceName: string;
  periodId: string;
  contextLabel: string;
  isReadOnly?: boolean;
  currentPeriodHref?: string;
  children: ReactNode;
}) {
  return (
    <WorkspaceForm
      action={updateAccountsTrackingWorkspaceAction}
      archiveAction={
        archiveAccountsTrackingPeriodAction
      }
      clientName={clientName}
      serviceName={serviceName}
      contextLabel={contextLabel}
      hiddenFields={{
        clientId,
        clientServiceId,
        periodId,
      }}
      serviceDotClassName="bg-purple-500"
      isReadOnly={isReadOnly}
      currentRecordHref={currentPeriodHref}
      returnLabel="Return to current period"
      archiveLabel="Archive"
      archiveConfirmationMessage="Archive this accounting period and create the next current period?"
    >
      {children}
    </WorkspaceForm>
  );
}