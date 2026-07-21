export function getNextTaxYear(currentTaxYear: string) {
  const match = currentTaxYear.match(/^(\d{4})\/(\d{2})$/);

  if (!match) {
    throw new Error(`Invalid tax year: ${currentTaxYear}`);
  }

  const startYear = Number(match[1]);

  const nextStartYear = startYear + 1;
  const nextEndYear = String(nextStartYear + 1).slice(-2);

  return `${nextStartYear}/${nextEndYear}`;
}