import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME, SESSION_DURATION_DAYS } from "@/server/auth/auth.constants";
import { env } from "@/env";
import { addDays } from "@/server/auth/auth.crypto";

export async function getSessionTokenFromCookies() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: addDays(new Date(), SESSION_DURATION_DAYS),
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function getSessionTokenFromHeader(cookieHeader: string | null) {
  if (!cookieHeader) return null;

  const cookiesList = cookieHeader.split(";").map((part) => part.trim());

  for (const item of cookiesList) {
    const [name, ...rest] = item.split("=");
    if (name === SESSION_COOKIE_NAME) {
      return rest.join("=");
    }
  }

  return null;
}
