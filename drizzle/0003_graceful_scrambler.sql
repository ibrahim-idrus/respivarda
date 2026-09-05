ALTER TABLE "air_quality_records" ALTER COLUMN "measured_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "air_quality_records" ALTER COLUMN "fetched_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "air_quality_records" ALTER COLUMN "fetched_at" SET DEFAULT now();