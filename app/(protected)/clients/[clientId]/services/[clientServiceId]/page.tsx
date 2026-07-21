import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { clients } from "@/db/schema/clients";
import { clientDetails } from "@/db/schema/client-details";
import { clientServices } from "@/db/schema/client-services";
import { serviceTypes } from "@/db/schema/service-types";
import { staffUsers } from "@/db/schema/staff-users";
import {
  selfAssessmentProfiles,
  selfAssessmentTaxYears,
  type SelfAssessmentSnapshot,
} from "@/db/schema/self-assessment";
import { SelfAssessmentWorkspaceForm } from "./self-assessment-workspace-form";
import { AccountsTrackingWorkspace } from "./accounts-tracking-workspace";
import { decryptNullable } from "@/lib/encryption";
import { calculateSelfAssessmentDates } from "@/lib/services/self-assessment/date-rules";

type ServicePageProps = {
  params: Promise<{
    clientId: string;
    clientServiceId: string;
  }>;
  searchParams: Promise<{
  taxYear?: string;
  period?: string;
  }>;
};

const progressLabels: Record<string, string> = {
  not_started: "Not Started",
  records_requested: "Records Requested",
  records_received: "Records Received",
  in_progress: "In Progress",
  with_client: "With Client",
  ready_for_review: "Ready for Review",
  filed: "Filed",
  not_applicable_this_year: "N/A This Year",
};

const progressBadgeClasses: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-700",
  records_requested: "bg-amber-100 text-amber-800",
  records_received: "bg-sky-100 text-sky-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  with_client: "bg-orange-100 text-orange-800",
  ready_for_review: "bg-purple-100 text-purple-800",
  filed: "bg-emerald-100 text-emerald-800",
  not_applicable_this_year: "bg-slate-100 text-slate-700",
};

export default async function ClientServicePage({
  params,
  searchParams,
}: ServicePageProps) {
  const { clientId, clientServiceId } = await params;
  const { taxYear, period } = await searchParams;

  const client = await db.query.clients.findFirst({
    where: eq(clients.id, clientId),
  });

  if (!client) notFound();

  const service = await db
    .select({
      id: clientServices.id,
      status: clientServices.status,
      serviceName: serviceTypes.name,
      serviceCode: serviceTypes.code,
    })
    .from(clientServices)
    .innerJoin(serviceTypes, eq(clientServices.serviceTypeId, serviceTypes.id))
    .where(
      and(
        eq(clientServices.id, clientServiceId),
        eq(clientServices.clientId, client.id)
      )
    )
    .limit(1);

  const clientService = service[0];

  if (!clientService) notFound();

  if (clientService.serviceCode === "self_assessment") {
    return (
      <SelfAssessmentWorkspace
        clientId={client.id}
        clientName={client.displayName}
        clientServiceId={clientService.id}
        serviceName={clientService.serviceName}
        selectedTaxYear={taxYear}
    />
    );
  }

  if (clientService.serviceCode === "accounts_tracking") {
    return (
      <AccountsTrackingWorkspace
        clientId={client.id}
        clientName={client.displayName}
        clientServiceId={clientService.id}
        serviceName={clientService.serviceName}
        selectedPeriodId={period}
      />
    );
  }

  return (
    <PlaceholderServiceWorkspace
      clientId={client.id}
      clientName={client.displayName}
      serviceName={clientService.serviceName}
      serviceStatus={clientService.status}
    />
  );
}

