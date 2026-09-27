"use client";

import { memo } from "react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { PluginCard } from "@/features/plugins/components/plugin-card";
import {
  getConnectionStatus,
  getPluginSettings,
} from "@/features/plugins/lib/plugin-workspace.service";
import { usePluginWorkspace } from "@/features/plugins/context/plugin-workspace-provider";
import type { PluginCatalogItem } from "@/features/plugins/types/plugin.types";
import { Plug } from "lucide-react";

type InstalledPluginGridProps = {
  plugins: PluginCatalogItem[];
};

export function InstalledPluginGrid({ plugins }: InstalledPluginGridProps) {
  const {
    isHydrated,
    state,
    connectingPluginId,
    connectPlugin,
    removePlugin,
    updateSettings,
  } = usePluginWorkspace();

  if (!isHydrated) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className="h-72 rounded-xl" />
        ))}
      </div>
    );
  }

  if (plugins.length === 0) {
    return (
      <Empty className="border border-dashed bg-muted/20 py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Plug />
          </EmptyMedia>
          <EmptyTitle>No plugins match your filters</EmptyTitle>
          <EmptyDescription>
            Try a different search or category, or add a plugin from the
            catalog.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {plugins.map((plugin) => (
        <InstalledPluginCard
          key={plugin.id}
          plugin={plugin}
          status={getConnectionStatus(state, plugin.id)}
          settings={getPluginSettings(state, plugin.id)}
          onConnect={() => void connectPlugin(plugin.id)}
          isConnecting={connectingPluginId === plugin.id}
          onRemove={() => removePlugin(plugin.id)}
          onSettingsChange={(patch) => updateSettings(plugin.id, patch)}
        />
      ))}
    </div>
  );
}

const InstalledPluginCard = memo(function InstalledPluginCard({
  plugin,
  status,
  settings,
  onConnect,
  onRemove,
  onSettingsChange,
  isConnecting,
}: {
  plugin: PluginCatalogItem;
  status: ReturnType<typeof getConnectionStatus>;
  settings: ReturnType<typeof getPluginSettings>;
  onConnect: () => void;
  onRemove: () => void;
  onSettingsChange: (patch: Partial<ReturnType<typeof getPluginSettings>>) => void;
  isConnecting?: boolean;
}) {
  return (
    <PluginCard
      plugin={plugin}
      status={status}
      settings={settings}
      onConnect={onConnect}
      onRemove={onRemove}
      onSettingsChange={onSettingsChange}
      isConnecting={isConnecting}
    />
  );
});
