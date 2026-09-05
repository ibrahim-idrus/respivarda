// ponytail: mock data — ceiling: no live air-quality feed. upgrade: swap these
// exports for a react-query fetch; keep the same types and component props.

export type Scenario = "affected" | "warning" | "safe";

export interface District {
  id: string;
  name: string;
  scenario: Scenario;
  aqi: number;
  category: string;
  distanceKm: number;
  label: string;
  tagline: string;
  blurb: string;
  lat: number;
  lng: number;
}

export const DISTRICTS: District[] = [
  {
    id: "selatan",
    name: "Balikpapan Selatan",
    scenario: "affected",
    aqi: 168,
    category: "Thick Smoke",
    distanceKm: 1.8,
    label: "Plume Core",
    tagline: "Active Warning",
    blurb: "Drifting Smoke",
    lat: -1.2679,
    lng: 116.8289,
  },
  {
    id: "tengah",
    name: "Balikpapan Tengah",
    scenario: "warning",
    aqi: 122,
    category: "Elevated Haze",
    distanceKm: 4.7,
    label: "High Smoke",
    tagline: "Moderate Threat",
    blurb: "Hazy Boundary",
    lat: -1.2123,
    lng: 116.8471,
  },
  {
    id: "kota",
    name: "Balikpapan Kota",
    scenario: "warning",
    aqi: 84,
    category: "Light Soot Drift",
    distanceKm: 5.9,
    label: "Light Smoke",
    tagline: "Watch Perimeter",
    blurb: "Boundary Drift",
    lat: -1.2654,
    lng: 116.8312,
  },
  {
    id: "utara",
    name: "Balikpapan Utara",
    scenario: "safe",
    aqi: 28,
    category: "Normal Atmosphere",
    distanceKm: 8.4,
    label: "Clean Air",
    tagline: "Clear Airway",
    blurb: "Safe Zone",
    lat: -1.1741,
    lng: 116.8617,
  },
];

export interface ScenarioData {
  badge: string;
  title: string;
  description: string;
  smokeStatus: string;
  pm25: string;
  proximity: string;
  trend: string;
  trendUp: boolean;
  plumeDistance: string;
  driftSpeed: string;
  plumeDirection: string;
  driftDirection: string;
}

export const SCENARIOS: Record<Scenario, ScenarioData> = {
  affected: {
    badge: "Active Alert",
    title: "Your Area Is Affected",
    description:
      "Thick smoke has been detected around Balikpapan Selatan. Ground sensors and optical satellite channels detect a concentrated biomass particulate plume within your immediate perimeter.",
    smokeStatus: "Thick Smoke",
    pm25: "88.4 µg/m³",
    proximity: "1.8 km away",
    trend: "Increasing (+14%)",
    trendUp: true,
    plumeDistance: "1.8 km North-East",
    driftSpeed: "6 km/h South-West",
    plumeDirection: "NE",
    driftDirection: "SW",
  },
  warning: {
    badge: "Elevated Watch",
    title: "Drifting Smoke Nearby",
    description:
      "Elevated haze is present around Balikpapan Tengah. Particulate levels are above seasonal norms and may drift toward your perimeter with afternoon sea breeze.",
    smokeStatus: "Elevated Haze",
    pm25: "51.2 µg/m³",
    proximity: "4.7 km away",
    trend: "Stable (±2%)",
    trendUp: false,
    plumeDistance: "4.7 km South",
    driftSpeed: "5 km/h North",
    plumeDirection: "S",
    driftDirection: "N",
  },
  safe: {
    badge: "All Clear",
    title: "Your Air Is Clean",
    description:
      "Balikpapan Utara currently shows normal atmospheric readings. No significant biomass particulate plumes are detected within your perimeter.",
    smokeStatus: "Clean Air",
    pm25: "12.6 µg/m³",
    proximity: "8.4 km away",
    trend: "Decreasing (−6%)",
    trendUp: false,
    plumeDistance: "8.4 km South",
    driftSpeed: "4 km/h away",
    plumeDirection: "S",
    driftDirection: "away",
  },
};

export interface Guidance {
  icon: "mask" | "run" | "window" | "child" | "wind";
  title: string;
  body: string;
}

export const GUIDANCE: Guidance[] = [
  {
    icon: "mask",
    title: "Wear an N95 or KF94 Mask when stepping outdoors",
    body: "PM2.5 micro-soot particles penetrate deep into lung tissue. Standard cloth or basic surgical masks do not filter fine combustion particulates.",
  },
  {
    icon: "run",
    title: "Reduce Outdoor Activities & strenuous exercise",
    body: "Postpone running, cycling, outdoor sports, and heavy manual labor. High respiration rates dramatically increase toxic soot intake.",
  },
  {
    icon: "window",
    title: "Close windows and doors; seal dampers & run HEPA recirculation",
    body: "Set air conditioning units to internal recirculation mode. Avoid pulling unfiltered outdoor smoky air indoors.",
  },
  {
    icon: "child",
    title: "Keep children, elderly, and sensitive groups indoors",
    body: "Individuals with asthma, bronchitis, or cardiovascular conditions must keep rescue inhalers accessible and avoid any external exposure.",
  },
  {
    icon: "wind",
    title: "Monitor wind shifts; sea breeze can rapidly redirect plume",
    body: "Coastal thermal winds can shift plume fronts by up to 90 degrees in late afternoon. Keep radar map active.",
  },
];

export const SCENARIO_STYLES: Record<
  Scenario,
  { bg: string; text: string; border: string; dot: string; mapColor: string }
> = {
  affected: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
    mapColor: "#e11d48",
  },
  warning: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    mapColor: "#d97706",
  },
  safe: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    mapColor: "#059669",
  },
};