async function SelfAssessmentWorkspace({
  clientId,
  clientName,
  clientServiceId,
  serviceName,
  selectedTaxYear,
}: {
  clientId: string;
  clientName: string;
  clientServiceId: string;
  serviceName: string;
  selectedTaxYear?: string;
}) {
  const staff = await db
    .select({
      id: staffUsers.id,
      firstName: staffUsers.firstName,
      lastName: staffUsers.lastName,
    })
    .from(staffUsers)
    .where(eq(staffUsers.isActive, true))
    .orderBy(asc(staffUsers.firstName), asc(staffUsers.lastName));

  let profile = await db.query.selfAssessmentProfiles.findFirst({
    where: eq(selfAssessmentProfiles.clientServiceId, clientServiceId),
  });

  if (!profile) {
    const createdProfiles = await db
      .insert(selfAssessmentProfiles)
      .values({ clientServiceId })
      .returning();

    profile = createdProfiles[0];
  }

  let details = await db.query.clientDetails.findFirst({
    where: eq(clientDetails.clientId, clientId),
  });

  if (!details) {
    const created = await db
      .insert(clientDetails)
      .values({
        clientId,
      })
      .returning();

    details = created[0];
  }

    let currentYear = await db.query.selfAssessmentTaxYears.findFirst({
      where: and(
        eq(selfAssessmentTaxYears.selfAssessmentProfileId, profile.id),
        eq(selfAssessmentTaxYears.isCurrent, true)
      ),
    });

    if (!currentYear) {
      const createdTaxYears = await db
        .insert(selfAssessmentTaxYears)
        .values({
          selfAssessmentProfileId: profile.id,
          taxYear: getCurrentSelfAssessmentTaxYear(),
          isCurrent: true,
        })
        .returning();

      currentYear = createdTaxYears[0];
    }

    const activeTaxYear = selectedTaxYear ?? currentYear.taxYear;

    const selectedYear =
      activeTaxYear === currentYear.taxYear
        ? currentYear
        : await db.query.selfAssessmentTaxYears.findFirst({
            where: and(
              eq(selfAssessmentTaxYears.selfAssessmentProfileId, profile.id),
              eq(selfAssessmentTaxYears.taxYear, activeTaxYear)
            ),
          });

    if (!selectedYear) {
      notFound();
    }

    const isReadOnly = !selectedYear.isCurrent;

    const selfAssessmentDates =
      calculateSelfAssessmentDates(selectedYear.taxYear);

    const historicalSnapshot = isReadOnly
      ? (selectedYear.snapshot as SelfAssessmentSnapshot | null)
      : null;

    /*
    * Current years read live permanent information.
    * Historical years read only from the archived snapshot.
    *
    * We deliberately do not fall back to live client details for historical
    * records because that would allow later client changes to rewrite history.
    */
    const workspaceClientName =
      historicalSnapshot?.client.displayName ?? clientName;

    const workspaceProgressStatus =
      historicalSnapshot?.taxYear.progressStatus ??
      selectedYear.progressStatus;

    const workspaceAssignedToStaffId =
      historicalSnapshot?.taxYear.assignedToStaffId ??
      selectedYear.assignedToStaffId;

    const workspaceApprovedByStaffId =
      historicalSnapshot?.taxYear.approvedByStaffId ??
      selectedYear.approvedByStaffId;

    const workspaceFiledAt =
      historicalSnapshot?.taxYear.filedAt ??
      selectedYear.filedAt;

    const workspaceNotes =
      historicalSnapshot?.taxYear.notes ??
      selectedYear.notes;

    const workspaceUtr = isReadOnly
      ? decryptNullable(
          historicalSnapshot?.permanentInformation.encryptedUtr ??
            null
        )
      : decryptNullable(details.utr);

    const workspaceNiNumber = isReadOnly
      ? decryptNullable(
          historicalSnapshot?.permanentInformation
            .encryptedNiNumber ?? null
        )
      : decryptNullable(details.niNumber);

    const workspaceDateOfBirth = isReadOnly
      ? historicalSnapshot?.permanentInformation.dateOfBirth ??
        null
      : details.dateOfBirth;

    const workspaceBookkeepingSoftware = isReadOnly
      ? historicalSnapshot?.permanentInformation
          .bookkeepingSoftware ?? null
      : details.bookkeepingSoftware;

    const workspaceIsMtd = isReadOnly
      ? historicalSnapshot?.permanentInformation.isMtd ?? false
      : profile.isMtd;

  const taxYears = await db
    .select()
    .from(selfAssessmentTaxYears)
    .where(eq(selfAssessmentTaxYears.selfAssessmentProfileId, profile.id))
    .orderBy(desc(selfAssessmentTaxYears.taxYear));

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/clients/${clientId}`}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← {clientName}
        </Link>

        <SelfAssessmentWorkspaceForm
            key={selectedYear.id}
            clientId={clientId}
            clientServiceId={clientServiceId}
            clientName={workspaceClientName}
            serviceName={serviceName}
            currentTaxYear={selectedYear.taxYear}
            profileId={profile.id}
            taxYearId={selectedYear.id}
            isReadOnly={isReadOnly}
            currentYearHref={`/clients/${clientId}/services/${clientServiceId}`}
        >
            <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {isReadOnly
                        ? `Historical Tax Year · ${selectedYear.taxYear}`
                        : "Current Tax Year"}
                    </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {isReadOnly
                        ? "Archived record for reference only."
                        : "This is the workflow staff will mainly use from the dashboard."}
                    </p>
                </div>

                <StatusBadge status={workspaceProgressStatus} />
              </div>

              <div className="mt-6 grid gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:grid-cols-2">
                <Detail
                  label="Year End"
                  value={formatDisplayDate(selfAssessmentDates.yearEnd)}
                />

                <Detail
                  label="File By"
                  value={formatDisplayDate(
                    selfAssessmentDates.filingDeadline
                  )}
                />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-4">
                <SelectField
                  label="Progress"
                  disabled={isReadOnly}
                  name="progressStatus"
                  defaultValue={workspaceProgressStatus}
                  options={[
                    ["not_started", "Not Started"],
                    ["records_requested", "Records Requested"],
                    ["records_received", "Records Received"],
                    ["in_progress", "In Progress"],
                    ["with_client", "With Client"],
                    ["ready_for_review", "Ready for Review"],
                    ["filed", "Filed"],
                    ["not_applicable_this_year", "N/A This Year"],
                  ]}
                />

                <TextField
                    label="Filed Date"
                    name="filedAt"
                    type="date"
                    defaultValue={formatDateInputValue(workspaceFiledAt)}
                    disabled={isReadOnly}
                />

                <StaffSelect
                  label="Assigned To"
                  name="assignedToStaffId"
                  staff={staff}
                  defaultValue={workspaceAssignedToStaffId}
                  disabled={isReadOnly}
                />

                <StaffSelect
                  label="Approved By"
                  name="approvedByStaffId"
                  staff={staff}
                  defaultValue={workspaceApprovedByStaffId}
                  disabled={isReadOnly}
                />
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                    key={selectedYear.id}
                    name="notes"
                    defaultValue={workspaceNotes ?? ""}
                    rows={5}
                    disabled={isReadOnly}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#6BC1B7] focus:ring-2 focus:ring-[#6BC1B7]/20 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                At a Glance
              </h2>

              <div className="mt-5 space-y-4">
                <Detail
                  label="Progress"
                  value={progressLabels[workspaceProgressStatus]}
                />

                <Detail
                  label="Year End"
                  value={formatDisplayDate(selfAssessmentDates.yearEnd)}
                />

                <Detail
                  label="File By"
                  value={formatDisplayDate(
                    selfAssessmentDates.filingDeadline
                  )}
                />
                <Detail
                  label="Assigned To"
                  value={formatStaffName(
                    staff,
                    workspaceAssignedToStaffId
                  )}
                />
                <Detail
                  label="Approved By"
                  value={formatStaffName(
                    staff,
                    workspaceApprovedByStaffId
                  )}
                />
                <Detail
                  label="Filed Date"
                  value={formatDisplayDate(workspaceFiledAt)}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Permanent Information
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                These details usually stay the same each year.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <TextField
                    label="UTR"
                    name="utr"
                    defaultValue={workspaceUtr}
                    disabled={isReadOnly}
                />
                <TextField
                  label="NI Number"
                  name="niNumber"
                  defaultValue={workspaceNiNumber}
                  disabled={isReadOnly}
                />
                <TextField
                  label="DOB"
                  name="dateOfBirth"
                  type="date"
                  defaultValue={workspaceDateOfBirth}
                  disabled={isReadOnly}
                />

                <SelectField
                  label="Bookkeeping"
                  name="bookkeepingSoftware"
                  defaultValue={workspaceBookkeepingSoftware ?? ""}
                  disabled={isReadOnly}
                  options={[
                    ["", "Select"],
                    ["freeagent", "FreeAgent"],
                    ["quickbooks", "QuickBooks"],
                    ["sage", "Sage"],
                    ["xero", "Xero"],
                  ]}
                />

                <SelectField
                  label="MTD?"
                  name="isMtd"
                  defaultValue={workspaceIsMtd ? "true" : "false"}
                  disabled={isReadOnly}
                  options={[
                    ["false", "No"],
                    ["true", "Yes"],
                  ]}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">History</h2>

              <div className="mt-5 space-y-3">
                {taxYears.filter((taxYear) => !taxYear.isCurrent)
                  .length === 0 && (
                  <p className="text-sm text-gray-500">
                    No archived tax years yet.
                  </p>
                )}

                {taxYears
                  .filter((taxYear) => !taxYear.isCurrent)
                  .map((taxYear) => (
                    <Link
                        key={taxYear.id}
                        href={`/clients/${clientId}/services/${clientServiceId}?taxYear=${encodeURIComponent(
                        taxYear.taxYear
                        )}`}
                        className={`block rounded-xl border px-4 py-3 transition ${
                            taxYear.taxYear === activeTaxYear
                                ? "border-orange-300 bg-orange-50"
                                : "border-gray-100 hover:bg-gray-50"
                            }`}
                    >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-gray-900">
                        {taxYear.taxYear}
                      </p>
                      <StatusBadge status={taxYear.progressStatus} />
                    </div>

                    {taxYear.filedAt && (
                      <p className="mt-2 text-xs text-gray-500">
                        Filed {formatDisplayDate(taxYear.filedAt)}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </SelfAssessmentWorkspaceForm>
      </div>
    </div>
  );
}

function PlaceholderServiceWorkspace({
  clientId,
  clientName,
  serviceName,
  serviceStatus,
}: {
  clientId: string;
  clientName: string;
  serviceName: string;
  serviceStatus: string;
}) {
  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/clients/${clientId}`}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← {clientName}
        </Link>

        <div className="mt-4">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            {serviceName}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {clientName} · {serviceStatus}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
          <p className="mt-4 text-sm text-gray-500">
            Service-specific details will appear here.
          </p>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Progress</h2>
          <p className="mt-4 text-sm text-gray-500">
            Workflow status will appear here.
          </p>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
          <p className="mt-4 text-sm text-gray-500">No notes yet.</p>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">History</h2>
          <p className="mt-4 text-sm text-gray-500">No history yet.</p>
        </section>
      </div>
    </div>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  type = "text",
  disabled = false,
}: {
  label: string;
  name: string;
  defaultValue: string | null;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ""}
        disabled={disabled}
        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#6BC1B7] focus:ring-2 focus:ring-[#6BC1B7]/20 disabled:bg-gray-50 disabled:text-gray-500"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
  disabled = false,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: [string, string][];
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#6BC1B7] focus:ring-2 focus:ring-[#6BC1B7]/20 disabled:bg-gray-50 disabled:text-gray-500"
      >
        {options.map(([value, label]) => (
          <option key={value || "empty"} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

function StaffSelect({
  label,
  name,
  staff,
  defaultValue,
  disabled = false,
}: {
  label: string;
  name: string;
  staff: {
    id: string;
    firstName: string;
    lastName: string;
  }[];
  defaultValue: string | null;
  disabled?: boolean;
}) {
  return (
    <SelectField
      label={label}
      name={name}
      defaultValue={defaultValue ?? ""}
      disabled={disabled}
      options={[
        ["", "Select"],
        ...staff.map(
          (staffUser) =>
            [
              staffUser.id,
              `${staffUser.firstName} ${staffUser.lastName}`,
            ] as [string, string]
        ),
      ]}
    />
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-sm text-gray-900">{value || "—"}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        progressBadgeClasses[status] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {progressLabels[status] ?? status}
    </span>
  );
}

function formatStaffName(
  staff: {
    id: string;
    firstName: string;
    lastName: string;
  }[],
  staffId: string | null
) {
  const staffUser = staff.find((user) => user.id === staffId);

  if (!staffUser) return null;

  return `${staffUser.firstName} ${staffUser.lastName}`;
}

function formatDateInputValue(value: Date | string | null) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);

  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(value: Date | string | null) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getCurrentSelfAssessmentTaxYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const startYear = month >= 3 ? year - 1 : year - 2;
  const endYear = String(startYear + 1).slice(-2);

  return `${startYear}/${endYear}`;
}