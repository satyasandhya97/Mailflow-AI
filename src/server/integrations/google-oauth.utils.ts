import { env } from "@/env";
import { getTenantForUser } from "@/server/integrations/tenant";

export function isPublicAppUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return (
      hostname !== "localhost" &&
      hostname !== "127.0.0.1" &&
      !hostname.endsWith(".local")
    );
  } catch {
    return false;
  }
}

export async function refreshGoogleAccessTokenForUser(
  userId: string,
  pluginId: "gmail" | "googlecalendar",
): Promise<string | null> {
  const tenant = getTenantForUser(userId);
  const keys =
    pluginId === "gmail" ? tenant.gmail.keys : tenant.googlecalendar.keys;

  const refreshToken = await keys.get_refresh_token();

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !refreshToken) {
    return null;
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!tokenRes.ok) {
    console.warn(
      `[google/oauth] Token refresh failed for ${pluginId}:`,
      await tokenRes.text(),
    );
    return null;
  }

  const { access_token } = (await tokenRes.json()) as { access_token: string };
  return access_token;
}
