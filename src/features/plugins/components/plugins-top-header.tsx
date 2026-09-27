"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { PluginStats } from "@/features/plugins/types/plugin.types";

type PluginsTopHeaderProps = {
  stats: PluginStats;
  onAddPlugin: () => void;
};

export function PluginsTopHeader({ stats, onAddPlugin }: PluginsTopHeaderProps) {
  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-border bg-background">
      <div className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <SidebarTrigger className="-ml-1 md:hidden" />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">Plugins</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {stats.installed} in workspace · {stats.connected} connected ·{" "}
              {stats.needsConnection} need connection · {stats.agentAccess} agent
              access
            </p>
          </div>
        </div>

        <Button
          className="w-full shrink-0 bg-[var(--teal-900)] text-[var(--cream-canvas)] hover:bg-[var(--teal-700)] sm:w-auto"
          onClick={onAddPlugin}
        >
          <Plus />
          Add plugin
        </Button>
      </div>
    </header>
  );
}
