type SelfAssessmentDates = {
  yearEnd: string;
  filingDeadline: string;
};

export function calculateSelfAssessmentDates(
  taxYear: string
): SelfAssessmentDates {
  const match = taxYear.match(/^(\d{4})\/(\d{2})$/);

  if (!match) {
    throw new Error(`Invalid Self Assessment tax year: ${taxYear}`);
  }

  const startYear = Number(match[1]);
  const expectedEndYearSuffix = String(startYear + 1).slice(-2);

  if (match[2] !== expectedEndYearSuffix) {
    throw new Error(`Invalid Self Assessment tax year: ${taxYear}`);
  }

  const endYear = startYear + 1;

  return {
    yearEnd: `${endYear}-03-31`,
    filingDeadline: `${endYear + 1}-01-31`,
  };
}