export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { count, desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { requireAdmin } from "@/lib/auth";
import { feedback, feedbackCategoryEnum, feedbackStatusEnum } from "@/src/db/schema";

const VALID_STATUS = new Set<string>([
  ...feedbackStatusEnum.enumValues,
  "all",
]);


export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  if (
    typeof b.category !== "string" ||
    !(feedbackCategoryEnum.enumValues as readonly string[]).includes(b.category)
  ) {
    return NextResponse.json({ error: "Kategori tidak valid" }, { status: 400 });
  }
  if (typeof b.description !== "string" || !b.description.trim()) {
    return NextResponse.json({ error: "Deskripsi wajib diisi" }, { status: 400 });
  }
  if (typeof b.captchaToken !== "string" || !b.captchaToken) {
    return NextResponse.json({ error: "Verifikasi CAPTCHA gagal" }, { status: 400 });
  }
  const secret = process.env.CAPTCHA_SECRET_KEY_URL;
  if (!secret) {
    return NextResponse.json({ error: "CAPTCHA belum dikonfigurasi" }, { status: 500 });
  }
  const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: b.captchaToken }),
  });
  const verify = (await verifyRes.json()) as { success: boolean; score?: number };
  if (!verify.success || (verify.score != null && verify.score < 0.5)) {
    return NextResponse.json({ error: "Verifikasi CAPTCHA gagal" }, { status: 400 });
  }
  if (b.coordinates != null) {
    const c = b.coordinates as Record<string, unknown>;
    if (typeof c.lat !== "number" || typeof c.long !== "number") {
      return NextResponse.json(
        { error: "Koordinat tidak valid" },
        { status: 400 },
      );
    }
  }
  if (
    b.affectedDevices != null &&
    !(
      Array.isArray(b.affectedDevices) &&
      b.affectedDevices.every((d) => typeof d === "string")
    )
  ) {
    return NextResponse.json(
      { error: "Perangkat terdampak tidak valid" },
      { status: 400 },
    );
  }


  const year = new Date().getFullYear();
  const [{ value: n }] = await db
    .select({ value: count() })
    .from(feedback)
    .where(eq(sql`extract(year from ${feedback.createdAt})`, year));
  const reportRef = `FB-${year}-${String(n + 1).padStart(4, "0")}`;

  const [created] = await db
    .insert(feedback)
    .values({
      reportRef,
      category: b.category as (typeof feedbackCategoryEnum.enumValues)[number],
      description: (b.description as string).trim(),
      contactName:
        typeof b.contactName === "string" && b.contactName.trim()
          ? b.contactName.trim()
          : null,
      contactWhatsApp:
        typeof b.contactWhatsApp === "string" && b.contactWhatsApp.trim()
          ? b.contactWhatsApp.trim()
          : null,
      contactTelegram:
        typeof b.contactTelegram === "string" && b.contactTelegram.trim()
          ? b.contactTelegram.trim()
          : null,
      locationText:
        typeof b.locationText === "string" && b.locationText.trim()
          ? b.locationText.trim()
          : null,
      coordinates:
        (b.coordinates as { lat: number; long: number } | undefined) ?? null,
      affectedDevices: (b.affectedDevices as string[] | undefined) ?? [],
    })
    .returning({ id: feedback.id, reportRef: feedback.reportRef });

  return NextResponse.json(created, { status: 201 });
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }
  const sp = req.nextUrl.searchParams;
  const statusParam = sp.get("status") ?? "all";
  if (!VALID_STATUS.has(statusParam)) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const where =
    statusParam === "all" ? undefined : eq(feedback.status, statusParam as (typeof feedbackStatusEnum.enumValues)[number]);

  const [rows, counts] = await Promise.all([
    db
      .select()
      .from(feedback)
      .where(where)
      .orderBy(desc(feedback.createdAt))
      .limit(100), 
    db
      .select({ status: feedback.status, value: count() })
      .from(feedback)
      .groupBy(feedback.status),
  ]);

  const byStatus: Record<string, number> = { all: 0 };
  for (const s of feedbackStatusEnum.enumValues) byStatus[s] = 0;
  for (const c of counts) {
    byStatus[c.status] = c.value;
    byStatus.all += c.value;
  }

  return NextResponse.json({ data: rows, counts: byStatus });
}
