import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { accountsTrackingPeriods } from "@/db/schema/accounts-tracking";
import { clientCompaniesHouseCodes } from "@/db/schema/client-companies-house-codes";
import { clientDetails } from "@/db/schema/client-details";
import { clients } from "@/db/schema/clients";
import { staffUsers } from "@/db/schema/staff-users";
import { decryptNullable } from "@/lib/encryption";
import { AccountsTrackingDateFields } from "./accounts-tracking-date-fields";

import { AccountsTrackingWorkspaceForm } from "./accounts-tracking-workspace-form";
import { CompaniesHouseCodesField } from "./companies-house-codes-field";

const progressLabels: Record<string, string> = {
  not_started: "Not Started",
  waiting_for_records: "Waiting for Records",
  records_received: "Records Received",
  in_progress: "In Progress",
  ready_for_review: "Ready for Review",
  with_client: "With Client",
  ready_to_file: "Ready to File",
  filed: "Filed",
  not_applicable: "N/A",
};

const progressBadgeClasses: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-700",
  waiting_for_records: "bg-amber-100 text-amber-800",
  records_received: "bg-sky-100 text-sky-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  ready_for_review: "bg-purple-100 text-purple-800",
  with_client: "bg-orange-100 text-orange-800",
  ready_to_file: "bg-violet-100 text-violet-800",
  filed: "bg-emerald-100 text-emerald-800",
  not_applicable: "bg-slate-100 text-slate-700",
};

