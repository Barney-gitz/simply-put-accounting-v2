import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentStaffUser } from "@/lib/auth";
import { getDashboardOverview } from "@/lib/services/dashboard/get-dashboard-overview";
import type {
  DashboardServiceCount,
  DashboardWorkItem,
} from "@/lib/services/dashboard/types";

const progressBadgeClasses: Record<
  string,
  string
> = {
  not_started:
    "bg-gray-100 text-gray-700",

  records_requested:
    "bg-amber-100 text-amber-800",

  waiting_for_records:
    "bg-amber-100 text-amber-800",

  records_received:
    "bg-sky-100 text-sky-800",

  in_progress:
    "bg-indigo-100 text-indigo-800",

  with_client:
    "bg-orange-100 text-orange-800",

  ready_for_review:
    "bg-purple-100 text-purple-800",

  ready_to_file:
    "bg-violet-100 text-violet-800",
};

export default async function DashboardPage() {
  const staffUser =
    await getCurrentStaffUser();

  if (!staffUser) {
    redirect("/login");
  }

  const overview =
    await getDashboardOverview({
      staffUserId: staffUser.id,
    });

  const now = new Date();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-[#547f79]">
          {formatCurrentDate(now)}
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
          {getGreeting(now)},{" "}
          {staffUser.firstName}
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Here&apos;s what&apos;s happening
          across the practice.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Overdue"
          value={overview.metrics.overdue}
          description="Requires immediate attention"
          tone="red"
          icon={<AlertIcon />}
        />

        <MetricCard
          label="Due This Week"
          value={
            overview.metrics
              .dueWithinSevenDays
          }
          description="Due within the next 7 days"
          tone="orange"
          icon={<CalendarIcon />}
        />

        <MetricCard
          label="Due In 4 Weeks"
          value={
            overview.metrics
              .dueWithinTwentyEightDays
          }
          description="Due within the next 28 days"
          tone="amber"
          icon={<ClockIcon />}
        />

        <MetricCard
          label="Waiting On Client"
          value={
            overview.metrics.waitingOnClient
          }
          description="Records or approval outstanding"
          tone="blue"
          icon={<PeopleIcon />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.78fr)]">
        <Panel>
          <PanelHeader
            title="My Work"
            count={overview.myWork.length}
            description="Work assigned to you"
          />

          {overview.myWork.length === 0 ? (
            <EmptyState message="You have no active work assigned." />
          ) : (
            <div className="mt-5 space-y-3">
              {overview.myWork.map(
                (item) => (
                  <MyWorkCard
                    key={`${item.clientServiceId}-${item.periodLabel}`}
                    item={item}
                  />
                )
              )}
            </div>
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Upcoming Deadlines"
            description="Due within the next 28 days"
            icon={<CalendarIcon />}
          />

          {overview.upcomingDeadlines
            .length === 0 ? (
            <EmptyState message="No deadlines within the next four weeks." />
          ) : (
            <div className="mt-4 divide-y divide-gray-100">
              {overview.upcomingDeadlines.map(
                (item) => (
                  <DeadlineRow
                    key={`${item.clientServiceId}-${item.periodLabel}`}
                    item={item}
                  />
                )
              )}
            </div>
          )}
        </Panel>
      </section>

      <Panel>
        <PanelHeader
          title="Firm Work"
          count={
            overview.firmUrgentWork.length
          }
          description="Overdue and due within the next two weeks"
        />

        {overview.firmUrgentWork.length ===
        0 ? (
          <EmptyState message="There is no urgent firm work." />
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {overview.firmUrgentWork.map(
              (item) => (
                <FirmWorkCard
                  key={`${item.clientServiceId}-${item.periodLabel}`}
                  item={item}
                />
              )
            )}
          </div>
        )}
      </Panel>

      <section className="grid gap-6 xl:grid-cols-3">
        <Panel>
          <PanelHeader title="Workload Overview" />

          <WorkloadOverview
            total={
              overview.metrics.totalActiveWork
            }
            overdue={
              overview.metrics.overdue
            }
            dueThisWeek={
              overview.metrics
                .dueWithinSevenDays
            }
            dueWithinFourWeeks={
              overview.metrics
                .dueWithinTwentyEightDays
            }
            waitingOnClient={
              overview.metrics.waitingOnClient
            }
          />
        </Panel>

        <Panel>
          <PanelHeader title="Work By Service" />

          <WorkByService
            items={
              overview.workloadByService
            }
          />
        </Panel>

        <Panel>
          <PanelHeader title="Recent Activity" />

          <div className="mt-5 rounded-xl border border-dashed border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-700">
              Activity timeline not connected
            </p>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Saves, archives, filings and
              approvals will appear here once
              the shared audit timeline is
              implemented.
            </p>
          </div>
        </Panel>
      </section>
    </div>
  );
}

function Panel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      {children}
    </section>
  );
}

