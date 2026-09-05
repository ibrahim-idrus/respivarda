import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createSessionToken,
  SESSION_MAX_AGE,
  validateAdminCredentials,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, remember } = body ?? {};

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Email dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const isValid = validateAdminCredentials(email, password);

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
  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
