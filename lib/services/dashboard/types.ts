import type { ClientServiceUrgency } from "@/lib/services/client-overview/types";

export type DashboardWorkItem = {
  clientId: string;
  clientName: string;

  clientServiceId: string;
  serviceCode: string;
  serviceName: string;

  periodLabel: string | null;

  progressStatus: string;
  progressLabel: string;

  assignedToStaffId: string | null;
  assignedTo: string | null;

  deadline: string;
  urgency: ClientServiceUrgency;
  daysUntilDeadline: number | null;

  workspaceHref: string;
};

export type DashboardServiceCount = {
  serviceCode: string;
  serviceName: string;
  count: number;
};

export type DashboardOverview = {
  metrics: {
    overdue: number;
    dueWithinSevenDays: number;
    dueWithinTwentyEightDays: number;
    waitingOnClient: number;
    totalActiveWork: number;
  };

  myWork: DashboardWorkItem[];
  firmUrgentWork: DashboardWorkItem[];
  upcomingDeadlines: DashboardWorkItem[];

  workloadByService: DashboardServiceCount[];
};