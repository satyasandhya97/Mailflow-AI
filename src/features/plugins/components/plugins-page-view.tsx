"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { getCatalogPlugin } from "@/features/plugins/plugin-catalog";
import { AddPluginSheet } from "@/features/plugins/components/add-plugin-sheet";
import { InstalledPluginGrid } from "@/features/plugins/components/installed-plugin-grid";
import { PluginsFilters } from "@/features/plugins/components/plugins-filters";
import { PluginsTopHeader } from "@/features/plugins/components/plugins-top-header";
import { usePluginWorkspace } from "@/features/plugins/context/plugin-workspace-provider";
import { filterPlugins } from "@/features/plugins/lib/plugin-workspace.service";
import type { PluginFilterCategory } from "@/features/plugins/constants/plugin-filters";

export function PluginsPageView() {
  const { installedPlugins, stats, refreshConnectionStatus } =
    usePluginWorkspace();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PluginFilterCategory>("all");
  const [catalogOpen, setCatalogOpen] = useState(false);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const oauthError = searchParams.get("oauth_error");

    if (connected === "gmail" || connected === "googlecalendar") {
      void (async () => {
        const status = await refreshConnectionStatus(connected);
        const plugin = getCatalogPlugin(connected);
        if (status === "connected") {
          toast.success(
            `${plugin?.name ?? connected} connected successfully.`,
          );
        } else {
          toast.error(
            `${plugin?.name ?? connected} could not stay connected. If Gmail works but Calendar does not, reconnect Calendar after this deploy.`,
          );
        }
        window.history.replaceState({}, "", "/plugins");
      })();
    } else if (oauthError) {
      const message =
        oauthError === "credentials_corrupt"
          ? "Stored Gmail/Calendar credentials were reset. Click Connect again."
          : oauthError === "callback_failed"
            ? "Google connected but the refresh token was not saved. Revoke Mailflow AI in Google Account settings, then connect again."
            : "Google sign-in was cancelled or failed. Try again.";
      toast.error(message);
      window.history.replaceState({}, "", "/plugins");
    }
  }, [searchParams, refreshConnectionStatus]);

  const filteredPlugins = useMemo(
    () => filterPlugins(installedPlugins, { query, category }),
    [installedPlugins, query, category],
  );

  return (
    <>
      <PluginsTopHeader
        stats={stats}
        onAddPlugin={() => setCatalogOpen(true)}
      />

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PluginsFilters
          query={query}
          category={category}
          onQueryChange={setQuery}
          onCategoryChange={setCategory}
        />

        <InstalledPluginGrid plugins={filteredPlugins} />
      </div>

      <AddPluginSheet open={catalogOpen} onOpenChange={setCatalogOpen} />
    </>
  );
}