function PanelHeader({
  title,
  description,
  count,
  icon,
}: {
  title: string;
  description?: string;
  count?: number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          {icon && (
            <span className="text-gray-500">
              {icon}
            </span>
          )}

          <h2 className="text-lg font-semibold text-gray-900">
            {title}
          </h2>

          {count !== undefined && (
            <span className="rounded-full bg-[#6BC1B7]/15 px-2.5 py-1 text-xs font-medium text-[#2F7F77]">
              {count}
            </span>
          )}
        </div>

        {description && (
          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
  tone,
  icon,
}: {
  label: string;
  value: number;
  description: string;
  tone:
    | "red"
    | "orange"
    | "amber"
    | "blue";
  icon: React.ReactNode;
}) {
  const classes = {
    red: {
      iconBackground: "bg-red-50",
      iconColour: "text-red-600",
      value: "text-red-600",
    },

    orange: {
      iconBackground: "bg-orange-50",
      iconColour: "text-orange-600",
      value: "text-orange-600",
    },

    amber: {
      iconBackground: "bg-amber-50",
      iconColour: "text-amber-500",
      value: "text-amber-500",
    },

    blue: {
      iconBackground: "bg-sky-50",
      iconColour: "text-sky-600",
      value: "text-sky-600",
    },
  }[tone];

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${classes.iconBackground} ${classes.iconColour}`}
        >
          {icon}
        </span>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>

          <p
            className={`mt-1 text-3xl font-semibold ${classes.value}`}
          >
            {value}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-500">
        {description}
      </p>
    </article>
  );
}

function MyWorkCard({
  item,
}: {
  item: DashboardWorkItem;
}) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <span
        className={`absolute inset-y-0 left-0 w-1 ${getServiceColour(
          item.serviceCode
        )}`}
      />

      <div className="flex items-start justify-between gap-4 pl-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ServiceDot
              serviceCode={item.serviceCode}
            />

            <p className="truncate text-sm font-semibold text-gray-900">
              {item.serviceName}
            </p>
          </div>

          <Link
            href={`/clients/${item.clientId}`}
            className="mt-2 block truncate text-sm font-medium text-gray-800 hover:text-[#547f79]"
          >
            {item.clientName}
          </Link>

          <p className="mt-1 truncate text-xs text-gray-500">
            {item.periodLabel}
          </p>
        </div>

        <UrgencyBadge item={item} />
      </div>

      <div className="mt-4 grid gap-4 pl-2 sm:grid-cols-3">
        <DetailWithBadge
          label="Progress"
          status={item.progressStatus}
          value={item.progressLabel}
        />

        <Detail
          label="File By"
          value={formatDisplayDate(
            item.deadline
          )}
        />

        <Detail
          label="Client"
          value={item.clientName}
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 pl-2">
        <p className="text-xs text-gray-500">
          {item.assignedTo || "Unassigned"}
        </p>

        <Link
          href={item.workspaceHref}
          className="text-xs font-medium text-[#2F7F77] hover:text-[#245f59]"
        >
          Open Workspace →
        </Link>
      </div>
    </article>
  );
}

function DeadlineRow({
  item,
}: {
  item: DashboardWorkItem;
}) {
  const parts = getDeadlineDateParts(
    item.deadline
  );

  return (
    <Link
      href={item.workspaceHref}
      className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
    >
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
        <span
          className={`text-xl font-semibold ${
            item.urgency === "overdue"
              ? "text-red-600"
              : "text-orange-500"
          }`}
        >
          {parts.day}
        </span>

        <span className="text-[10px] font-medium uppercase text-gray-500">
          {parts.weekday}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">
          {item.serviceName}
        </p>

        <p className="mt-1 truncate text-sm text-gray-700">
          {item.clientName}
        </p>

        <p className="mt-1 text-xs text-gray-500">
          {item.assignedTo || "Unassigned"}
        </p>
      </div>

      <p
        className={`shrink-0 text-xs font-medium ${
          item.urgency === "overdue"
            ? "text-red-600"
            : "text-orange-600"
        }`}
      >
        {formatDeadlineDistance(item)}
      </p>
    </Link>
  );
}

function FirmWorkCard({
  item,
}: {
  item: DashboardWorkItem;
}) {
  const overdue =
    item.urgency === "overdue";

  return (
    <article className="flex min-h-52 flex-col rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            overdue
              ? "bg-red-500"
              : "bg-orange-500"
          }`}
        />

        <p
          className={`text-[10px] font-semibold uppercase tracking-wide ${
            overdue
              ? "text-red-700"
              : "text-orange-700"
          }`}
        >
          {formatDeadlineDistance(item)}
        </p>
      </div>

      <p className="mt-3 text-sm font-semibold text-gray-900">
        {item.serviceName}
      </p>

      <p className="mt-1 truncate text-sm text-gray-700">
        {item.clientName}
      </p>

      <p className="mt-1 text-xs text-gray-500">
        {item.periodLabel}
      </p>

      <div className="mt-4">
        <UrgencyBadge item={item} />
      </div>

      <div className="mt-auto border-t border-gray-100 pt-3">
        <p className="text-xs text-gray-500">
          {item.assignedTo || "Unassigned"}
        </p>

        <Link
          href={item.workspaceHref}
          className="mt-2 inline-flex text-xs font-medium text-[#2F7F77] hover:text-[#245f59]"
        >
          Open →
        </Link>
      </div>
    </article>
  );
}

