import { NextResponse, type NextRequest } from "next/server";

// Self-contained cookie name to keep middleware edge-compatible without node:crypto
export const ADMIN_COOKIE_NAME = "respivarda_admin_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const isLoginPage = pathname === "/admin/login" || pathname.startsWith("/admin/login/");
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

    // If accessing login while already authenticated, redirect to /admin/feedback
    if (isLoginPage && token) {
      return NextResponse.redirect(new URL("/admin/feedback", request.url));
    }

    // If accessing protected admin routes without token, redirect to /admin/login
    if (!isLoginPage && !token) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