export async function AccountsTrackingWorkspace({
  clientId,
  clientName,
  clientServiceId,
  serviceName,
  selectedPeriodId,
}: {
  clientId: string;
  clientName: string;
  clientServiceId: string;
  serviceName: string;
  selectedPeriodId?: string;
}) {
  const client = await db.query.clients.findFirst({
    where: eq(clients.id, clientId),
  });

  if (!client) {
    notFound();
  }

  /*
   * Establish the current and selected periods before loading the rest of
   * the workspace data. This lets us decide whether the workspace should
   * read live data or a frozen historical snapshot.
   */
  let currentPeriod =
    await db.query.accountsTrackingPeriods.findFirst({
      where: and(
        eq(
          accountsTrackingPeriods.clientServiceId,
          clientServiceId
        ),
        eq(accountsTrackingPeriods.isCurrent, true)
      ),
    });

  if (!currentPeriod) {
    const createdPeriods = await db
      .insert(accountsTrackingPeriods)
      .values({
        clientServiceId,
        isCurrent: true,
      })
      .returning();

    currentPeriod = createdPeriods[0];
  }

  let activePeriod = currentPeriod;

  if (selectedPeriodId) {
    const selectedPeriod =
      await db.query.accountsTrackingPeriods.findFirst({
        where: and(
          eq(accountsTrackingPeriods.id, selectedPeriodId),
          eq(
            accountsTrackingPeriods.clientServiceId,
            clientServiceId
          )
        ),
      });

    if (!selectedPeriod) {
      notFound();
    }

    activePeriod = selectedPeriod;
  }

  const isReadOnly = !activePeriod.isCurrent;

  /*
   * A historical workspace reads its frozen snapshot.
   *
   * Some older test or manually created historical periods may predate
   * snapshot support. Those records fall back to their period row and live
   * permanent information so that they remain accessible.
   */
  const historicalSnapshot = isReadOnly
    ? activePeriod.snapshot
    : null;

  const isLegacyHistoricalPeriod =
    isReadOnly && !historicalSnapshot;

  let details = await db.query.clientDetails.findFirst({
    where: eq(clientDetails.clientId, clientId),
  });

  /*
   * Viewing a historical record should not normally mutate the database.
   * Only create the shared details row while loading a current workspace.
   */
  if (!details && !isReadOnly) {
    const createdDetails = await db
      .insert(clientDetails)
      .values({ clientId })
      .returning();

    details = createdDetails[0];
  }

  const allStaff = await db
    .select({
      id: staffUsers.id,
      firstName: staffUsers.firstName,
      lastName: staffUsers.lastName,
      isActive: staffUsers.isActive,
    })
    .from(staffUsers)
    .orderBy(
      asc(staffUsers.firstName),
      asc(staffUsers.lastName)
    );

  const activeStaff = allStaff.filter(
    (staffUser) => staffUser.isActive
  );

  const liveCompaniesHouseCodes = await db
    .select({
      id: clientCompaniesHouseCodes.id,
      code: clientCompaniesHouseCodes.code,
      belongsTo: clientCompaniesHouseCodes.belongsTo,
      sortOrder: clientCompaniesHouseCodes.sortOrder,
    })
    .from(clientCompaniesHouseCodes)
    .where(
      eq(clientCompaniesHouseCodes.clientId, clientId)
    )
    .orderBy(
      asc(clientCompaniesHouseCodes.sortOrder),
      asc(clientCompaniesHouseCodes.createdAt)
    );

  const periods = await db
    .select()
    .from(accountsTrackingPeriods)
    .where(
      eq(
        accountsTrackingPeriods.clientServiceId,
        clientServiceId
      )
    )
    .orderBy(
      desc(accountsTrackingPeriods.isCurrent),
      desc(accountsTrackingPeriods.periodEndDate),
      desc(accountsTrackingPeriods.createdAt)
    );

  /*
   * Current workspaces use live relational data.
   * Historical workspaces use the values frozen in their snapshot.
   */
  const workspaceClientName =
    historicalSnapshot?.client.displayName ??
    client.displayName;

  const workspacePeriod = historicalSnapshot?.period ?? {
    periodEndDate: activePeriod.periodEndDate,
    filingDeadline: activePeriod.filingDeadline,
    progressStatus: activePeriod.progressStatus,
    assignedToStaffId: activePeriod.assignedToStaffId,
    approvedByStaffId: activePeriod.approvedByStaffId,
    filedAt: activePeriod.filedAt,
    notes: activePeriod.notes,
  };

  const workspacePermanentInformation =
    historicalSnapshot?.permanentInformation ?? {
      encryptedUtr: details?.utr ?? null,
      encryptedCompaniesHouseAuthCode:
        details?.companiesHouseAuthCode ?? null,
      bookkeepingSoftware:
        details?.bookkeepingSoftware ?? null,
      companiesHouseCodes: liveCompaniesHouseCodes.map(
        (code) => ({
          id: code.id,
          encryptedCode: code.code,
          belongsTo: code.belongsTo,
          sortOrder: code.sortOrder,
        })
      ),
    };

  const workspaceCompanyNumber =
    historicalSnapshot?.client.companyNumber ??
    client.companyNumber;

  const workspaceCompaniesHouseCodes =
    workspacePermanentInformation.companiesHouseCodes
      .slice()
      .sort((left, right) => {
        return left.sortOrder - right.sortOrder;
      })
      .map((code) => ({
        id: code.id,
        code:
          decryptNullable(code.encryptedCode) ?? "",
        belongsTo: code.belongsTo,
      }));

  const periodLabel = formatPeriodLabel(
    workspacePeriod.periodEndDate
  );

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/clients/${clientId}`}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← {clientName}
        </Link>

        <AccountsTrackingWorkspaceForm
          key={activePeriod.id}
          clientId={clientId}
          clientServiceId={clientServiceId}
          clientName={workspaceClientName}
          serviceName={serviceName}
          periodId={activePeriod.id}
          contextLabel={
            isReadOnly
              ? `Historical period ${periodLabel}`
              : `Current period ${periodLabel}`
          }
          isReadOnly={isReadOnly}
          currentPeriodHref={`/clients/${clientId}/services/${clientServiceId}`}
        >
          {isLegacyHistoricalPeriod && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            >
              This historical period was created before
              snapshot support. Its workflow values are
              historical, but its permanent information may
              reflect the current client record.
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {isReadOnly
                      ? `Historical Accounting Period · ${periodLabel}`
                      : "Current Accounting Period"}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {isReadOnly
                      ? "Archived record for reference only."
                      : "Track the current accounts workflow and filing deadline."}
                  </p>
                </div>

                <StatusBadge
                  status={workspacePeriod.progressStatus}
                />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <SelectField
                  label="Progress"
                  name="progressStatus"
                  defaultValue={
                    workspacePeriod.progressStatus
                  }
                  disabled={isReadOnly}
                  options={[
                    ["not_started", "Not Started"],
                    [
                      "waiting_for_records",
                      "Waiting for Records",
                    ],
                    [
                      "records_received",
                      "Records Received",
                    ],
                    ["in_progress", "In Progress"],
                    [
                      "ready_for_review",
                      "Ready for Review",
                    ],
                    ["with_client", "With Client"],
                    [
                      "ready_to_file",
                      "Ready to File",
                    ],
                    ["filed", "Filed"],
                    ["not_applicable", "N/A"],
                  ]}
                />

                <AccountsTrackingDateFields
                  key={activePeriod.id}
                  defaultPeriodEndDate={
                    workspacePeriod.periodEndDate
                  }
                  defaultFilingDeadline={
                    workspacePeriod.filingDeadline
                  }
                  disabled={isReadOnly}
                />

                <StaffSelect
                  label="Assigned To"
                  name="assignedToStaffId"
                  staff={activeStaff}
                  defaultValue={
                    workspacePeriod.assignedToStaffId
                  }
                  disabled={isReadOnly}
                />

                <StaffSelect
                  label="Approved By"
                  name="approvedByStaffId"
                  staff={activeStaff}
                  defaultValue={
                    workspacePeriod.approvedByStaffId
                  }
                  disabled={isReadOnly}
                />

                <TextField
                  label="Filed Date"
                  name="filedAt"
                  type="date"
                  defaultValue={
                    workspacePeriod.filedAt ?? ""
                  }
                  disabled={isReadOnly}
                />
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700">
                  Notes
                </label>

                <textarea
                  name="notes"
                  defaultValue={
                    workspacePeriod.notes ?? ""
                  }
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
                  value={
                    progressLabels[
                      workspacePeriod.progressStatus
                    ]
                  }
                />

                <Detail
                  label="Year End"
                  value={formatDisplayDate(
                    workspacePeriod.periodEndDate
                  )}
                />

                <Detail
                  label="Filing Deadline"
                  value={formatDisplayDate(
                    workspacePeriod.filingDeadline
                  )}
                />

                <Detail
                  label="Assigned To"
                  value={formatStaffName(
                    allStaff,
                    workspacePeriod.assignedToStaffId
                  )}
                />

                <Detail
                  label="Filed Date"
                  value={formatDisplayDate(
                    workspacePeriod.filedAt
                  )}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Permanent Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {isReadOnly && historicalSnapshot
                  ? "Company information captured when this period was archived."
                  : "Shared company information used by related services."}
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Company Number"
                  name="companyNumber"
                  defaultValue={workspaceCompanyNumber}
                  disabled={isReadOnly}
                />

                <TextField
                  label="UTR"
                  name="utr"
                  defaultValue={decryptNullable(
                    workspacePermanentInformation.encryptedUtr
                  )}
                  disabled={isReadOnly}
                />

                <TextField
                  label="Companies House Auth Code"
                  name="companiesHouseAuthCode"
                  defaultValue={decryptNullable(
                    workspacePermanentInformation.encryptedCompaniesHouseAuthCode
                  )}
                  disabled={isReadOnly}
                />

                <SelectField
                  label="Bookkeeping"
                  name="bookkeepingSoftware"
                  defaultValue={
                    workspacePermanentInformation.bookkeepingSoftware ??
                    ""
                  }
                  disabled={isReadOnly}
                  options={[
                    ["", "Select"],
                    ["freeagent", "FreeAgent"],
                    ["quickbooks", "QuickBooks"],
                    ["sage", "Sage"],
                    ["xero", "Xero"],
                  ]}
                />
              </div>

              <CompaniesHouseCodesField
                initialCodes={
                  workspaceCompaniesHouseCodes
                }
                disabled={isReadOnly}
              />
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                History
              </h2>

              <div className="mt-5 space-y-3">
                {periods.map((period) => {
                  const isSelected =
                    period.id === activePeriod.id;

                  return (
                    <Link
                      key={period.id}
                      href={
                        period.isCurrent
                          ? `/clients/${clientId}/services/${clientServiceId}`
                          : `/clients/${clientId}/services/${clientServiceId}?period=${period.id}`
                      }
                      className={`block rounded-xl border px-4 py-3 transition ${
                        isSelected
                          ? "border-orange-300 bg-orange-50"
                          : "border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-gray-900">
                          {formatPeriodLabel(
                            period.periodEndDate
                          )}
                        </p>

                        <StatusBadge
                          status={
                            period.progressStatus
                          }
                        />
                      </div>

                      {period.filedAt && (
                        <p className="mt-2 text-xs text-gray-500">
                          Filed{" "}
                          {formatDisplayDate(
                            period.filedAt
                          )}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        </AccountsTrackingWorkspaceForm>
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
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>

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
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>

      <select
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#6BC1B7] focus:ring-2 focus:ring-[#6BC1B7]/20 disabled:bg-gray-50 disabled:text-gray-500"
      >
        {options.map(([value, optionLabel]) => (
          <option
            key={value || "empty"}
            value={value}
          >
            {optionLabel}
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

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-sm text-gray-900">
        {value || "—"}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        progressBadgeClasses[status] ??
        "bg-gray-100 text-gray-700"
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
  const staffUser = staff.find(
    (user) => user.id === staffId
  );

  if (!staffUser) {
    return null;
  }

  return `${staffUser.firstName} ${staffUser.lastName}`;
}

function formatDisplayDate(
  value: Date | string | null
) {
  if (!value) {
    return null;
  }

  const date =
    value instanceof Date
      ? value
      : new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatPeriodLabel(value: string | null) {
  if (!value) {
    return "Dates not set";
  }

  const date = new Date(`${value}T00:00:00`);

  return `YE ${new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)}`;
}