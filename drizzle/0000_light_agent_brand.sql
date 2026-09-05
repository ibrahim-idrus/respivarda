CREATE TYPE "public"."activity_level" AS ENUM('low', 'moderate', 'high');--> statement-breakpoint
CREATE TYPE "public"."alert_kind" AS ENUM('alert', 'insight', 'none');--> statement-breakpoint
CREATE TYPE "public"."aqi_category" AS ENUM('GOOD', 'MODERATE', 'UNHEALTHY_SENSITIVE', 'UNHEALTHY', 'VERY_UNHEALTHY', 'HAZARDOUS');--> statement-breakpoint
CREATE TYPE "public"."channel" AS ENUM('whatsapp', 'telegram');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."freshness" AS ENUM('FRESH', 'STALE', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('whatsapp', 'telegram');--> statement-breakpoint
CREATE TYPE "public"."respivarda_status" AS ENUM('NORMAL', 'CAUTION', 'WARNING', 'HIGH', 'VERY_HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TABLE "air_quality_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"measured_at" timestamp NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"us_aqi" integer NOT NULL,
	"main_pollutant" text NOT NULL,
	"aqi_category" "aqi_category" NOT NULL,
	"respivarda_status" "respivarda_status" NOT NULL,
	"freshness" "freshness" NOT NULL,
	"data_age_minutes" integer NOT NULL,
	"raw" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"air_quality_record_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"status" "respivarda_status" NOT NULL,
	"action" text NOT NULL,
	"severity" integer NOT NULL,
	"comparison" text NOT NULL,
	"persistent" boolean NOT NULL,
	"alert_decision" text NOT NULL,
	"reason" text NOT NULL,
	"kind" "alert_kind" NOT NULL,
	"title" text,
	"body" text,
	"recommendation" text,
	"triggered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" "platform" NOT NULL,
	"external_id" text NOT NULL,
	"step" text NOT NULL,
	"temp_data" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"physical_activity" "activity_level",
	"avg_sleep_hours" numeric(3, 1),
	"symptoms" text[],
	"logged_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"country" text NOT NULL,
	"lat" double precision NOT NULL,
	"lon" double precision NOT NULL,
	"label" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"personalized_insight_id" uuid,
	"alert_event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"channel" "channel" NOT NULL,
	"recipient" text NOT NULL,
	"status" "delivery_status" DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personalized_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"alert_event_id" uuid NOT NULL,
	"recommendation" text NOT NULL,
	"context" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"age" integer,
	"gender" "gender",
	"medical_history" text[],
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"whatsapp_number" text NOT NULL,
	"telegram_chat_id" text,
	"location_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_whatsapp_number_unique" UNIQUE("whatsapp_number"),
	CONSTRAINT "users_telegram_chat_id_unique" UNIQUE("telegram_chat_id")
);
--> statement-breakpoint
ALTER TABLE "air_quality_records" ADD CONSTRAINT "air_quality_records_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_air_quality_record_id_air_quality_records_id_fk" FOREIGN KEY ("air_quality_record_id") REFERENCES "public"."air_quality_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_logs" ADD CONSTRAINT "health_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_personalized_insight_id_personalized_insights_id_fk" FOREIGN KEY ("personalized_insight_id") REFERENCES "public"."personalized_insights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_alert_event_id_alert_events_id_fk" FOREIGN KEY ("alert_event_id") REFERENCES "public"."alert_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personalized_insights" ADD CONSTRAINT "personalized_insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personalized_insights" ADD CONSTRAINT "personalized_insights_alert_event_id_alert_events_id_fk" FOREIGN KEY ("alert_event_id") REFERENCES "public"."alert_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "air_quality_records_location_measured_unique" ON "air_quality_records" USING btree ("location_id","measured_at");--> statement-breakpoint
CREATE INDEX "air_quality_records_location_measured_idx" ON "air_quality_records" USING btree ("location_id","measured_at");--> statement-breakpoint
CREATE INDEX "alert_events_location_triggered_idx" ON "alert_events" USING btree ("location_id","triggered_at");--> statement-breakpoint
CREATE INDEX "alert_events_record_id_idx" ON "alert_events" USING btree ("air_quality_record_id");--> statement-breakpoint
CREATE UNIQUE INDEX "conversation_states_platform_external_unique" ON "conversation_states" USING btree ("platform","external_id");--> statement-breakpoint
CREATE INDEX "health_logs_user_id_logged_at_idx" ON "health_logs" USING btree ("user_id","logged_at");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_city_state_country_unique" ON "locations" USING btree ("city","state","country");--> statement-breakpoint
CREATE INDEX "notification_deliveries_user_channel_idx" ON "notification_deliveries" USING btree ("user_id","channel");--> statement-breakpoint
CREATE INDEX "notification_deliveries_alert_event_idx" ON "notification_deliveries" USING btree ("alert_event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "personalized_insights_user_alert_unique" ON "personalized_insights" USING btree ("user_id","alert_event_id");--> statement-breakpoint
CREATE INDEX "personalized_insights_user_id_idx" ON "personalized_insights" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_location_id_idx" ON "users" USING btree ("location_id");