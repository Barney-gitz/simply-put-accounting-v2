CREATE TYPE "public"."accounts_tracking_progress_status" AS ENUM('not_started', 'waiting_for_records', 'records_received', 'in_progress', 'ready_for_review', 'with_client', 'ready_to_file', 'filed', 'not_applicable');--> statement-breakpoint
CREATE TABLE "accounts_tracking_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_service_id" uuid NOT NULL,
	"period_end_date" date,
	"filing_deadline" date,
	"progress_status" "accounts_tracking_progress_status" DEFAULT 'not_started' NOT NULL,
	"assigned_to_staff_id" uuid,
	"approved_by_staff_id" uuid,
	"filed_at" timestamp,
	"notes" text,
	"snapshot" text,
	"is_current" boolean DEFAULT true NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_tracking_periods_client_service_id_period_end_date_unique" UNIQUE("client_service_id","period_end_date")
);
--> statement-breakpoint
ALTER TABLE "accounts_tracking_periods" ADD CONSTRAINT "accounts_tracking_periods_client_service_id_client_services_id_fk" FOREIGN KEY ("client_service_id") REFERENCES "public"."client_services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_tracking_periods" ADD CONSTRAINT "accounts_tracking_periods_assigned_to_staff_id_staff_users_id_fk" FOREIGN KEY ("assigned_to_staff_id") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_tracking_periods" ADD CONSTRAINT "accounts_tracking_periods_approved_by_staff_id_staff_users_id_fk" FOREIGN KEY ("approved_by_staff_id") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_tracking_one_current_period_per_service" ON "accounts_tracking_periods" USING btree ("client_service_id") WHERE "accounts_tracking_periods"."is_current" = true;