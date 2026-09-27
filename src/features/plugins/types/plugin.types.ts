import type { LucideIcon } from "lucide-react";

export type PluginCategory =
  | "email"
  | "calendar"
  | "messaging"
  | "dev"
  | "crm"
  | "productivity";

export type PluginConnectionStatus =
  | "connected"
  | "needs_connection"
  | "not_installed";

export type PluginNavConfig = {
  title: string;
  href: string;
  icon: LucideIcon;
  showInSidebar: boolean;
  sidebarOrder?: number;
  badge?: number;
};

export type PluginCatalogItem = {
  id: string;
  name: string;
  description: string;
  category: PluginCategory;
  categoryLabel: string;
  accentClass: string;
  categoryDotClass: string;
  icon: LucideIcon;
  iconBgClass: string;
  nav?: PluginNavConfig;
};

export type PluginSettings = {
  enabled: boolean;
  agentAccess: boolean;
};

export type PluginWorkspaceState = {
  installedIds: string[];
  connections: Record<string, PluginConnectionStatus>;
  settings: Record<string, PluginSettings>;
};

export type PluginStats = {
  installed: number;
  connected: number;
  needsConnection: number;
  agentAccess: number;
};

export type SidebarPluginNavItem = PluginNavConfig & {
  pluginId: string;
};
