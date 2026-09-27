import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/server/auth/auth.constants";
import {
  GMAIL_INBOX_DEFAULT,
  isLegacyInboxCategoryPath,
  isLegacyLabelPath,
} from "@/features/gmail/lib/gmail-routes";

const AUTH_ROUTES = ["/login", "/signup", "/verify-otp"];

const APP_ROUTES = [
  "/dashboard",
  "/gmail",
  "/inbox",
  "/calendar",
  "/plugins",
  "/tasks",
  "/agent",
  "/settings",
];

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function legacyGmailRedirect(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (isLegacyInboxCategoryPath(pathname) || isLegacyLabelPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = GMAIL_INBOX_DEFAULT;
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname === "/inbox" || pathname.startsWith("/inbox/")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = GMAIL_INBOX_DEFAULT;
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname !== "/gmail") {
    return null;
  }

  const tab = searchParams.get("tab");
  const category = searchParams.get("category");
  const message = searchParams.get("message");
  const compose = searchParams.get("compose");
  const q = searchParams.get("q");

  if (!tab && !category && !message && !compose && !q) {
    return null;
  }

  const redirectUrl = request.nextUrl.clone();

  if (message) {
    redirectUrl.pathname = `/gmail/message/${message}`;
  } else if (tab === "inbox") {
    redirectUrl.pathname = GMAIL_INBOX_DEFAULT;
  } else if (tab) {
    redirectUrl.pathname = `/gmail/${tab}`;
  } else {
    redirectUrl.pathname = GMAIL_INBOX_DEFAULT;
  }

  redirectUrl.searchParams.delete("tab");
  redirectUrl.searchParams.delete("category");
  redirectUrl.searchParams.delete("message");

  return NextResponse.redirect(redirectUrl);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const isAuthRoute = matchesRoute(pathname, AUTH_ROUTES);
  const isAppRoute = matchesRoute(pathname, APP_ROUTES);

  const gmailRedirect = legacyGmailRedirect(request);
  if (gmailRedirect) {
    return gmailRedirect;
  }

  if (isAppRoute && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && hasSession) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
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
