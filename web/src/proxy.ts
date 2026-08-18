import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Next.js 16 renamed the middleware.ts convention to proxy.ts, and the
// proxy runtime is always nodejs (not configurable) — which is what lets
// this import @/auth (Prisma + bcryptjs) directly, unlike the old edge
// default for middleware.ts.
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname.startsWith("/login");

  if (!isLoggedIn && !isLoginPage) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/overview", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
