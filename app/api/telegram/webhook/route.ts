import { desc, eq } from "drizzle-orm";
import { db } from "@/src/db";
import { conversationStates, healthLogs, userProfiles, users } from "@/src/db/schema";
import { isValidWebhookSecret, sendTelegramMessage, escapeHtml } from "@/lib/telegram";
import { formatAqiCard, formatRecommendationBlock } from "@/lib/telegram/format";
import { evaluateRuleEngine } from "@/lib/airvisual";
import { getAqiForCoords } from "@/lib/airvisual/cache";
import { generateAlertInsightRecommendation } from "@/lib/ai/recommendation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INTRO = [
  "👋 <b>Halo, saya Respivarda</b>",
  "Pemantau kualitas udara pribadi Anda.",
  "",
  "<b>Yang saya lakukan untuk Anda:</b>",
  "• 🌬️ Pantau kualitas udara di lokasi Anda",
  "• 💡 Beri wawasan dan rekomendasi kesehatan",
  "• 🔔 Kirim peringatan proaktif saat udara memburuk",
  "",
  "<b>Data yang saya simpan:</b>",
  "• Nama, usia, dan jenis kelamin",
  "• Riwayat penyakit pernapasan",
  "• Domisili dan lokasi pemantauan",
  "",
  "Apakah Anda <b>setuju</b> melanjutkan pendaftaran?",
].join("\n");

