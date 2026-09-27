import { eq } from "drizzle-orm";

import { DEFAULT_PLUGIN_WORKSPACE_STATE } from "@/features/plugins/lib/plugin-workspace.defaults";
import {
  SUPPORTED_PLUGIN_IDS,
  type SupportedPluginId,
} from "@/features/plugins/plugin-catalog";
import type { PluginSettings } from "@/features/plugins/types/plugin.types";
import { db } from "@/server/db";
import { userPluginSettings } from "@/server/db/schema";
import {
  ensureUserTenant,
  getPluginRefreshTokenWithBackfill,
} from "@/server/services/corsair-tenant.service";

export type AgentCapabilities = {
  gmail: boolean;
  googlecalendar: boolean;
};

export type PluginSettingsRecord = Record<
  SupportedPluginId,
  PluginSettings & { installed: boolean }
>;

const DEFAULT_SETTINGS: PluginSettings = {
  enabled: true,
  agentAccess: true,
};

function defaultRecord(): PluginSettingsRecord {
  return {
    gmail: { ...DEFAULT_SETTINGS, installed: true },
    googlecalendar: { ...DEFAULT_SETTINGS, installed: true },
  };
}

export async function getUserPluginSettingsRecord(
  userId: string,
): Promise<PluginSettingsRecord> {
  const rows = await db.query.userPluginSettings.findMany({
    where: eq(userPluginSettings.userId, userId),
  });

  if (rows.length === 0) {
    return defaultRecord();
  }

  const record = defaultRecord();
  for (const row of rows) {
    if (!(SUPPORTED_PLUGIN_IDS as readonly string[]).includes(row.pluginId)) {
      continue;
    }

    const pluginId = row.pluginId as SupportedPluginId;
    record[pluginId] = {
      enabled: row.enabled,
      agentAccess: row.agentAccess,
      installed: row.enabled,
    };
  }

  return record;
}

export async function syncUserPluginSettings(
  userId: string,
  input: {
    installedIds: string[];
    settings: Record<string, PluginSettings>;
  },
): Promise<void> {
  const installedIds = input.installedIds.filter((id) =>
    (SUPPORTED_PLUGIN_IDS as readonly string[]).includes(id),
  );

  await ensureUserTenant(userId);

  const now = new Date();

  for (const pluginId of SUPPORTED_PLUGIN_IDS) {
    const installed = installedIds.includes(pluginId);
    const settings = input.settings[pluginId] ?? DEFAULT_SETTINGS;

    // Respect the user's explicit toggles. Agent access is meaningful only for
    // an installed + enabled plugin, so it collapses to false otherwise.
    const enabled = installed && settings.enabled;
    const agentAccess = enabled && settings.agentAccess;

    await db
      .insert(userPluginSettings)
      .values({
        userId,
        pluginId,
        enabled,
        agentAccess,
        automationConfig: {},
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [userPluginSettings.userId, userPluginSettings.pluginId],
        set: {
          enabled,
          agentAccess,
          updatedAt: now,
        },
      });
  }
}

export async function getAgentCapabilities(
  userId: string,
): Promise<AgentCapabilities> {
  try {
    await ensureUserTenant(userId);
  } catch (error) {
    console.warn("[plugins] tenant setup failed for agent capabilities:", error);
    return { gmail: false, googlecalendar: false };
  }

  const [settings, gmailToken, calendarToken] = await Promise.all([
    getUserPluginSettingsRecord(userId),
    getPluginRefreshTokenWithBackfill(userId, "gmail").catch(() => null),
    getPluginRefreshTokenWithBackfill(userId, "googlecalendar").catch(
      () => null,
    ),
  ]);

  return {
    gmail:
      Boolean(gmailToken) &&
      settings.gmail.installed &&
      settings.gmail.enabled &&
      settings.gmail.agentAccess,
    googlecalendar:
      Boolean(calendarToken) &&
      settings.googlecalendar.installed &&
      settings.googlecalendar.enabled &&
      settings.googlecalendar.agentAccess,
  };
}

export function getDefaultInstalledIds(): string[] {
  return [...DEFAULT_PLUGIN_WORKSPACE_STATE.installedIds];
}
