"use client";

import { memo } from "react";

import { Button } from "@/components/ui/button";
import { getConnectionStatus } from "@/features/plugins/lib/plugin-workspace.service";
import { usePluginWorkspace } from "@/features/plugins/context/plugin-workspace-provider";
import type { PluginCatalogItem } from "@/features/plugins/types/plugin.types";
import { cn } from "@/lib/utils";

type CatalogPluginRowProps = {
  plugin: PluginCatalogItem;
};

export const CatalogPluginRow = memo(function CatalogPluginRow({
  plugin,
}: CatalogPluginRowProps) {
  const { state, isInstalled, addPlugin, connectPlugin, connectingPluginId } =
    usePluginWorkspace();
  const Icon = plugin.icon;
  const installed = isInstalled(plugin.id);

  const status = installed
    ? getConnectionStatus(state, plugin.id)
    : "not_installed";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background p-3">
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          plugin.iconBgClass,
        )}
      >
        <Icon className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{plugin.name}</p>
          <span
            className={cn("size-2 shrink-0 rounded-full", plugin.categoryDotClass)}
            aria-hidden
          />
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {plugin.description}
        </p>
      </div>

      <CatalogPluginAction
        installed={installed}
        status={status}
        isConnecting={connectingPluginId === plugin.id}
        onAdd={() => addPlugin(plugin.id)}
        onConnect={() => void connectPlugin(plugin.id)}
      />
    </div>
  );
});

function CatalogPluginAction({
  installed,
  status,
  isConnecting,
  onAdd,
  onConnect,
}: {
  installed: boolean;
  status: ReturnType<typeof getConnectionStatus>;
  isConnecting: boolean;
  onAdd: () => void;
  onConnect: () => void;
}) {
  if (!installed) {
    return (
      <Button variant="outline" size="sm" onClick={onAdd}>
        Add
      </Button>
    );
  }

  if (status === "needs_connection") {
    return (
      <Button
        size="sm"
        className="bg-[var(--teal-900)] text-[var(--cream-canvas)] hover:bg-[var(--teal-700)]"
        onClick={onConnect}
        disabled={isConnecting}
      >
        {isConnecting ? "Connecting..." : "Connect"}
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" disabled>
      Added
    </Button>
  );
}
