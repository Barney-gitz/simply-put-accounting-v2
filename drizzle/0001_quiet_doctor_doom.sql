ALTER TABLE "service_types" ADD COLUMN "code" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "service_types" ADD CONSTRAINT "service_types_code_unique" UNIQUE("code");