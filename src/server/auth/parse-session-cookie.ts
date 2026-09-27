import { SESSION_COOKIE_NAME } from "@/server/auth/auth.constants";

/** Parse session token from a raw Cookie header (no next/headers). */
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
