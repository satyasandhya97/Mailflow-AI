import type { PluginWorkspaceState } from "@/features/plugins/types/plugin.types";

export const DEFAULT_INSTALLED_PLUGIN_IDS = ["gmail", "googlecalendar"] as const;

export const DEFAULT_PLUGIN_WORKSPACE_STATE: PluginWorkspaceState = {
  installedIds: [...DEFAULT_INSTALLED_PLUGIN_IDS],
  connections: {
    gmail: "needs_connection",
    googlecalendar: "needs_connection",
  },
  settings: {
    gmail: { enabled: true, agentAccess: true },
    googlecalendar: { enabled: true, agentAccess: true },
  },
};
