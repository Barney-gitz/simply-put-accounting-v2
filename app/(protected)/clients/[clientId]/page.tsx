import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { serviceTypes } from "@/db/schema/service-types";
import { formatClientType } from "@/lib/format";
import { getClientOverview } from "@/lib/services/client-overview/get-client-overview";
import type { ClientServiceSummary } from "@/lib/services/client-overview/types";

import { AddServiceModal } from "./add-service-modal";

type ClientPageProps = {
  params: Promise<{
    clientId: string;
  }>;
};

const progressBadgeClasses: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-700",

  records_requested: "bg-amber-100 text-amber-800",
  waiting_for_records: "bg-amber-100 text-amber-800",

  records_received: "bg-sky-100 text-sky-800",

  in_progress: "bg-indigo-100 text-indigo-800",

  with_client: "bg-orange-100 text-orange-800",

  ready_for_review: "bg-purple-100 text-purple-800",
  ready_to_file: "bg-violet-100 text-violet-800",

  filed: "bg-emerald-100 text-emerald-800",

  not_applicable: "bg-slate-100 text-slate-700",
  not_applicable_this_year: "bg-slate-100 text-slate-700",
};

export default async function ClientPage({
  params,
}: ClientPageProps) {
  const { clientId } = await params;

  const overview = await getClientOverview(clientId);

  if (!overview) {
    notFound();
  }

  const { client, services } = overview;

  const allServiceTypes = await db
    .select()
    .from(serviceTypes);

  const availableServices = allServiceTypes.filter(
    (service) => {
      if (!service.isActive) {
        return false;
      }

      if (client.clientType === "individual") {
        return service.availableForIndividuals;
      }

      if (client.clientType === "limited_company") {
        return service.availableForCompanies;
      }

      return service.availableForPartnerships;
    }
  );

  const selectedServiceTypeIds = services.map(
    (service) => service.serviceTypeId
  );

  const activeServiceCount = services.filter(
    (service) => service.serviceStatus === "active"
  ).length;

  return (
    <div>
      <header className="mb-8">
        <Link
          href="/clients"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Clients
        </Link>

        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                {client.displayName}
              </h1>

              <ClientStatusBadge status={client.status} />
            </div>

            {client.registeredName &&
              client.registeredName !==
                client.displayName && (
                <p className="mt-2 text-sm text-gray-500">
                  Registered as {client.registeredName}
                </p>
              )}

            <p className="mt-2 text-sm text-gray-600">
              {formatClientType(client.clientType)}
              {" · "}
              {activeServiceCount} active{" "}
              {activeServiceCount === 1
                ? "service"
                : "services"}
            </p>
          </div>

          <button
            type="button"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Edit
          </button>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Client Details
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Shared client information used across all services.
              </p>
            </div>

            <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
              <Detail
                label="Email"
                value={client.email}
                href={
                  client.email
                    ? `mailto:${client.email}`
                    : undefined
                }
              />

              <Detail
                label="Phone"
                value={client.phone}
                href={
                  client.phone
                    ? `tel:${client.phone}`
                    : undefined
                }
              />

              <Detail
                label="Company Number"
                value={client.companyNumber}
              />

              <Detail
                label="Address"
                value={formatAddress(client)}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Services
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Current work and deadlines for this client.
                </p>
              </div>

              <AddServiceModal
                clientId={client.id}
                services={availableServices}
                selectedServiceTypeIds={
                  selectedServiceTypeIds
                }
              />
            </div>

            {services.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-gray-200 px-6 py-10 text-center">
                <p className="text-sm font-medium text-gray-700">
                  No services assigned
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Add a service to begin managing work for
                  this client.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {services.map((service) => (
                  <ServiceCard
                    key={service.clientServiceId}
                    service={service}
                  />
                ))}
              </div>
            )}
          </section>
        </main>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              At a Glance
            </h2>

            <div className="mt-5 space-y-5">
              <Detail
                label="Client Type"
                value={formatClientType(
                  client.clientType
                )}
              />

              <Detail
                label="Client Status"
                value={
                  client.status === "active"
                    ? "Active"
                    : "Archived"
                }
              />

              <Detail
                label="Active Services"
                value={String(activeServiceCount)}
              />

              <Detail
                label="Registered Name"
                value={client.registeredName}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Relationships
            </h2>

            <div className="mt-5 rounded-xl border border-dashed border-gray-200 p-5">
              <p className="text-sm text-gray-500">
                No relationships recorded yet.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>

            <div className="mt-5 rounded-xl border border-dashed border-gray-200 p-5">
              <p className="text-sm text-gray-500">
                Activity history will appear here once the
                audit timeline is connected.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ServiceCard({
  service,
}: {
  service: ClientServiceSummary;
}) {
  const isInactive =
    service.serviceStatus === "inactive";

  const urgencyClasses =
    service.urgency === "overdue"
      ? "border-red-300 bg-red-50/30 shadow-[0_0_0_1px_rgba(248,113,113,0.15),0_0_22px_rgba(239,68,68,0.14)]"
      : service.urgency === "due_within_two_weeks"
        ? "border-orange-300 bg-orange-50/30 shadow-[0_0_0_1px_rgba(251,146,60,0.14),0_0_22px_rgba(249,115,22,0.14)]"
        : service.urgency === "due_within_four_weeks"
          ? "border-amber-200 bg-amber-50/20"
          : isInactive
            ? "border-gray-200 bg-gray-50"
            : "border-gray-200 bg-white";

  return (
    <article
      className={`flex min-h-52 flex-col rounded-xl border p-4 transition-shadow ${urgencyClasses}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ServiceDot
              serviceCode={service.serviceCode}
            />

            <h3 className="truncate text-sm font-semibold text-gray-900">
              {service.serviceName}
            </h3>
          </div>

          {service.periodLabel && (
            <p className="mt-2 truncate text-xs text-gray-500">
              {service.periodLabel}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <UrgencyBadge service={service} />

          {service.progressStatus &&
          service.progressLabel ? (
            <ProgressBadge
              status={service.progressStatus}
              label={service.progressLabel}
            />
          ) : (
            <ServiceStatusBadge
              status={service.serviceStatus}
            />
          )}
        </div>
      </div>

      <div className="mt-4 flex-1">
        {service.summaryState === "ready" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Detail
                label="Year End"
                value={formatDisplayDate(
                  service.yearEnd
                )}
              />

              <Detail
                label="File By"
                value={formatDisplayDate(
                  service.filingDeadline
                )}
              />
            </div>

            <Detail
              label="Assigned To"
              value={service.assignedTo}
            />
          </div>
        )}

        {service.summaryState ===
          "missing_current_period" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-medium text-amber-900">
              Current period not created
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-700">
              Open the workspace to initialise it.
            </p>
          </div>
        )}

        {service.summaryState ===
          "not_supported" && (
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs leading-5 text-gray-600">
              A detailed overview has not been added for
              this service yet.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-gray-100 pt-3">
        <Link
          href={service.workspaceHref}
          className="inline-flex items-center text-xs font-medium text-[#547f79] hover:text-[#355f5a]"
        >
          Open Workspace
          <span aria-hidden="true" className="ml-1">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}

function Detail({
  label,
  value,
  href,
}: {
  label: string;
  value: string | null;
  href?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      {href && value ? (
        <a
          href={href}
          className="mt-1 block text-sm text-gray-900 hover:text-[#547f79]"
        >
          {value}
        </a>
      ) : (
        <p className="mt-1 text-sm text-gray-900">
          {value || "—"}
        </p>
      )}
    </div>
  );
}

function ClientStatusBadge({
  status,
}: {
  status: "active" | "archived";
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        status === "active"
          ? "bg-emerald-100 text-emerald-800"
          : "bg-gray-100 text-gray-700"
      }`}
    >
      {status === "active" ? "Active" : "Archived"}
    </span>
  );
}

function UrgencyBadge({
  service,
}: {
  service: ClientServiceSummary;
}) {
  if (
    service.urgency === "normal" ||
    service.daysUntilDeadline === null
  ) {
    return null;
  }

  if (service.urgency === "overdue") {
    const overdueDays = Math.abs(
      service.daysUntilDeadline
    );

    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-800">
        {overdueDays === 1
          ? "1 day overdue"
          : `${overdueDays} days overdue`}
      </span>
    );
  }

  if (
    service.urgency === "due_within_two_weeks"
  ) {
    if (service.daysUntilDeadline === 0) {
      return (
        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-800">
          Due today
        </span>
      );
    }

    return (
      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-800">
        Due in {service.daysUntilDeadline} days
      </span>
    );
  }

  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
      Due within 4 weeks
    </span>
  );
}

