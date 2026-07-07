CREATE TYPE "public"."self_assessment_bookkeeping_software" AS ENUM('freeagent', 'quickbooks', 'sage', 'xero');--> statement-breakpoint
CREATE TYPE "public"."self_assessment_progress_status" AS ENUM('not_started', 'records_requested', 'records_received', 'in_progress', 'with_client', 'ready_for_review', 'filed', 'not_applicable_this_year');--> statement-breakpoint
CREATE TABLE "self_assessment_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_service_id" uuid NOT NULL,
	"utr" varchar(20),
	"ni_number" varchar(20),
	"date_of_birth" date,
	"bookkeeping_software" "self_assessment_bookkeeping_software",
	"is_mtd" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "self_assessment_profiles_client_service_id_unique" UNIQUE("client_service_id")
);
--> statement-breakpoint
CREATE TABLE "self_assessment_tax_years" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"self_assessment_profile_id" uuid NOT NULL,
	"tax_year" varchar(9) NOT NULL,
	"assigned_to_staff_id" uuid,
	"approved_by_staff_id" uuid,
	"progress_status" "self_assessment_progress_status" DEFAULT 'not_started' NOT NULL,
	"notes" text,
	"filed_at" timestamp,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "self_assessment_tax_years_self_assessment_profile_id_tax_year_unique" UNIQUE("self_assessment_profile_id","tax_year")
);
--> statement-breakpoint
ALTER TABLE "self_assessment_profiles" ADD CONSTRAINT "self_assessment_profiles_client_service_id_client_services_id_fk" FOREIGN KEY ("client_service_id") REFERENCES "public"."client_services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "self_assessment_tax_years" ADD CONSTRAINT "self_assessment_tax_years_self_assessment_profile_id_self_assessment_profiles_id_fk" FOREIGN KEY ("self_assessment_profile_id") REFERENCES "public"."self_assessment_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "self_assessment_tax_years" ADD CONSTRAINT "self_assessment_tax_years_assigned_to_staff_id_staff_users_id_fk" FOREIGN KEY ("assigned_to_staff_id") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "self_assessment_tax_years" ADD CONSTRAINT "self_assessment_tax_years_approved_by_staff_id_staff_users_id_fk" FOREIGN KEY ("approved_by_staff_id") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;