import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/server/auth/auth.constants";

const AUTH_ROUTES = ["/login", "/signup", "/verify-otp"];

const APP_ROUTES = ["/agent", "/plugins", "/settings"];

const LEGACY_ROUTES = [
  "/dashboard",
  "/gmail",
  "/inbox",
  "/calendar",
  "/tasks",
];

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const isAuthRoute = matchesRoute(pathname, AUTH_ROUTES);
  const isAppRoute = matchesRoute(pathname, APP_ROUTES);
  const isLegacyRoute = matchesRoute(pathname, LEGACY_ROUTES);

  // Redirect legacy removed routes to /agent
  if (isLegacyRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/agent";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (isAppRoute && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && hasSession) {
    const agentUrl = request.nextUrl.clone();
    agentUrl.pathname = "/agent";
    agentUrl.search = "";
    return NextResponse.redirect(agentUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/gmail/:path*",
    "/inbox/:path*",
    "/calendar/:path*",
    "/plugins/:path*",
    "/tasks/:path*",
    "/agent/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
    "/verify-otp",
  ],
};
