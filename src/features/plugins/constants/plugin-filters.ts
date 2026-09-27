import type { PluginCategory } from "@/features/plugins/types/plugin.types";

export type PluginFilterCategory = PluginCategory | "all";

export const PLUGIN_FILTER_CATEGORIES: {
  id: PluginFilterCategory;
  label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "email", label: "Email" },
  { id: "calendar", label: "Calendar" },
  { id: "messaging", label: "Messaging" },
  { id: "dev", label: "Dev" },
  { id: "crm", label: "CRM" },
  { id: "productivity", label: "Productivity" },
];
