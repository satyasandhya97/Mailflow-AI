import { corsair } from "@/server/integrations/corsair";
import type { OAuthPluginId } from "@/server/services/corsair-tenant.service";

/**
 * Google issues one offline refresh token per user+OAuth client. Corsair stores
 * separate accounts per plugin, so the second connect (e.g. Calendar after Gmail)
 * often gets an access token only. Copy the sibling plugin's refresh token.
 */
export async function backfillGoogleRefreshTokenFromSibling(
  userId: string,
  pluginId: OAuthPluginId,
): Promise<string | null> {
  const sibling: OAuthPluginId =
    pluginId === "googlecalendar" ? "gmail" : "googlecalendar";

  const tenant = corsair.withTenant(userId);
  const siblingKeys =
    sibling === "gmail" ? tenant.gmail.keys : tenant.googlecalendar.keys;
  const targetKeys =
    pluginId === "gmail" ? tenant.gmail.keys : tenant.googlecalendar.keys;

  let siblingToken: string | null = null;
  try {
    siblingToken = await siblingKeys.get_refresh_token();
  } catch {
    return null;
  }

  if (!siblingToken) return null;

  try {
    await targetKeys.set_refresh_token(siblingToken);
    console.info(
      `[oauth] Backfilled ${pluginId} refresh token from ${sibling} for user ${userId}`,
    );
    return siblingToken;
  } catch (error) {
    console.warn(
      `[oauth] Failed to backfill ${pluginId} refresh token for user ${userId}:`,
      error,
    );
    return null;
  }
}

export async function ensureGooglePluginRefreshToken(
  userId: string,
  pluginId: OAuthPluginId,
): Promise<boolean> {
  const tenant = corsair.withTenant(userId);
  const keys =
    pluginId === "gmail" ? tenant.gmail.keys : tenant.googlecalendar.keys;

  try {
    const existing = await keys.get_refresh_token();
    if (existing) return true;
  } catch {
    // Missing or unreadable — try sibling backfill below.
  }

  const backfilled = await backfillGoogleRefreshTokenFromSibling(
    userId,
    pluginId,
  );
  return Boolean(backfilled);
}