function ServiceStatusBadge({
  status,
}: {
  status: "active" | "inactive";
}) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
        status === "active"
          ? "bg-emerald-100 text-emerald-800"
          : "bg-gray-100 text-gray-700"
      }`}
    >
      {status === "active" ? "Active" : "Inactive"}
    </span>
  );
}

function ProgressBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  return (
    <span
      title={label}
      className={`max-w-24 shrink-0 truncate rounded-full px-2 py-0.5 text-[10px] font-medium ${
        progressBadgeClasses[status] ??
        "bg-gray-100 text-gray-700"
      }`}
    >
      {label}
    </span>
  );
}

function ServiceDot({
  serviceCode,
}: {
  serviceCode: string;
}) {
  const className =
    serviceCode === "self_assessment"
      ? "bg-emerald-500"
      : serviceCode === "accounts_tracking"
        ? "bg-purple-500"
        : serviceCode === "aml"
          ? "bg-sky-500"
          : "bg-gray-400";

  return (
    <span
      aria-hidden="true"
      className={`h-2.5 w-2.5 rounded-full ${className}`}
    />
  );
}

function formatAddress(client: {
  addressLine1: string | null;
  addressLine2: string | null;
  town: string | null;
  county: string | null;
  postcode: string | null;
}) {
  return [
    client.addressLine1,
    client.addressLine2,
    client.town,
    client.county,
    client.postcode,
  ]
    .filter(Boolean)
    .join(", ");
}

function formatDisplayDate(
  value: string | null
) {
  if (!value) {
    return null;
  }

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return value;
  }

  const [, year, month, day] = match;

  const date = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day)
    )
  );

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}