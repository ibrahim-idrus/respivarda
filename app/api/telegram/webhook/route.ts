import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { conversationStates, userProfiles, users } from "@/src/db/schema";
import {
  isValidWebhookSecret,
  sendTelegramMessage,
} from "@/lib/telegram";
import { evaluateRuleEngine, fetchNearestCity } from "@/lib/airvisual";
import { generateAlertInsightRecommendation } from "@/lib/ai/recommendation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WELCOME = [
  "Respivarda Telegram Terhubung ✅",
  "",
  "Akun Telegram Anda kini terhubung ke Respivarda.",
  "Untuk rekomendasi kualitas udara yang akurat, bagikan lokasi Anda.",
].join("\n");

const LOCATION_KEYBOARD = {
  keyboard: [[{ text: "📍 Bagikan Lokasi Saya", request_location: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
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

// ponytail: conversation_states.step is free-text — ceiling: no enum, so a typo
// is a silent new state. upgrade: pgEnum of known steps when onboarding grows.
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

// Multi-user upsert keyed on telegram_chat_id (replaces single-user overwrite).
async function upsertUser(chatId: number, from?: TelegramFrom) {
  const name = fullName(from) || "Respivarda User";
  const values = {
    name,
    telegramChatId: String(chatId),
    telegramUsername: from?.username ?? null,
    locale: from?.language_code ?? "id",
    updatedAt: new Date(),
  };
  await db
    .insert(users)
    .values(values)
    .onConflictDoUpdate({
      target: users.telegramChatId,
      set: values,
    });
}

// Fetch air quality for coords, run existing rule engine + AI, return the
// message to send. AI self-falls-back to a rule-based message when Gemini is
// absent, so no dummy data is ever generated.
async function recommendationFor(lat: number, lon: number, chatId: number) {
  const result = await fetchNearestCity({ lat, lon });
  if (result.kind !== "success") {
    return "Lokasi diterima, tetapi data kualitas udara saat ini belum tersedia. Coba lagi nanti.";
  }
  const current = result.data;
  const rule = evaluateRuleEngine({ current });

  // ponytail: healthLog omitted — ceiling: recommendation is less personalized.
  // upgrade: pull latest health_logs row alongside profile.
  const [profile] = await db
    .select({
      age: userProfiles.age,
      gender: userProfiles.gender,
      medicalHistory: userProfiles.medicalHistory,
    })
    .from(userProfiles)
    .innerJoin(users, eq(users.id, userProfiles.userId))
    .where(eq(users.telegramChatId, String(chatId)))
    .limit(1);

  const { recommendation, insight } = await generateAlertInsightRecommendation({
    current,
    rule,
    profile: profile ?? null,
  });
  const body = recommendation ?? insight;
  const header = `${current.city}: AQI ${current.usAqi} (${rule.category}), polutan utama ${current.mainPollutant}.`;
  return body ? `${header}\n\n${body}` : header;
}

async function handleStart(chatId: number, from?: TelegramFrom) {
  await upsertUser(chatId, from);
  await setState(chatId, "awaiting_location");
  await sendTelegramMessage(chatId, WELCOME, LOCATION_KEYBOARD);
}

async function handleLocation(chatId: number, loc: TelegramLocation) {
  if (!validCoords(loc.latitude, loc.longitude)) {
    await sendTelegramMessage(
      chatId,
      "Lokasi tidak valid. Silakan bagikan ulang lokasi Anda.",
      LOCATION_KEYBOARD
    );
    return;
  }
  await db
    .update(users)
    .set({
      latitude: loc.latitude,
      longitude: loc.longitude,
      updatedAt: new Date(),
    })
    .where(eq(users.telegramChatId, String(chatId)));
  await setState(chatId, "onboarded");
  try {
    const msg = await recommendationFor(loc.latitude!, loc.longitude!, chatId);
    await sendTelegramMessage(chatId, msg, REMOVE_KEYBOARD);
  } catch (err) {
    console.error(
      "recommendation error:",
      err instanceof Error ? err.message : "unknown"
    );
    await sendTelegramMessage(
      chatId,
      "Lokasi Anda tersimpan. Rekomendasi belum tersedia saat ini.",
      REMOVE_KEYBOARD
    );
  }
}

// Shared by the webhook POST and the local polling dev script
// (scripts/telegram-poll.ts) so both paths run identical logic.
export async function processUpdate(update: TelegramUpdate): Promise<void> {
  const message = update?.message;
  const chat = message?.chat;
  if (!message || typeof chat?.id !== "number") return; // missing message/chat — no-op
  // Only process personal data (incl. location) in private chats.
  if (chat.type !== "private") return;

  const text = typeof message.text === "string" ? message.text.trim() : "";
  if (text.startsWith("/start")) {
    await handleStart(chat.id, message.from);
  } else if (message.location) {
    await handleLocation(chat.id, message.location);
  }
  // other text: nothing to do yet (alerts are outbound-only)
}

export async function POST(req: Request) {
  if (!isValidWebhookSecret(req)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return Response.json({ ok: true }); // ignore non-JSON
  }

  try {
    await processUpdate(update);
  } catch (err) {
    // Never log the token; db/telegram errors are safe to surface as 500.
    console.error(
      "telegram webhook error:",
      err instanceof Error ? err.message : "unknown"
    );
    return Response.json({ ok: false }, { status: 500 });
  }

  return Response.json({ ok: true });
}
