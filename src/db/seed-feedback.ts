import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./index";
import { feedback } from "./schema";

const rows = [
  {
    reportRef: "FB-2025-0841",
    category: "sensor_discrepancy",
    description:
      "Sensor di Kecamatan Ilir Barat I menunjukkan PM2.5 rendah (kategori Baik), tetapi kabut asap terlihat jelas di sekitar Jalan Jenderal Sudirman sejak pukul 06.00 WIB. Mohon periksa kalibrasi perangkat.",
    status: "pending",
    contactName: "Ahmad Fauzi",
    contactWhatsApp: "6281234567801",
    locationText: "Jalan Jenderal Sudirman, Palembang",
    coordinates: { lat: -2.9735, long: 104.7458 },
    affectedDevices: ["SW-PAL-012", "SW-PAL-013"],
  },
  {
    reportRef: "FB-2025-0842",
    category: "dense_smoke",
    description:
      "Asap tebal mulai terlihat dari arah lahan gambut di sekitar Ogan Komering Ilir sejak sore hari. Angin berhembus ke arah permukiman. Warga mulai mengeluh sesak napas.",
    status: "pending",
    contactName: "Siti Rahma",
    contactWhatsApp: "6281234567802",
    contactTelegram: "678900001",
    locationText: "Ogan Komering Ilir",
    coordinates: { lat: -3.2645, long: 105.0341 },
    affectedDevices: [],
  },
  {
    reportRef: "FB-2025-0837",
    category: "odor_complaint",
    description:
      "Bau asap menyengat tercium kuat di kawasan perumahan sekitar Seberang Ulu II, terutama pada malam hari. Anak-anak mulai batuk. Mohon tindak lanjut.",
    status: "investigating",
    contactName: "Budi Santoso",
    contactWhatsApp: "6281234567803",
    locationText: "Seberang Ulu II, Palembang",
    coordinates: { lat: -3.0145, long: 104.7712 },
    affectedDevices: ["SW-PAL-007"],
  },
  {
    reportRef: "FB-2025-0830",
    category: "map_calibration",
    description:
      "Titik lokasi sensor SW-PAL-021 di peta tidak sesuai dengan posisi sebenarnya. Sensor terpasang di kantor lurah, tetapi di peta muncul di tengah sungai.",
    status: "flagged",
    contactName: "Dewi Anggraini",
    contactTelegram: "678900004",
    locationText: "Kecamatan Kemuning, Palembang",
    coordinates: { lat: -2.9568, long: 104.7821 },
    affectedDevices: ["SW-PAL-021"],
  },
  {
    reportRef: "FB-2025-0819",
    category: "app_suggestion",
    description:
      "Usul: tambahkan notifikasi WhatsApp harian berisi ringkasan kualitas udara pagi hari agar warga bisa merencanakan aktivitas luar ruangan.",
    status: "resolved",
    contactName: "Rina Marlina",
    contactWhatsApp: "6281234567805",
    locationText: null,
    coordinates: null,
    affectedDevices: [],
  },
] satisfies (typeof feedback.$inferInsert)[];

async function main() {
  const { rows: found } = await db.execute<{ id: string }>(
    sql`select id from users limit 1`,
  );
  const user = found[0];

  await db.delete(feedback);
  await db.insert(feedback).values(
    rows.map((r) => ({ ...r, userId: user?.id ?? null })),
  );

  console.log(`Seeded ${rows.length} feedback rows.`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.log(JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    process.exit(1);
  },
);
