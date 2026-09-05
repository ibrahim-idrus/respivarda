import { desc, eq } from "drizzle-orm";
import { db } from "@/src/db";
import { conversationStates, healthLogs, userProfiles, users } from "@/src/db/schema";
import { isValidWebhookSecret, sendTelegramMessage } from "@/lib/telegram";
import { evaluateRuleEngine, fetchNearestCity } from "@/lib/airvisual";
import { generateAlertInsightRecommendation } from "@/lib/ai/recommendation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INTRO = [
  "Halo, saya Respivarda.",
  "Saya memantau kualitas udara di lokasi Anda, memberi rekomendasi dan wawasan kesehatan, serta mengirim peringatan proaktif saat udara memburuk.",
  "Data yang saya simpan: nama, usia, jenis kelamin, riwayat kesehatan, domisili, dan lokasi pemantauan.",
  "Apakah Anda setuju melanjutkan pendaftaran?",
].join("\n\n");

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
const MAIN_MENU = {
  keyboard: [
    [{ text: "Cek Kualitas Udara" }, { text: "Aktivitas Fisik" }],
    [{ text: "Durasi Tidur" }, { text: "Gejala" }],
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

function parseMedical(text: string): string[] {
  const t = text.trim();
  if (/^tidak ada$/i.test(t) || t === "-" || t === "") return [];
  return t
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function isYes(text: string): boolean {
  return ["setuju", "ya", "yes", "ok"].includes(text.trim().toLowerCase());
}

function isNo(text: string): boolean {
  return ["tidak", "no", "batal"].includes(text.trim().toLowerCase());
}

async function showMainMenu(chatId: number, intro?: string) {
  const body = intro ? `${intro}\n\nSilakan pilih menu:` : "Silakan pilih menu:";
  await sendTelegramMessage(chatId, body, MAIN_MENU);
}

async function runInitialAqi(chatId: number, lat: number, lon: number) {
  const result = await fetchNearestCity({ lat, lon });
  if (result.kind !== "success") {
    await setState(chatId, "onboarded");
    await sendTelegramMessage(
      chatId,
      "Pendaftaran tersimpan. Data kualitas udara belum tersedia saat ini, coba menu Cek Kualitas Udara nanti."
    );
    await showMainMenu(chatId);
    return;
  }
  const current = result.data;
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
  const header = `${current.city}: AQI ${current.usAqi} (${rule.category}), polutan utama ${current.mainPollutant}.`;
  const prefix =
    rule.alertDecision === "trigger" && rule.severity >= 2
      ? `Peringatan kualitas udara.\n${header}`
      : header;
  await sendTelegramMessage(chatId, prefix, REMOVE_KEYBOARD);
  if (recommendation ?? insight) {
    await sendTelegramMessage(chatId, (recommendation ?? insight) as string);
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
      await sendTelegramMessage(chatId, "Terima kasih. Siapa nama Anda?", REMOVE_KEYBOARD);
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
    await sendTelegramMessage(chatId, "Berapa usia Anda? (0-120)");
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
    await sendTelegramMessage(chatId, "Apa jenis kelamin Anda?", GENDER_KEYBOARD);
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
      "Apakah ada riwayat penyakit? (contoh: Tidak ada, Asma, Alergi, Penyakit jantung / paru, Diabetes / Hipertensi)",
      REMOVE_KEYBOARD
    );
    return;
  }
  if (step === "awaiting_medical") {
    await saveProfile(user.id, { medicalHistory: parseMedical(text) });
    await setState(chatId, "awaiting_residence");
    await sendTelegramMessage(chatId, "Di mana tempat tinggal Anda? (kota / daerah)");
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
    await sendTelegramMessage(chatId, "Terakhir, bagikan lokasi pemantauan Anda.", LOCATION_KEYBOARD);
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
    await sendTelegramMessage(
      chatId,
      [
        `Nama: ${user?.name ?? "-"}`,
        `Usia: ${profile?.age ?? "-"}`,
        `Jenis kelamin: ${profile?.gender ?? "-"}`,
        `Domisili: ${profile?.residence ?? "-"}`,
        `Riwayat: ${profile?.medicalHistory?.join(", ") || "-"}`,
      ].join("\n")
    );
    await showMainMenu(chatId);
    return;
  }
  if (["Aktivitas Fisik", "Durasi Tidur", "Gejala"].includes(text)) {
    await sendTelegramMessage(chatId, "Pencatatan kesehatan lewat Telegram segera hadir. Untuk sekarang datanya dibaca dari aplikasi web bila ada.");
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
