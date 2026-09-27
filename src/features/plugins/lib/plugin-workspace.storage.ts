import { z } from "zod";

import { DEFAULT_PLUGIN_WORKSPACE_STATE } from "@/features/plugins/lib/plugin-workspace.defaults";
import { buildDefaultConnections } from "@/features/plugins/lib/plugin-workspace.service";
import { isSupportedPluginId } from "@/features/plugins/plugin-catalog";
import type { PluginWorkspaceState } from "@/features/plugins/types/plugin.types";

const STORAGE_KEY = "corsair:plugin-workspace";
const STORAGE_VERSION = 3;

const pluginSettingsSchema = z.object({
  enabled: z.boolean(),
  agentAccess: z.boolean(),
});

const persistedPluginWorkspaceStateSchema = z.object({
  version: z.number().optional(),
  installedIds: z.array(z.string()),
  settings: z.record(z.string(), pluginSettingsSchema),
});

type PersistedPluginWorkspaceState = z.infer<
  typeof persistedPluginWorkspaceStateSchema
>;

function sanitizeInstalledIds(installedIds: string[]): string[] {
  const supported = installedIds.filter(isSupportedPluginId);
  if (supported.length > 0) return supported;
  return [...DEFAULT_PLUGIN_WORKSPACE_STATE.installedIds];
}

function sanitizeSettings(
  settings: PersistedPluginWorkspaceState["settings"],
  installedIds: string[],
): PluginWorkspaceState["settings"] {
  const next: PluginWorkspaceState["settings"] = {};
  for (const pluginId of installedIds) {
    next[pluginId] = settings[pluginId] ?? {
      enabled: true,
      agentAccess: true,
    };
  }
  return next;
}

function toWorkspaceState(
  persisted: PersistedPluginWorkspaceState,
): PluginWorkspaceState {
  const installedIds = sanitizeInstalledIds(persisted.installedIds);
  return {
    installedIds,
    settings: sanitizeSettings(persisted.settings, installedIds),
    connections: buildDefaultConnections(installedIds),
  };
}

export function loadPluginWorkspaceState(): PluginWorkspaceState {
  if (typeof window === "undefined") {
    return DEFAULT_PLUGIN_WORKSPACE_STATE;
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PLUGIN_WORKSPACE_STATE;

    const parsed = persistedPluginWorkspaceStateSchema.safeParse(
      JSON.parse(raw),
    );
    if (!parsed.success) {
      sessionStorage.removeItem(STORAGE_KEY);
      return DEFAULT_PLUGIN_WORKSPACE_STATE;
    }

    if (parsed.data.version !== STORAGE_VERSION) {
      sessionStorage.removeItem(STORAGE_KEY);
      return toWorkspaceState({
        ...parsed.data,
        version: STORAGE_VERSION,
      });
    }

    return toWorkspaceState(parsed.data);
  } catch {
    return DEFAULT_PLUGIN_WORKSPACE_STATE;
  }
}

export function savePluginWorkspaceState(state: PluginWorkspaceState) {
  if (typeof window === "undefined") return;

  const persisted: PersistedPluginWorkspaceState = {
    version: STORAGE_VERSION,
    installedIds: state.installedIds,
    settings: state.settings,
  };

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
}

export function resetPluginWorkspaceState(): PluginWorkspaceState {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  return DEFAULT_PLUGIN_WORKSPACE_STATE;
}
