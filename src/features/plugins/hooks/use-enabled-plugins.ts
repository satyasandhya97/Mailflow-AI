"use client";

import { usePluginWorkspace } from "@/features/plugins/context/plugin-workspace-provider";

/**
 * Sidebar-facing hook — reads installed + enabled plugins from workspace state.
 */
export function useEnabledPlugins() {
  const { sidebarItems, showLabels, isHydrated } = usePluginWorkspace();

  return {
    sidebarItems,
    showLabels,
    isHydrated,
  };
}
