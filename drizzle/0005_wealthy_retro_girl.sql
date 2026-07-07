ALTER TABLE "service_types" ADD COLUMN "available_for_individuals" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "service_types" ADD COLUMN "available_for_companies" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "service_types" ADD COLUMN "available_for_partnerships" boolean DEFAULT false NOT NULL;