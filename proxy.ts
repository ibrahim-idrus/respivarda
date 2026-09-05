import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "./lib/auth";

const ADMIN_COOKIE_NAME = "respivarda_admin_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const isLoginPage = pathname === "/admin/login" || pathname.startsWith("/admin/login/");
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const session = verifySessionToken(token);

    if (isLoginPage && session) {
      return NextResponse.redirect(new URL("/admin/feedback", request.url));
    }

    if (!isLoginPage && !session) {
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
