export interface MonitoredLocation {
  id: string;
  lat: number;
  lon: number;
  label?: string;
}

export const MONITORED_LOCATIONS: MonitoredLocation[] = [
  { id: 'balikpapan', lat: -1.2379, lon: 116.8528, label: 'Balikpapan' },
  { id: 'samarinda', lat: -0.5022, lon: 117.1536, label: 'Samarinda' },
  { id: 'penajam', lat: -1.2805, lon: 116.7136, label: 'Penajam' },
];
