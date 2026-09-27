import { getCatalogPluginMap } from "@/features/plugins/plugin-catalog";
import type { PluginFilterCategory } from "@/features/plugins/constants/plugin-filters";
import type {
  PluginCatalogItem,
  PluginConnectionStatus,
  PluginSettings,
  PluginStats,
  PluginWorkspaceState,
  SidebarPluginNavItem,
} from "@/features/plugins/types/plugin.types";

type FilterOptions = {
  query: string;
  category: PluginFilterCategory;
};

export function filterPlugins(
  plugins: PluginCatalogItem[],
  { query, category }: FilterOptions,
): PluginCatalogItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  return plugins.filter((plugin) => {
    const matchesCategory =
      category === "all" || plugin.category === category;
    const matchesQuery =
      !normalizedQuery ||
      plugin.name.toLowerCase().includes(normalizedQuery) ||
      plugin.description.toLowerCase().includes(normalizedQuery) ||
      plugin.categoryLabel.toLowerCase().includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });
}

export function getInstalledPlugins(
  state: PluginWorkspaceState,
): PluginCatalogItem[] {
  const catalog = getCatalogPluginMap();

  return state.installedIds
    .map((id) => catalog.get(id))
    .filter((plugin): plugin is PluginCatalogItem => plugin != null);
}

export function getConnectionStatus(
  state: PluginWorkspaceState,
  pluginId: string,
): PluginConnectionStatus {
  return state.connections[pluginId] ?? "needs_connection";
}

export function getPluginSettings(
  state: PluginWorkspaceState,
  pluginId: string,
): PluginSettings {
  return (
    state.settings[pluginId] ?? {
      enabled: true,
      agentAccess: true,
    }
  );
}

export function computePluginStats(state: PluginWorkspaceState): PluginStats {
  const installed = state.installedIds.length;
  let connected = 0;
  let needsConnection = 0;
  let agentAccess = 0;

  for (const id of state.installedIds) {
    const status = getConnectionStatus(state, id);
    if (status === "connected") connected += 1;
    if (status === "needs_connection") needsConnection += 1;
    if (getPluginSettings(state, id).agentAccess) agentAccess += 1;
  }

  return { installed, connected, needsConnection, agentAccess };
}

export function getSidebarPluginNavItems(
  state: PluginWorkspaceState,
): SidebarPluginNavItem[] {
  const catalog = getCatalogPluginMap();

  return state.installedIds
    .map((id) => {
      const plugin = catalog.get(id);
      if (!plugin?.nav?.showInSidebar) return null;

      const settings = getPluginSettings(state, id);
      if (!settings.enabled) return null;

      return {
        ...plugin.nav,
        pluginId: plugin.id,
      };
    })
    .filter((item): item is SidebarPluginNavItem => item != null)
    .sort((a, b) => (a.sidebarOrder ?? 0) - (b.sidebarOrder ?? 0));
}

export function addPluginToState(
  state: PluginWorkspaceState,
  pluginId: string,
  options?: { connection?: PluginConnectionStatus },
): PluginWorkspaceState {
  if (state.installedIds.includes(pluginId)) return state;

  return {
    ...state,
    installedIds: [...state.installedIds, pluginId],
    connections: {
      ...state.connections,
      [pluginId]: options?.connection ?? "needs_connection",
    },
    settings: {
      ...state.settings,
      [pluginId]: state.settings[pluginId] ?? {
        enabled: true,
        agentAccess: true,
      },
    },
  };
}

export function removePluginFromState(
  state: PluginWorkspaceState,
  pluginId: string,
): PluginWorkspaceState {
  const { [pluginId]: _connection, ...connections } = state.connections;
  const { [pluginId]: _settings, ...settings } = state.settings;

  return {
    installedIds: state.installedIds.filter((id) => id !== pluginId),
    connections,
    settings,
  };
}

export function updatePluginSettingsInState(
  state: PluginWorkspaceState,
  pluginId: string,
  patch: Partial<PluginSettings>,
): PluginWorkspaceState {
  const current = getPluginSettings(state, pluginId);

  return {
    ...state,
    settings: {
      ...state.settings,
      [pluginId]: { ...current, ...patch },
    },
  };
}

export function connectPluginInState(
  state: PluginWorkspaceState,
  pluginId: string,
): PluginWorkspaceState {
  return {
    ...state,
    connections: {
      ...state.connections,
      [pluginId]: "connected",
    },
  };
}

export function applyServerConnectionStatuses(
  state: PluginWorkspaceState,
  statuses: Record<string, PluginConnectionStatus>,
): PluginWorkspaceState {
  const connections: Record<string, PluginConnectionStatus> = {};

  for (const pluginId of state.installedIds) {
    connections[pluginId] = statuses[pluginId] ?? "needs_connection";
  }

  return {
    ...state,
    connections,
  };
}

export function patchPluginConnectionStatus(
  state: PluginWorkspaceState,
  pluginId: string,
  status: PluginConnectionStatus,
): PluginWorkspaceState {
  if (!state.installedIds.includes(pluginId)) {
    return state;
  }

  return {
    ...state,
    connections: {
      ...state.connections,
      [pluginId]: status,
    },
  };
}

export function buildDefaultConnections(
  installedIds: string[],
): Record<string, PluginConnectionStatus> {
  return Object.fromEntries(
    installedIds.map((id) => [id, "needs_connection" as const]),
  );
}
