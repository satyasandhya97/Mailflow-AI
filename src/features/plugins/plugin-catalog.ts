import { Calendar, Mail } from "lucide-react";

import type { PluginCatalogItem } from "@/features/plugins/types/plugin.types";

export const SUPPORTED_PLUGIN_IDS = ["gmail", "googlecalendar"] as const;
export type SupportedPluginId = (typeof SUPPORTED_PLUGIN_IDS)[number];

export const PLUGIN_CATALOG: PluginCatalogItem[] = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Search, draft, send and receive emails through Mailflow AI.",
    category: "email",
    categoryLabel: "Email",
    accentClass: "border-t-[var(--cat-marine)]",
    categoryDotClass: "bg-[var(--cat-marine)]",
    iconBgClass: "bg-[var(--cat-marine-tint)] text-[var(--cat-marine)]",
    icon: Mail,
    nav: {
      title: "Gmail",
      href: "/gmail/inbox",
      icon: Mail,
      showInSidebar: true,
      sidebarOrder: 1,
      badge: 3,
    },
  },
  {
    id: "googlecalendar",
    name: "Google Calendar",
    description: "Manage your schedule and send calendar invites.",
    category: "calendar",
    categoryLabel: "Calendar",
    accentClass: "border-t-[var(--cat-gold)]",
    categoryDotClass: "bg-[var(--cat-gold)]",
    iconBgClass: "bg-[var(--cat-gold-tint)] text-[var(--cat-gold)]",
    icon: Calendar,
    nav: {
      title: "Google Calendar",
      href: "/calendar",
      icon: Calendar,
      showInSidebar: true,
      sidebarOrder: 2,
    },
  },
];

export function isSupportedPluginId(id: string): id is SupportedPluginId {
  return (SUPPORTED_PLUGIN_IDS as readonly string[]).includes(id);
}

export function getCatalogPlugin(id: string): PluginCatalogItem | undefined {
  return PLUGIN_CATALOG.find((plugin) => plugin.id === id);
}

export function getCatalogPluginMap(): Map<string, PluginCatalogItem> {
  return new Map(PLUGIN_CATALOG.map((plugin) => [plugin.id, plugin]));
}

/** @deprecated Use PLUGIN_CATALOG — kept for backward compatibility */
export const PLUGIN_REGISTRY = PLUGIN_CATALOG;

export function getPluginById(id: string): PluginCatalogItem | undefined {
  return getCatalogPlugin(id);
}
