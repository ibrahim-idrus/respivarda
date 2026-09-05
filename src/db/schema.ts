import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const aqiCategoryEnum = pgEnum("aqi_category", [
  "GOOD",
  "MODERATE",
  "UNHEALTHY_SENSITIVE",
  "UNHEALTHY",
  "VERY_UNHEALTHY",
  "HAZARDOUS",
]);
export const respivardaStatusEnum = pgEnum("respivarda_status", [
  "NORMAL",
  "CAUTION",
  "WARNING",
  "HIGH",
  "VERY_HIGH",
  "CRITICAL",
]);
export const freshnessEnum = pgEnum("freshness", ["FRESH", "STALE", "EXPIRED"]);
export const alertKindEnum = pgEnum("alert_kind", ["alert", "insight", "none"]);
export const channelEnum = pgEnum("channel", ["whatsapp", "telegram"]);
export const deliveryStatusEnum = pgEnum("delivery_status", ["pending", "sent", "failed"]);
export const platformEnum = pgEnum("platform", ["whatsapp", "telegram"]);
export const feedbackCategoryEnum = pgEnum("feedback_category", [
  "sensor_discrepancy",
  "dense_smoke",
  "odor_complaint",
  "map_calibration",
  "app_suggestion",
  "app_bug",
]);
export const feedbackStatusEnum = pgEnum("feedback_status", [
  "pending",
  "investigating",
  "flagged",
  "resolved",
]);

