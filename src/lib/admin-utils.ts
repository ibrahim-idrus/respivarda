"use client";

import type { feedback } from "@/src/db/schema";

export type Feedback = typeof feedback.$inferSelect;

export const CATEGORY_LABEL: Record<Feedback["category"], string> = {
  sensor_discrepancy: "Ketidaksesuaian Sensor",
  dense_smoke: "Asap Tebal",
  odor_complaint: "Keluhan Bau",
  map_calibration: "Kalibrasi Peta",
  app_suggestion: "Saran Aplikasi",
  app_bug: "Bug Aplikasi",
};

export const STATUS_LABEL: Record<Feedback["status"], string> = {
  pending: "Menunggu",
  investigating: "Diselidiki",
  flagged: "Ditandai",
  resolved: "Selesai",
};


export const STATUS_BADGE: Record<Feedback["status"], string> = {
  pending: "neutral",
  investigating: "info",
  flagged: "warning",
  resolved: "success",
};


export function formatWIB(d: Date | string | null): string {
  if (!d) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(d));
}