const CONSENT_KEYBOARD = {
  keyboard: [[{ text: "Setuju" }, { text: "Tidak" }]],
  resize_keyboard: true,
  one_time_keyboard: true,
};
const GENDER_KEYBOARD = {
  keyboard: [[{ text: "Laki-laki" }, { text: "Perempuan" }, { text: "Lainnya" }]],
  resize_keyboard: true,
  one_time_keyboard: true,
};
const LOCATION_KEYBOARD = {
  keyboard: [[{ text: "Bagikan Lokasi Saya", request_location: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
};
const MEDICAL_OPTIONS = [
  "Influenza",
  "Batuk pilek",
  "Faringitis",
  "Mpox",
  "Hanta",
  "Pneumonia",
  "Bronkiolitis",
  "Bronkitis akut",
  "Sinusitis",
];
const MEDICAL_KEYBOARD = {
  keyboard: [
    [{ text: "Influenza" }, { text: "Batuk pilek" }],
    [{ text: "Faringitis" }, { text: "Mpox" }],
    [{ text: "Hanta" }, { text: "Pneumonia" }],
    [{ text: "Bronkiolitis" }, { text: "Bronkitis akut" }],
    [{ text: "Sinusitis" }],
    [{ text: "Tidak ada" }, { text: "Selesai" }],
  ],
  resize_keyboard: true,
  one_time_keyboard: false,
};
const MAIN_MENU = {
  keyboard: [
    [{ text: "Cek Kualitas Udara" }],
    [{ text: "Perbarui Lokasi" }, { text: "Profil & Statistik" }],
  ],
  resize_keyboard: true,
};
const REMOVE_KEYBOARD = { remove_keyboard: true };

type TelegramChat = { id?: number; type?: string };
type TelegramFrom = {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};
type TelegramLocation = { latitude?: number; longitude?: number };
type TelegramMessage = {
  text?: string;
  chat?: TelegramChat;
  from?: TelegramFrom;
  location?: TelegramLocation;
};
type TelegramUpdate = { message?: TelegramMessage };

function fullName(from?: TelegramFrom): string {
  return [from?.first_name, from?.last_name].filter(Boolean).join(" ").trim();
}

function validCoords(lat?: number, lon?: number): lat is number {
  return (
    typeof lat === "number" &&
    typeof lon === "number" &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

async function getState(chatId: number): Promise<string | null> {
  const rows = await db
    .select({ step: conversationStates.step })
    .from(conversationStates)
    .where(eq(conversationStates.externalId, String(chatId)))
    .limit(1);
  return rows[0]?.step ?? null;
}

async function setState(chatId: number, step: string) {
  const externalId = String(chatId);
  await db
    .insert(conversationStates)
    .values({ platform: "telegram", externalId, step, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [conversationStates.platform, conversationStates.externalId],
      set: { step, updatedAt: new Date() },
    });
}

async function upsertUser(chatId: number, from?: TelegramFrom) {
  const name = fullName(from) || "Respivarda User";
  const values = {
    name,
    telegramChatId: String(chatId),
    telegramUsername: from?.username ?? null,
    locale: from?.language_code ?? "id",
    updatedAt: new Date(),
  };
  await db.insert(users).values(values).onConflictDoUpdate({
    target: users.telegramChatId,
    set: values,
  });
}

async function getUser(chatId: number) {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.telegramChatId, String(chatId)))
    .limit(1);
  return rows[0] ?? null;
}

async function saveProfile(userId: string, patch: Partial<{ age: number; gender: "male" | "female" | "other"; residence: string; medicalHistory: string[] }>) {
  await db
    .insert(userProfiles)
    .values({ userId, ...patch, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: { ...patch, updatedAt: new Date() },
    });
}

function parseAge(text: string): number | null {
  const n = Number.parseInt(text.trim(), 10);
  if (!Number.isInteger(n) || n < 0 || n > 120) return null;
  return n;
}

function parseGender(text: string): "male" | "female" | "other" | null {
  const t = text.trim().toLowerCase();
  if (["laki-laki", "laki", "male", "pria"].includes(t)) return "male";
  if (["perempuan", "female", "wanita"].includes(t)) return "female";
  if (["lainnya", "other", "lain"].includes(t)) return "other";
  return null;
}

function matchMedicalOption(text: string): string | null {
  const t = text.trim().toLowerCase();
  return MEDICAL_OPTIONS.find((o) => o.toLowerCase() === t) ?? null;
}

function isMedicalDone(text: string): boolean {
  return ["selesai", "done", "lanjut"].includes(text.trim().toLowerCase());
}

function isMedicalNone(text: string): boolean {
  const t = text.trim().toLowerCase();
  return t === "tidak ada" || t === "-";
}

async function getMedicalDraft(userId: string): Promise<string[]> {
  const [profile] = await db
    .select({ medicalHistory: userProfiles.medicalHistory })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  return profile?.medicalHistory ?? [];
}

function isYes(text: string): boolean {
  return ["setuju", "ya", "yes", "ok"].includes(text.trim().toLowerCase());
}

function isNo(text: string): boolean {
  return ["tidak", "no", "batal"].includes(text.trim().toLowerCase());
}

async function showMainMenu(chatId: number, intro?: string) {
  const body = intro
    ? `📋 <b>Menu Utama</b>\n\n${escapeHtml(intro)}\n\n👇 <i>Silakan pilih menu di bawah:</i>`
    : "📋 <b>Menu Utama</b>\n\n👇 <i>Silakan pilih menu di bawah:</i>";
  await sendTelegramMessage(chatId, body, MAIN_MENU);
}

async function runInitialAqi(chatId: number, lat: number, lon: number) {
  const { cached } = await getAqiForCoords(lat, lon);
  if (!cached) {
    await setState(chatId, "onboarded");
    await sendTelegramMessage(
      chatId,
      "Pendaftaran tersimpan. Data kualitas udara belum tersedia saat ini, coba menu Cek Kualitas Udara nanti."
    );
    await showMainMenu(chatId);
    return;
  }
  const current = {
    city: cached.city,
    state: cached.state,
    country: cached.country,
    latitude: cached.latitude,
    longitude: cached.longitude,
    usAqi: cached.usAqi,
    aqiCategory: cached.aqiCategory,
    mainPollutant: cached.mainPollutant as "PM2.5" | "PM10" | "O3" | "NO2" | "SO2" | "CO",
    measuredAt: cached.measuredAt,
    dataAgeMinutes: cached.dataAgeMinutes,
    freshness: cached.dataAgeMinutes <= 120 ? ("FRESH" as const) : cached.dataAgeMinutes <= 180 ? ("STALE" as const) : ("EXPIRED" as const),
  };
  const rule = evaluateRuleEngine({ current });
  const user = await getUser(chatId);
  const [profile] = user
    ? await db
        .select({
          age: userProfiles.age,
          gender: userProfiles.gender,
          medicalHistory: userProfiles.medicalHistory,
        })
        .from(userProfiles)
        .where(eq(userProfiles.userId, user.id))
        .limit(1)
    : [];
  const [healthLog] = user
    ? await db
        .select({
          physicalActivity: healthLogs.physicalActivity,
          avgSleepHours: healthLogs.avgSleepHours,
          symptoms: healthLogs.symptoms,
        })
        .from(healthLogs)
        .where(eq(healthLogs.userId, user.id))
        .orderBy(desc(healthLogs.loggedAt))
        .limit(1)
    : [];
  const { insight, recommendation } = await generateAlertInsightRecommendation({
    current,
    rule,
    profile: profile ?? null,
    healthLog: healthLog ?? null,
  });
  await setState(chatId, "onboarded");
  const isFresh = current.freshness === "FRESH";
  const isAlert = rule.alertDecision === "trigger" && rule.severity >= 2 && isFresh;
  await sendTelegramMessage(
    chatId,
    formatAqiCard({
      city: current.city,
      usAqi: current.usAqi,
      category: rule.category,
      pollutant: current.mainPollutant,
      isAlert,
      freshness: current.freshness,
      dataAgeMinutes: current.dataAgeMinutes,
      medicalHistory: profile?.medicalHistory ?? [],
    }),
    REMOVE_KEYBOARD
  );
  if (recommendation ?? insight) {
    await sendTelegramMessage(
      chatId,
      formatRecommendationBlock({
        insight,
        recommendation,
        medicalHistory: profile?.medicalHistory ?? [],
      })
    );
  } else {
    await sendTelegramMessage(chatId, "Rekomendasi personal belum tersedia saat ini.");
  }
  await showMainMenu(chatId);
}

async function handleStart(chatId: number, from?: TelegramFrom) {
  await upsertUser(chatId, from);
  const user = await getUser(chatId);
  if (user?.consentGiven) {
    await setState(chatId, "onboarded");
    await showMainMenu(chatId, "Selamat datang kembali.");
    return;
  }
  await setState(chatId, "awaiting_consent");
  await sendTelegramMessage(chatId, INTRO, CONSENT_KEYBOARD);
}

async function handleText(chatId: number, text: string, from?: TelegramFrom) {
  const step = await getState(chatId);
  if (text.startsWith("/start")) {
    await handleStart(chatId, from);
    return;
  }
  if (!step || step === "awaiting_consent") {
    if (isYes(text)) {
      const user = await getUser(chatId);
      if (user) {
        await db
          .update(users)
          .set({ consentGiven: true, consentAt: new Date(), updatedAt: new Date() })
          .where(eq(users.id, user.id));
      }
      await setState(chatId, "awaiting_name");
      await sendTelegramMessage(chatId, "✅ <b>Persetujuan tersimpan.</b>\n\n📝 <b>Langkah 1 dari 5</b>\nSiapa <b>nama</b> Anda?", REMOVE_KEYBOARD);
    } else if (isNo(text)) {
      await setState(chatId, "declined");
      await sendTelegramMessage(
        chatId,
        "Baik, pendaftaran tidak dapat dilanjutkan tanpa persetujuan. Kirim /start jika berubah pikiran.",
        REMOVE_KEYBOARD
      );
    } else {
      await sendTelegramMessage(chatId, "Mohon pilih Setuju atau Tidak.", CONSENT_KEYBOARD);
    }
    return;
  }
  const user = await getUser(chatId);
  if (!user) {
    await handleStart(chatId, from);
    return;
  }
  if (step === "declined") {
    await sendTelegramMessage(chatId, "Kirim /start untuk mengulang pendaftaran.", REMOVE_KEYBOARD);
    return;
  }
  if (step === "awaiting_name") {
    const name = text.trim();
    if (!name || name.length > 100) {
      await sendTelegramMessage(chatId, "Nama tidak valid. Tulis nama Anda (maks 100 karakter).");
      return;
    }
    await db.update(users).set({ name, updatedAt: new Date() }).where(eq(users.id, user.id));
    await setState(chatId, "awaiting_age");
    await sendTelegramMessage(chatId, `Halo <b>${escapeHtml(name)}</b>! 👋\n\n📝 <b>Langkah 2 dari 5</b>\nBerapa <b>usia</b> Anda? (0-120)`);
    return;
  }
  if (step === "awaiting_age") {
    const age = parseAge(text);
    if (age === null) {
      await sendTelegramMessage(chatId, "Usia tidak valid. Masukkan angka 0 sampai 120.");
      return;
    }
    await saveProfile(user.id, { age });
    await setState(chatId, "awaiting_gender");
    await sendTelegramMessage(chatId, "📝 <b>Langkah 3 dari 5</b>\nApa <b>jenis kelamin</b> Anda?", GENDER_KEYBOARD);
    return;
  }
  if (step === "awaiting_gender") {
    const gender = parseGender(text);
    if (!gender) {
      await sendTelegramMessage(chatId, "Pilih: Laki-laki, Perempuan, atau Lainnya.", GENDER_KEYBOARD);
      return;
    }
    await saveProfile(user.id, { gender });
    await setState(chatId, "awaiting_medical");
    await sendTelegramMessage(
      chatId,
      "📝 <b>Langkah 4 dari 5</b>\n\n🩺 <b>Riwayat penyakit pernapasan</b>\nKetuk <b>satu atau lebih</b> tombol di bawah, lalu ketuk <b>Selesai</b>.\n\n<i>Pilih Tidak ada jika tidak ada.</i>",
      MEDICAL_KEYBOARD
    );
    return;
  }
  if (step === "awaiting_medical") {
    if (isMedicalNone(text)) {
      await saveProfile(user.id, { medicalHistory: [] });
      await setState(chatId, "awaiting_residence");
      await sendTelegramMessage(chatId, "📝 <b>Langkah 5 dari 5</b>\nDi mana <b>tempat tinggal</b> Anda? (kota / daerah)", REMOVE_KEYBOARD);
      return;
    }
    if (isMedicalDone(text)) {
      const draft = await getMedicalDraft(user.id);
      await saveProfile(user.id, { medicalHistory: draft });
      await setState(chatId, "awaiting_residence");
      const savedLine = draft.length
        ? `✅ <b>Tersimpan:</b>\n${draft.map((d) => `• ${escapeHtml(d)}`).join("\n")}\n\n`
        : "";
      await sendTelegramMessage(
        chatId,
        `${savedLine}📝 <b>Langkah 5 dari 5</b>\nDi mana <b>tempat tinggal</b> Anda? (kota / daerah)`,
        REMOVE_KEYBOARD
      );
      return;
    }
    const option = matchMedicalOption(text);
    if (!option) {
      await sendTelegramMessage(chatId, "Pilih dari tombol yang tersedia, atau ketuk Selesai.", MEDICAL_KEYBOARD);
      return;
    }
    const draft = await getMedicalDraft(user.id);
    if (!draft.includes(option)) {
      const updated = [...draft, option];
      await saveProfile(user.id, { medicalHistory: updated });
      await sendTelegramMessage(
        chatId,
        `✅ <b>${escapeHtml(option)}</b> ditambahkan.\n\n<b>Pilihan Anda:</b>\n${updated.map((d) => `• ${escapeHtml(d)}`).join("\n")}\n\n<i>Bisa pilih lagi atau ketuk Selesai.</i>`,
        MEDICAL_KEYBOARD
      );
    } else {
      await sendTelegramMessage(chatId, `<b>${escapeHtml(option)}</b> sudah dipilih.\n\n<i>Bisa pilih lagi atau ketuk Selesai.</i>`, MEDICAL_KEYBOARD);
    }
    return;
  }
  if (step === "awaiting_residence") {
    const residence = text.trim();
    if (!residence || residence.length > 200) {
      await sendTelegramMessage(chatId, "Tempat tinggal tidak valid. Tulis kota atau daerah Anda.");
      return;
    }
    await saveProfile(user.id, { residence });
    await setState(chatId, "awaiting_location");
    await sendTelegramMessage(chatId, "🏁 <b>Langkah terakhir!</b>\n\nBagikan <b>lokasi pemantauan</b> Anda dengan tombol di bawah.", LOCATION_KEYBOARD);
    return;
  }
  if (step === "awaiting_location") {
    await sendTelegramMessage(chatId, "Silakan bagikan lokasi dengan tombol di bawah.", LOCATION_KEYBOARD);
    return;
  }
  await handleMenu(chatId, text);
}

async function handleMenu(chatId: number, text: string) {
  const user = await getUser(chatId);
  if (text === "Perbarui Lokasi") {
    await setState(chatId, "awaiting_location");
    await sendTelegramMessage(chatId, "Bagikan lokasi terbaru Anda.", LOCATION_KEYBOARD);
    return;
  }
  if (text === "Cek Kualitas Udara") {
    if (user?.latitude == null || user?.longitude == null) {
      await setState(chatId, "awaiting_location");
      await sendTelegramMessage(chatId, "Bagikan lokasi Anda dulu.", LOCATION_KEYBOARD);
      return;
    }
    try {
      await runInitialAqi(chatId, user.latitude, user.longitude);
    } catch (err) {
      console.error("recommendation error:", err instanceof Error ? err.message : "unknown");
      await sendTelegramMessage(chatId, "Rekomendasi belum tersedia saat ini.");
      await showMainMenu(chatId);
    }
    return;
  }
  if (text === "Profil & Statistik") {
    const [profile] = user
      ? await db
          .select()
          .from(userProfiles)
          .where(eq(userProfiles.userId, user.id))
          .limit(1)
      : [];
    const genderLabel = profile?.gender === "male" ? "Laki-laki" : profile?.gender === "female" ? "Perempuan" : profile?.gender === "other" ? "Lainnya" : "-";
    const history = profile?.medicalHistory?.length
      ? profile.medicalHistory.map((h) => `  • ${escapeHtml(h)}`).join("\n")
      : "  -";
    await sendTelegramMessage(
      chatId,
      [
        "👤 <b>Profil Anda</b>",
        "",
        `• Nama: <b>${escapeHtml(user?.name ?? "-")}</b>`,
        `• Usia: <b>${profile?.age ?? "-"}</b> tahun`,
        `• Jenis kelamin: <b>${escapeHtml(genderLabel)}</b>`,
        `• Domisili: <b>${escapeHtml(profile?.residence ?? "-")}</b>`,
        "• Riwayat penyakit:",
        history,
      ].join("\n")
    );
    await showMainMenu(chatId);
    return;
  }
  await showMainMenu(chatId, "Perintah tidak dikenali.");
}

async function handleLocation(chatId: number, loc: TelegramLocation) {
  const step = await getState(chatId);
  if (!validCoords(loc.latitude, loc.longitude)) {
    await sendTelegramMessage(chatId, "Lokasi tidak valid. Silakan bagikan ulang lokasi Anda.", LOCATION_KEYBOARD);
    return;
  }
  const user = await getUser(chatId);
  if (!user) return;
  await db
    .update(users)
    .set({ latitude: loc.latitude, longitude: loc.longitude, updatedAt: new Date() })
    .where(eq(users.id, user.id));
  if (step !== null && step !== "awaiting_location" && step !== "onboarded") {
    await sendTelegramMessage(chatId, "Lengkapi dulu profil Anda sebelum lokasi diproses.");
    return;
  }
  try {
    await runInitialAqi(chatId, loc.latitude as number, loc.longitude as number);
  } catch (err) {
    console.error("recommendation error:", err instanceof Error ? err.message : "unknown");
    await setState(chatId, "onboarded");
    await sendTelegramMessage(chatId, "Lokasi Anda tersimpan. Rekomendasi belum tersedia saat ini.", REMOVE_KEYBOARD);
    await showMainMenu(chatId);
  }
}

export async function processUpdate(update: TelegramUpdate): Promise<void> {
  const message = update?.message;
  const chat = message?.chat;
  if (!message || typeof chat?.id !== "number") return;
  if (chat.type !== "private") return;

  const text = typeof message.text === "string" ? message.text.trim() : "";
  if (message.location) {
    await handleLocation(chat.id, message.location);
  } else if (text) {
    await handleText(chat.id, text, message.from);
  }
}

export async function POST(req: Request) {
  if (!isValidWebhookSecret(req)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return Response.json({ ok: true });
  }
  try {
    await processUpdate(update);
  } catch (err) {
    console.error("telegram webhook error:", err instanceof Error ? err.message : "unknown");
    return Response.json({ ok: false }, { status: 500 });
  }
  return Response.json({ ok: true });
}
