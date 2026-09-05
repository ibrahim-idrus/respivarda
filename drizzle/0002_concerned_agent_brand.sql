ALTER TYPE "public"."feedback_category" ADD VALUE 'app_bug';--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "residence" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "consent_given" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "consent_at" timestamp;