function WorkloadOverview({
  total,
  overdue,
  dueThisWeek,
  dueWithinFourWeeks,
  waitingOnClient,
}: {
  total: number;
  overdue: number;
  dueThisWeek: number;
  dueWithinFourWeeks: number;
  waitingOnClient: number;
}) {
  /*
   * dueWithinFourWeeks includes dueThisWeek, so subtract it
   * to produce a separate 8–28 day segment.
   */
  const dueEightToTwentyEightDays = Math.max(
    dueWithinFourWeeks - dueThisWeek,
    0
  );

  const otherActiveWork = Math.max(
    total -
      overdue -
      dueThisWeek -
      dueEightToTwentyEightDays,
    0
  );

  const safeTotal = Math.max(total, 1);

  const overdueEnd =
    (overdue / safeTotal) * 100;

  const dueThisWeekEnd =
    overdueEnd +
    (dueThisWeek / safeTotal) * 100;

  const dueWithinFourWeeksEnd =
    dueThisWeekEnd +
    (dueEightToTwentyEightDays / safeTotal) * 100;

  const donutBackground =
    total === 0
      ? "conic-gradient(#e5e7eb 0% 100%)"
      : `conic-gradient(
          #ef4444 0% ${overdueEnd}%,
          #f97316 ${overdueEnd}% ${dueThisWeekEnd}%,
          #fbbf24 ${dueThisWeekEnd}% ${dueWithinFourWeeksEnd}%,
          #6BC1B7 ${dueWithinFourWeeksEnd}% 100%
        )`;

  return (
    <div className="mt-5">
      <div className="flex justify-center">
        <div
          className="flex h-44 w-44 items-center justify-center rounded-full"
          style={{
            background: donutBackground,
          }}
        >
          <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white shadow-inner">
            <p className="text-3xl font-semibold text-gray-900">
              {total}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Active work
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <WorkloadLegendRow
          label="Overdue"
          value={overdue}
          total={total}
          colour="bg-red-500"
        />

        <WorkloadLegendRow
          label="Due this week"
          value={dueThisWeek}
          total={total}
          colour="bg-orange-500"
        />

        <WorkloadLegendRow
          label="Due in 8–28 days"
          value={dueEightToTwentyEightDays}
          total={total}
          colour="bg-amber-400"
        />

        <WorkloadLegendRow
          label="Other active work"
          value={otherActiveWork}
          total={total}
          colour="bg-[#6BC1B7]"
        />

        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />

              <div>
                <p className="text-sm text-gray-600">
                  Waiting on client
                </p>

                <p className="text-xs text-gray-400">
                  Included in the workload above
                </p>
              </div>
            </div>

            <p className="text-sm font-medium text-gray-900">
              {waitingOnClient}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkloadLegendRow({
  label,
  value,
  total,
  colour,
}: {
  label: string;
  value: number;
  total: number;
  colour: string;
}) {
  const percentage =
    total === 0
      ? 0
      : Math.round((value / total) * 100);

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${colour}`}
        />

        <p className="text-sm text-gray-600">
          {label}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <p className="text-xs text-gray-400">
          {percentage}%
        </p>

        <p className="w-5 text-right text-sm font-medium text-gray-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function WorkByService({
  items,
}: {
  items: DashboardServiceCount[];
}) {
  const maximum = Math.max(
    ...items.map((item) => item.count),
    1
  );

  if (items.length === 0) {
    return (
      <EmptyState message="No active work to summarise." />
    );
  }

  return (
    <div className="mt-5 space-y-5">
      {items.map((item) => {
        const width =
          (item.count / maximum) * 100;

        return (
          <div key={item.serviceCode}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-2">
                <ServiceDot
                  serviceCode={item.serviceCode}
                />

                <p className="truncate text-sm text-gray-700">
                  {item.serviceName}
                </p>
              </div>

              <p className="shrink-0 text-sm font-medium text-gray-900">
                {item.count}
              </p>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full ${getServiceColour(
                  item.serviceCode
                )}`}
                style={{
                  width: `${width}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-gray-200 p-6 text-center">
      <p className="text-sm text-gray-500">
        {message}
      </p>
    </div>
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

      <p className="mt-1 truncate text-sm text-gray-900">
        {value || "—"}
      </p>
    </div>
  );
}

function DetailWithBadge({
  label,
  status,
  value,
}: {
  label: string;
  status: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <span
        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
          progressBadgeClasses[status] ??
          "bg-gray-100 text-gray-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function UrgencyBadge({
  item,
}: {
  item: DashboardWorkItem;
}) {
  if (
    item.daysUntilDeadline === null ||
    item.urgency === "normal"
  ) {
    return null;
  }

  const overdue =
    item.urgency === "overdue";

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${
        overdue
          ? "bg-red-100 text-red-700"
          : item.urgency ===
              "due_within_two_weeks"
            ? "bg-orange-100 text-orange-700"
            : "bg-amber-100 text-amber-700"
      }`}
    >
      {formatDeadlineDistance(item)}
    </span>
  );
}

function ServiceDot({
  serviceCode,
}: {
  serviceCode: string;
}) {
  return (
    <span
      className={`h-2.5 w-2.5 shrink-0 rounded-full ${getServiceColour(
        serviceCode
      )}`}
    />
  );
}

function getServiceColour(
  serviceCode: string
) {
  switch (serviceCode) {
    case "self_assessment":
      return "bg-emerald-500";

    case "accounts_tracking":
      return "bg-purple-500";

    case "vat":
      return "bg-orange-500";

    case "paye":
      return "bg-red-500";

    case "cis":
      return "bg-cyan-500";

    case "mtd_itsa":
      return "bg-amber-400";

    case "aml":
      return "bg-sky-500";

    default:
      return "bg-gray-400";
  }
}

function getDeadlineDateParts(
  value: string
) {
  const date = parseDate(value);

  return {
    day: new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      timeZone: "UTC",
    }).format(date),

    weekday: new Intl.DateTimeFormat(
      "en-GB",
      {
        weekday: "short",
        timeZone: "UTC",
      }
    ).format(date),
  };
}

