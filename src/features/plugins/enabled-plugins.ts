/**
 * Default installed plugins for this workspace.
 * Runtime state lives in PluginWorkspaceProvider (sessionStorage).
 */
export const DEFAULT_INSTALLED_PLUGIN_IDS = ["gmail", "googlecalendar"] as const;

export type EnabledPluginId = (typeof DEFAULT_INSTALLED_PLUGIN_IDS)[number];

/** @deprecated Use PluginWorkspaceProvider state instead */
export const ENABLED_PLUGIN_IDS = DEFAULT_INSTALLED_PLUGIN_IDS;
