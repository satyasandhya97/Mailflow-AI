export {
  getCatalogPlugin,
  getCatalogPluginMap,
  getPluginById,
  PLUGIN_CATALOG,
  PLUGIN_REGISTRY,
} from "@/features/plugins/plugin-catalog";

export {
  computePluginStats,
  filterPlugins,
  getConnectionStatus,
  getInstalledPlugins,
  getPluginSettings,
  getSidebarPluginNavItems,
} from "@/features/plugins/lib/plugin-workspace.service";

export type {
  PluginCatalogItem,
  PluginNavConfig,
  SidebarPluginNavItem,
} from "@/features/plugins/types/plugin.types";
