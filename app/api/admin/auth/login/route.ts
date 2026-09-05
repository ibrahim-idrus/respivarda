import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createSessionToken,
  isLoginRateLimited,
  SESSION_MAX_AGE,
  validateAdminCredentials,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    if (isLoginRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: "Terlalu banyak percobaan. Coba lagi dalam 10 menit." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password, remember } = body ?? {};

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Email dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    let isValid = false;
    try {
      isValid = validateAdminCredentials(email, password);
    } catch {
      return NextResponse.json(
        { success: false, error: "Layanan autentikasi belum dikonfigurasi." },
        { status: 500 }
      );
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Email atau kata sandi tidak valid." },
        { status: 401 }
      );
    }

    const token = createSessionToken(email);
    const maxAge = remember ? SESSION_MAX_AGE : undefined;

    const response = NextResponse.json({
      success: true,
      message: "Berhasil masuk.",
      redirect: "/admin/feedback",
      user: {
        email: email.toLowerCase().trim(),
        role: "admin",
      },
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      ...(maxAge ? { maxAge } : {}),
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
