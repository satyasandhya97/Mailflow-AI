import { setupCorsair } from "corsair";

import { env } from "@/env";
import { corsair } from "@/server/integrations/corsair";
import { isExpectedDisconnectedError } from "@/server/services/corsair-account-reset.service";
import { backfillGoogleRefreshTokenFromSibling } from "@/server/services/google-oauth-refresh-token.service";

export const OAUTH_PLUGIN_IDS = ["gmail", "googlecalendar"] as const;
export type OAuthPluginId = (typeof OAUTH_PLUGIN_IDS)[number];

export type ConnectionStatus = "connected" | "needs_connection";

const OAUTH_PLUGIN_SET = new Set<string>(OAUTH_PLUGIN_IDS);

function isOAuthPlugin(pluginId: string): pluginId is OAuthPluginId {
  return OAUTH_PLUGIN_SET.has(pluginId);
}

let integrationSetupPromise: Promise<void> | null = null;
const tenantSetupPromises = new Map<string, Promise<void>>();

export function clearUserTenantSetup(userId: string) {
  tenantSetupPromises.delete(userId);
}

async function runSetup(
  instance: Parameters<typeof setupCorsair>[0],
  options?: Parameters<typeof setupCorsair>[1],
) {
  await setupCorsair(instance, options);
}

export async function ensureIntegrationCredentials() {
  integrationSetupPromise ??= runSetup(corsair as Parameters<
    typeof setupCorsair
  >[0], {
    caller: "script",
    credentials: {
      gmail: {
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        ...(env.GMAIL_PUBSUB_TOPIC
          ? { topic_id: env.GMAIL_PUBSUB_TOPIC }
          : {}),
      },
      googlecalendar: {
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
      },
    },
  }).then(() => undefined);

  await integrationSetupPromise;
}

export async function ensureUserTenant(userId: string) {
  await ensureIntegrationCredentials();

  let promise = tenantSetupPromises.get(userId);
  if (!promise) {
    promise = runSetup(
      corsair.withTenant(userId) as unknown as Parameters<
        typeof setupCorsair
      >[0],
      { tenantId: userId },
    ).then(() => undefined);
    tenantSetupPromises.set(userId, promise);
  }

  await promise;
}

export async function getPluginRefreshToken(
  userId: string,
  pluginId: OAuthPluginId,
): Promise<string | null> {
  const tenant = corsair.withTenant(userId);

  if (pluginId === "gmail") {
    return tenant.gmail.keys.get_refresh_token();
  }

  return tenant.googlecalendar.keys.get_refresh_token();
}

/** Reads refresh token, backfilling from the sibling Google plugin when needed. */
export async function getPluginRefreshTokenWithBackfill(
  userId: string,
  pluginId: OAuthPluginId,
): Promise<string | null> {
  try {
    return await readRefreshTokenWithRetry(userId, pluginId);
  } catch (error) {
    if (isExpectedDisconnectedError(error)) {
      return null;
    }
    throw error;
  }
}

const TOKEN_READ_ATTEMPTS = 3;
const TOKEN_READ_RETRY_MS = 300;

/**
 * Reads the refresh token, retrying transient failures (e.g. a slow/cold
 * Supabase pooler) so a flaky DB read does not get mistaken for a real
 * disconnection. Genuinely-disconnected errors are thrown immediately.
 */
async function readRefreshTokenWithRetry(
  userId: string,
  pluginId: OAuthPluginId,
): Promise<string | null> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= TOKEN_READ_ATTEMPTS; attempt++) {
    try {
      const token = await getPluginRefreshToken(userId, pluginId);
      if (token) return token;

      const backfilled = await backfillGoogleRefreshTokenFromSibling(
        userId,
        pluginId,
      );
      if (backfilled) return backfilled;

      return null;
    } catch (error) {
      lastError = error;
      // A missing/corrupt account won't recover by retrying.
      if (isExpectedDisconnectedError(error)) {
        const backfilled = await backfillGoogleRefreshTokenFromSibling(
          userId,
          pluginId,
        );
        if (backfilled) return backfilled;
        throw error;
      }
      if (attempt < TOKEN_READ_ATTEMPTS) {
        await new Promise((resolve) =>
          setTimeout(resolve, TOKEN_READ_RETRY_MS * attempt),
        );
      }
    }
  }

  throw lastError;
}

export async function isPluginConnected(
  userId: string,
  pluginId: string,
): Promise<boolean> {
  if (!isOAuthPlugin(pluginId)) {
    return false;
  }

  try {
    await ensureUserTenant(userId);
    const refreshToken = await readRefreshTokenWithRetry(userId, pluginId);
    return Boolean(refreshToken);
  } catch (error) {
    if (isExpectedDisconnectedError(error)) {
      return false;
    }
    // Transient error (DB timeout, connection drop) — surface it so callers
    // don't mistake a flaky read for a real disconnection.
    console.warn(`[integrations] connection check failed for ${pluginId}:`, error);
    throw error;
  }
}

export async function getPluginConnectionStatus(
  userId: string,
  pluginId: string,
): Promise<ConnectionStatus> {
  return (await isPluginConnected(userId, pluginId))
    ? "connected"
    : "needs_connection";
}

export async function getPluginConnectionStatuses(
  userId: string,
  pluginIds: string[],
): Promise<Record<string, ConnectionStatus>> {
  await ensureUserTenant(userId);

  const statuses: Record<string, ConnectionStatus> = {};

  await Promise.all(
    pluginIds.map(async (pluginId) => {
      if (!isOAuthPlugin(pluginId)) {
        statuses[pluginId] = "needs_connection";
        return;
      }

      try {
        const refreshToken = await readRefreshTokenWithRetry(userId, pluginId);
        statuses[pluginId] = refreshToken ? "connected" : "needs_connection";
      } catch (error) {
        if (isExpectedDisconnectedError(error)) {
          statuses[pluginId] = "needs_connection";
          return;
        }
        // Transient read failure — rethrow so the whole status query errors and
        // the client keeps the last known status (and retries) instead of
        // falsely flipping a connected plugin to "needs connection".
        throw error;
      }
    }),
  );

  return statuses;
}