function formatDeadlineDistance(
  item: DashboardWorkItem
) {
  const days = item.daysUntilDeadline;

  if (days === null) {
    return "";
  }

  if (days < 0) {
    const overdueDays = Math.abs(days);

    return overdueDays === 1
      ? "1 day overdue"
      : `${overdueDays} days overdue`;
  }

  if (days === 0) {
    return "Due today";
  }

  if (days === 1) {
    return "Due tomorrow";
  }

  return `Due in ${days} days`;
}

function formatDisplayDate(
  value: string
) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parseDate(value));
}

function parseDate(value: string) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value
    );

  if (!match) {
    throw new Error(
      `Invalid date value: ${value}`
    );
  }

  const [, year, month, day] = match;

  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day)
    )
  );
}

function getGreeting(value: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: "Europe/London",
    }).format(value)
  );

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function formatCurrentDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(value);
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 7.5v6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="17"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="5.5"
        width="16"
        height="15"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 3.5v4M16 3.5v4M4 10h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 7.5V12l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <circle
        cx="9"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M3.5 20v-1.5A4.5 4.5 0 0 1 8 14h2a4.5 4.5 0 0 1 4.5 4.5V20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M15.5 5.5a3 3 0 0 1 0 5.8M17 14.5a4.5 4.5 0 0 1 3.5 4.4V20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}