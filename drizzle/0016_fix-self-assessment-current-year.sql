ALTER TABLE "self_assessment_tax_years"
ADD COLUMN IF NOT EXISTS "is_current" boolean DEFAULT false NOT NULL;
--> statement-breakpoint

WITH ranked_tax_years AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "self_assessment_profile_id"
      ORDER BY
        "tax_year" DESC,
        "created_at" DESC,
        "id" DESC
    ) AS row_number
  FROM "self_assessment_tax_years"
)
UPDATE "self_assessment_tax_years"
SET "is_current" = true
FROM ranked_tax_years
WHERE
  "self_assessment_tax_years"."id" = ranked_tax_years."id"
  AND ranked_tax_years.row_number = 1;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS
"self_assessment_one_current_tax_year_per_profile"
ON "self_assessment_tax_years"
USING btree ("self_assessment_profile_id")
WHERE "is_current" = true;