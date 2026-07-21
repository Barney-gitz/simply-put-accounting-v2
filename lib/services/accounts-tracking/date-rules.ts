export function getNextAccountsPeriodEnd(
  periodEndDate: string
) {
  const date = parseDateString(periodEndDate);
  const originalMonth = date.getUTCMonth();

  date.setUTCFullYear(date.getUTCFullYear() + 1);

  /*
   * JavaScript changes 29 February into 1 March when the target
   * year is not a leap year. For accounting periods, use the final
   * valid day of February instead.
   */
  if (date.getUTCMonth() !== originalMonth) {
    date.setUTCDate(0);
  }

  return formatDateString(date);
}

export function calculateAccountsFilingDeadline(
  periodEndDate: string
) {
  const date = parseDateString(periodEndDate);

  /*
   * Accounts are due on the final calendar day of the month
   * nine months after the accounting period end.
   */
  const deadline = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + 10,
      0
    )
  );

  return formatDateString(deadline);
}

function parseDateString(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error(`Invalid date value: ${value}`);
  }

  const [, year, month, day] = match;

  const numericYear = Number(year);
  const numericMonth = Number(month);
  const numericDay = Number(day);

  const date = new Date(
    Date.UTC(
      numericYear,
      numericMonth - 1,
      numericDay
    )
  );

  const isValidDate =
    date.getUTCFullYear() === numericYear &&
    date.getUTCMonth() === numericMonth - 1 &&
    date.getUTCDate() === numericDay;

  if (!isValidDate) {
    throw new Error(`Invalid date value: ${value}`);
  }

  return date;
}

function formatDateString(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}