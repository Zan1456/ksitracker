import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";
import { ADMIN_USER_VIEW_COOKIE } from "@/lib/admin-user-view-cookie";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password"];
const PUBLIC_PREFIXES = ["/reset-password/"];

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "admin";
  const path = nextUrl.pathname;
  // Set when an admin taps "Megnyitás tagként" to preview the member app —
  // suspends the usual admin↔member routing redirects below until they exit.
  const inUserView = req.cookies.get(ADMIN_USER_VIEW_COOKIE)?.value === "1";

  const isPublic = PUBLIC_PATHS.some((p) => path === p) || PUBLIC_PREFIXES.some((p) => path.startsWith(p));
  const isAdminRoute = path.startsWith("/admin");

  if (isPublic) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(isAdmin ? "/admin" : "/", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("from", path);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (!isAdminRoute && isAdmin && path === "/" && !inUserView) {
    return NextResponse.redirect(new URL("/admin", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
