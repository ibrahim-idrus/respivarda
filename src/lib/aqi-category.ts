export const AQI_CATEGORY_LABEL_ID: Record<string, string> = {
  GOOD: "Baik",
  MODERATE: "Sedang",
  UNHEALTHY_SENSITIVE: "Tidak Sehat (Sensitif)",
  UNHEALTHY: "Tidak Sehat",
  VERY_UNHEALTHY: "Sangat Tidak Sehat",
  HAZARDOUS: "Berbahaya",
};

export function aqiCategoryLabel(cat: string): string {
  return AQI_CATEGORY_LABEL_ID[cat] ?? cat.replaceAll("_", " ");
}
