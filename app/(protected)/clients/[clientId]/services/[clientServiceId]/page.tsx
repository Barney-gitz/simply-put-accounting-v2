import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { clients } from "@/db/schema/clients";
import { clientServices } from "@/db/schema/client-services";
import { serviceTypes } from "@/db/schema/service-types";
import { staffUsers } from "@/db/schema/staff-users";
import {
  selfAssessmentProfiles,
  selfAssessmentTaxYears,
} from "@/db/schema/self-assessment";
import { SelfAssessmentWorkspaceForm } from "./self-assessment-workspace-form";

type ServicePageProps = {
  params: Promise<{
    clientId: string;
    clientServiceId: string;
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

export default async function ClientServicePage({ params }: ServicePageProps) {
  const { clientId, clientServiceId } = await params;

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
}: {
  clientId: string;
  clientName: string;
  clientServiceId: string;
  serviceName: string;
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

  const currentTaxYear = getCurrentSelfAssessmentTaxYear();

  let currentYear = await db.query.selfAssessmentTaxYears.findFirst({
    where: and(
      eq(selfAssessmentTaxYears.selfAssessmentProfileId, profile.id),
      eq(selfAssessmentTaxYears.taxYear, currentTaxYear)
    ),
  });

  if (!currentYear) {
    const createdTaxYears = await db
      .insert(selfAssessmentTaxYears)
      .values({
        selfAssessmentProfileId: profile.id,
        taxYear: currentTaxYear,
      })
      .returning();

    currentYear = createdTaxYears[0];
  }

  const taxYears = await db
    .select()
    .from(selfAssessmentTaxYears)
    .where(eq(selfAssessmentTaxYears.selfAssessmentProfileId, profile.id))
    .orderBy(asc(selfAssessmentTaxYears.taxYear));

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
          clientName={clientName}
          serviceName={serviceName}
          currentTaxYear={currentYear.taxYear}
          profileId={profile.id}
          taxYearId={currentYear.id}
        >
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Current Tax Year
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    This is the workflow staff will mainly use from the dashboard.
                  </p>
                </div>

                <StatusBadge status={currentYear.progressStatus} />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-4">
                <SelectField
                  label="Progress"
                  name="progressStatus"
                  defaultValue={currentYear.progressStatus}
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
                  defaultValue={formatDateInputValue(currentYear.filedAt)}
                />

                <StaffSelect
                  label="Assigned To"
                  name="assignedToStaffId"
                  staff={staff}
                  defaultValue={currentYear.assignedToStaffId}
                />

                <StaffSelect
                  label="Approved By"
                  name="approvedByStaffId"
                  staff={staff}
                  defaultValue={currentYear.approvedByStaffId}
                />
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  name="notes"
                  defaultValue={currentYear.notes ?? ""}
                  rows={5}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#6BC1B7] focus:ring-2 focus:ring-[#6BC1B7]/20"
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
                  value={progressLabels[currentYear.progressStatus]}
                />
                <Detail
                  label="Assigned To"
                  value={formatStaffName(staff, currentYear.assignedToStaffId)}
                />
                <Detail
                  label="Approved By"
                  value={formatStaffName(staff, currentYear.approvedByStaffId)}
                />
                <Detail
                  label="Filed Date"
                  value={formatDisplayDate(currentYear.filedAt)}
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
                <TextField label="UTR" name="utr" defaultValue={profile.utr} />
                <TextField
                  label="NI Number"
                  name="niNumber"
                  defaultValue={profile.niNumber}
                />
                <TextField
                  label="DOB"
                  name="dateOfBirth"
                  type="date"
                  defaultValue={profile.dateOfBirth}
                />

                <SelectField
                  label="Bookkeeping"
                  name="bookkeepingSoftware"
                  defaultValue={profile.bookkeepingSoftware ?? ""}
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
                  defaultValue={profile.isMtd ? "true" : "false"}
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
                {taxYears.map((taxYear) => (
                  <div
                    key={taxYear.id}
                    className="rounded-xl border border-gray-100 px-4 py-3"
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
                  </div>
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
}: {
  label: string;
  name: string;
  defaultValue: string | null;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ""}
        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#6BC1B7] focus:ring-2 focus:ring-[#6BC1B7]/20"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: [string, string][];
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#6BC1B7] focus:ring-2 focus:ring-[#6BC1B7]/20"
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
}: {
  label: string;
  name: string;
  staff: {
    id: string;
    firstName: string;
    lastName: string;
  }[];
  defaultValue: string | null;
}) {
  return (
    <SelectField
      label={label}
      name={name}
      defaultValue={defaultValue ?? ""}
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
    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
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