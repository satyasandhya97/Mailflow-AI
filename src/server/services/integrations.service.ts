import { generateOAuthUrl, processOAuthCallback } from "corsair/oauth";

import { env } from "@/env";
import { corsair } from "@/server/integrations/corsair";
import { SUPPORTED_PLUGIN_IDS } from "@/features/plugins/plugin-catalog";
import {
  healCorruptPluginAccountIfNeeded,
  parseOAuthStatePayload,
  withPluginAccountLock,
} from "@/server/services/corsair-account-reset.service";
import {
  clearUserTenantSetup,
  ensureUserTenant,
  OAUTH_PLUGIN_IDS,
  type OAuthPluginId,
} from "@/server/services/corsair-tenant.service";
import { ensureGooglePluginRefreshToken } from "@/server/services/google-oauth-refresh-token.service";
import { syncGoogleCalendarEvents } from "@/server/services/calendar-sync.service";
import { registerCalendarWatchForUser } from "@/server/services/calendar-watch.service";
import { syncGmailInbox } from "@/server/services/gmail-sync.service";
import { registerGmailWatchForUser } from "@/server/services/gmail-watch.service";
import {
  getUserPluginSettingsRecord,
  syncUserPluginSettings,
} from "@/server/services/plugin-settings.service";

export {
  ensureIntegrationCredentials,
  ensureUserTenant,
  getPluginConnectionStatus,
  getPluginConnectionStatuses,
  isPluginConnected,
  OAUTH_PLUGIN_IDS,
  type OAuthPluginId,
} from "@/server/services/corsair-tenant.service";

const OAUTH_PLUGIN_SET = new Set<string>(OAUTH_PLUGIN_IDS);

function isOAuthPlugin(pluginId: string): pluginId is OAuthPluginId {
  return OAUTH_PLUGIN_SET.has(pluginId);
}

async function prepareOAuthTenant(userId: string, pluginId: OAuthPluginId) {
  await ensureUserTenant(userId);

  const healed = await healCorruptPluginAccountIfNeeded(userId, pluginId);
  if (healed) {
    clearUserTenantSetup(userId);
    await ensureUserTenant(userId);
  }
}

async function runOAuthCallback(code: string, state: string) {
  return processOAuthCallback(corsair, {
    code,
    state,
    redirectUri: env.OAUTH_REDIRECT_URI,
  });
}

export async function startOAuth(userId: string, pluginId: string) {
  if (!isOAuthPlugin(pluginId)) {
    throw new Error(`Plugin "${pluginId}" does not support OAuth yet.`);
  }

  await prepareOAuthTenant(userId, pluginId);

  const { url } = await generateOAuthUrl(corsair, pluginId, {
    tenantId: userId,
    redirectUri: env.OAUTH_REDIRECT_URI,
  });

  return { url };
}

export async function handleOAuthCallback(code: string, state: string) {
  const statePayload = parseOAuthStatePayload(state);

  let result;

  if (
    statePayload.tenantId &&
    statePayload.plugin &&
    isOAuthPlugin(statePayload.plugin)
  ) {
    const { tenantId, plugin } = statePayload;

    await prepareOAuthTenant(tenantId, plugin);

    result = await withPluginAccountLock(tenantId, plugin, () =>
      runOAuthCallback(code, state),
    );
  } else {
    result = await runOAuthCallback(code, state);
  }

  if (!isOAuthPlugin(result.plugin)) {
    throw new Error(`Unexpected OAuth plugin: ${result.plugin}`);
  }

  const hasRefreshToken = await ensureGooglePluginRefreshToken(
    result.tenantId,
    result.plugin,
  );

  if (!hasRefreshToken) {
    throw new Error(
      `Google did not persist a refresh token for ${result.plugin}. Revoke Corsair in your Google Account (Security → Third-party access), then connect again.`,
    );
  }

  const tenant = corsair.withTenant(result.tenantId);

  try {
    const existingSettings = await getUserPluginSettingsRecord(result.tenantId);
    const installedIds = SUPPORTED_PLUGIN_IDS.filter(
      (pluginId) =>
        existingSettings[pluginId].installed || pluginId === result.plugin,
    );

    await syncUserPluginSettings(result.tenantId, {
      installedIds: [...installedIds],
      settings: {
        gmail: { enabled: true, agentAccess: true },
        googlecalendar: { enabled: true, agentAccess: true },
      },
    });
  } catch (error) {
    console.warn("[oauth] plugin settings sync failed:", error);
  }

  if (result.plugin === "gmail") {
    try {
      await syncGmailInbox(result.tenantId);
    } catch (error) {
      console.warn("[oauth] Gmail initial sync failed:", error);
    }

    void registerGmailWatchForUser(result.tenantId).catch((error) => {
      console.warn("[oauth] Gmail watch registration failed:", error);
    });
  }

  if (result.plugin === "googlecalendar") {
    try {
      const now = new Date();
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() + 7);
      await tenant.googlecalendar.api.events.getMany({
        timeMin: now.toISOString(),
        timeMax: weekEnd.toISOString(),
        maxResults: 25,
      });
    } catch (error) {
      console.warn("[oauth] Calendar initial sync failed:", error);
    }

    try {
      await syncGoogleCalendarEvents(result.tenantId);
    } catch (error) {
      console.warn("[oauth] Calendar full sync failed:", error);
    }

    void registerCalendarWatchForUser(result.tenantId).catch((error) => {
      console.warn("[oauth] Calendar watch registration failed:", error);
    });
  }

  return result;
}
