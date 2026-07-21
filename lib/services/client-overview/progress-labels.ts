const selfAssessmentProgressLabels: Record<string, string> = {
  not_started: "Not Started",
  records_requested: "Records Requested",
  records_received: "Records Received",
  in_progress: "In Progress",
  with_client: "With Client",
  ready_for_review: "Ready for Review",
  filed: "Filed",
  not_applicable_this_year: "N/A This Year",
};

const accountsTrackingProgressLabels: Record<string, string> = {
  not_started: "Not Started",
  waiting_for_records: "Waiting for Records",
  records_received: "Records Received",
  in_progress: "In Progress",
  ready_for_review: "Ready for Review",
  with_client: "With Client",
  ready_to_file: "Ready to File",
  filed: "Filed",
  not_applicable: "Not Applicable",
};

export function getSelfAssessmentProgressLabel(status: string) {
  return selfAssessmentProgressLabels[status] ?? formatFallbackLabel(status);
}

export function getAccountsTrackingProgressLabel(status: string) {
  return accountsTrackingProgressLabels[status] ?? formatFallbackLabel(status);
}

function formatFallbackLabel(value: string) {
  return value
    .split("_")
    .map((part) => {
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}