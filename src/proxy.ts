import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const USER_ROUTES = [
  "/dashboard",
  "/health",
  "/risk-map",
  "/risks",
  "/alerts",
  "/report",
  "/hospitals",
  "/shelters",
  "/emergency",
  "/carbon",
  "/profile",
  "/climategpt",
];
const GOVERNMENT_ROUTES = ["/government"];
const ADMIN_ROUTES = ["/admin"];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;
  const isAuthenticated = Boolean(req.auth?.user);

  const requiresAuth = matchesPrefix(pathname, [...USER_ROUTES, ...GOVERNMENT_ROUTES, ...ADMIN_ROUTES]);
  const requiresGovernment = matchesPrefix(pathname, GOVERNMENT_ROUTES);
  const requiresAdmin = matchesPrefix(pathname, ADMIN_ROUTES);

  if (requiresAuth && !isAuthenticated) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (requiresAdmin && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  if (requiresGovernment && !(role === "GOVERNMENT" || role === "ADMIN")) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  if ((pathname === "/login" || pathname === "/register") && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
