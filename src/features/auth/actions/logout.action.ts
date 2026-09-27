"use server";

import { getSessionTokenFromCookies } from "@/server/auth/session-cookie";
import { clearSessionCookie } from "@/server/auth/session-cookie";
import * as authService from "@/server/services/auth.service";

export async function logoutAction() {
  const token = await getSessionTokenFromCookies();
  await authService.logout(token);
  await clearSessionCookie();
  return { success: true as const };
}