export const locations = pgTable(
  "locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    country: text("country").notNull(),
    lat: doublePrecision("lat").notNull(),
    lon: doublePrecision("lon").notNull(),
    label: text("label"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("locations_city_state_country_unique").on(t.city, t.state, t.country)]
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    whatsappNumber: text("whatsapp_number").unique(),
    telegramChatId: text("telegram_chat_id").unique(),
    telegramUsername: text("telegram_username"),
    locale: text("locale").default("id").notNull(),
    consentGiven: boolean("consent_given").default(false).notNull(),
    consentAt: timestamp("consent_at"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    locationId: uuid("location_id").references(() => locations.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("users_location_id_idx").on(t.locationId)]
);

export const userProfiles = pgTable("user_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  age: integer("age"),
  gender: genderEnum("gender"),
  medicalHistory: text("medical_history").array(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const airQualityRecords = pgTable(
  "air_quality_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    measuredAt: timestamp("measured_at", { withTimezone: true }).notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
    usAqi: integer("us_aqi").notNull(),
    mainPollutant: text("main_pollutant").notNull(),
    aqiCategory: aqiCategoryEnum("aqi_category").notNull(),
    respivardaStatus: respivardaStatusEnum("respivarda_status").notNull(),
    freshness: freshnessEnum("freshness").notNull(),
    dataAgeMinutes: integer("data_age_minutes").notNull(),
    raw: jsonb("raw"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("air_quality_records_location_measured_unique").on(t.locationId, t.measuredAt),
    index("air_quality_records_location_measured_idx").on(t.locationId, t.measuredAt),
  ]
);

export const alertEvents = pgTable(
  "alert_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    airQualityRecordId: uuid("air_quality_record_id")
      .notNull()
      .references(() => airQualityRecords.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    status: respivardaStatusEnum("status").notNull(),
    action: text("action").notNull(),
    severity: integer("severity").notNull(),
    comparison: text("comparison").notNull(),
    persistent: boolean("persistent").notNull(),
    alertDecision: text("alert_decision").notNull(),
    reason: text("reason").notNull(),
    kind: alertKindEnum("kind").notNull(),
    title: text("title"),
    body: text("body"),
    recommendation: text("recommendation"),
    triggeredAt: timestamp("triggered_at").defaultNow().notNull(),
  },
  (t) => [
    index("alert_events_location_triggered_idx").on(t.locationId, t.triggeredAt),
    index("alert_events_record_id_idx").on(t.airQualityRecordId),
  ]
);

export const personalizedInsights = pgTable(
  "personalized_insights",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    alertEventId: uuid("alert_event_id")
      .notNull()
      .references(() => alertEvents.id, { onDelete: "cascade" }),
    recommendation: text("recommendation").notNull(),
    context: jsonb("context"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("personalized_insights_user_alert_unique").on(t.userId, t.alertEventId),
    index("personalized_insights_user_id_idx").on(t.userId),
  ]
);

export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    personalizedInsightId: uuid("personalized_insight_id").references(() => personalizedInsights.id, {
      onDelete: "cascade",
    }),
    alertEventId: uuid("alert_event_id")
      .notNull()
      .references(() => alertEvents.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channel: channelEnum("channel").notNull(),
    recipient: text("recipient").notNull(),
    status: deliveryStatusEnum("status").notNull().default("pending"),
    sentAt: timestamp("sent_at"),
    error: text("error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("notification_deliveries_user_channel_idx").on(t.userId, t.channel),
    index("notification_deliveries_alert_event_idx").on(t.alertEventId),
  ]
);

export const conversationStates = pgTable(
  "conversation_states",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    platform: platformEnum("platform").notNull(),
    externalId: text("external_id").notNull(),
    step: text("step").notNull(),
    tempData: jsonb("temp_data"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("conversation_states_platform_external_unique").on(t.platform, t.externalId)]
);


export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reportRef: text("report_ref").notNull().unique(),
    category: feedbackCategoryEnum("category").notNull(),
    description: text("description").notNull(),
    status: feedbackStatusEnum("status").notNull().default("pending"),
    contactName: text("contact_name"),
    contactWhatsApp: text("contact_whatsapp"),
    contactTelegram: text("contact_telegram"),
    locationText: text("location_text"),
    coordinates: jsonb("coordinates").$type<{ lat: number; long: number }>(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    affectedDevices: text("affected_devices").array(),
    triageNotes: text("triage_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("feedback_status_idx").on(t.status),
    index("feedback_category_idx").on(t.category),
    index("feedback_created_idx").on(t.createdAt),
  ]
);

export const locationsRelations = relations(locations, ({ many }) => ({
  users: many(users),
  airQualityRecords: many(airQualityRecords),
  alertEvents: many(alertEvents),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  location: one(locations, { fields: [users.locationId], references: [locations.id] }),
  profile: one(userProfiles, { fields: [users.id], references: [userProfiles.userId] }),
  insights: many(personalizedInsights),
  deliveries: many(notificationDeliveries),
  feedback: many(feedback),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, { fields: [feedback.userId], references: [users.id] }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, { fields: [userProfiles.userId], references: [users.id] }),
}));

export const airQualityRecordsRelations = relations(airQualityRecords, ({ one, many }) => ({
  location: one(locations, { fields: [airQualityRecords.locationId], references: [locations.id] }),
  alertEvents: many(alertEvents),
}));

export const alertEventsRelations = relations(alertEvents, ({ one, many }) => ({
  record: one(airQualityRecords, { fields: [alertEvents.airQualityRecordId], references: [airQualityRecords.id] }),
  location: one(locations, { fields: [alertEvents.locationId], references: [locations.id] }),
  insights: many(personalizedInsights),
  deliveries: many(notificationDeliveries),
}));

export const personalizedInsightsRelations = relations(personalizedInsights, ({ one, many }) => ({
  user: one(users, { fields: [personalizedInsights.userId], references: [users.id] }),
  alertEvent: one(alertEvents, { fields: [personalizedInsights.alertEventId], references: [alertEvents.id] }),
  deliveries: many(notificationDeliveries),
}));

export const notificationDeliveriesRelations = relations(notificationDeliveries, ({ one }) => ({
  insight: one(personalizedInsights, { fields: [notificationDeliveries.personalizedInsightId], references: [personalizedInsights.id] }),
  alertEvent: one(alertEvents, { fields: [notificationDeliveries.alertEventId], references: [alertEvents.id] }),
  user: one(users, { fields: [notificationDeliveries.userId], references: [users.id] }),
}));
