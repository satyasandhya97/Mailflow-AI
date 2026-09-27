"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { getCatalogPlugin } from "@/features/plugins/plugin-catalog";
import {
  addPluginToState,
  applyServerConnectionStatuses,
  computePluginStats,
  getInstalledPlugins,
  getPluginSettings,
  getSidebarPluginNavItems,
  patchPluginConnectionStatus,
  removePluginFromState,
  updatePluginSettingsInState,
} from "@/features/plugins/lib/plugin-workspace.service";
import { DEFAULT_PLUGIN_WORKSPACE_STATE } from "@/features/plugins/lib/plugin-workspace.defaults";
import {
  loadPluginWorkspaceState,
  savePluginWorkspaceState,
} from "@/features/plugins/lib/plugin-workspace.storage";
import type {
  PluginSettings,
  PluginWorkspaceState,
  SidebarPluginNavItem,
} from "@/features/plugins/types/plugin.types";
import { api } from "@/trpc/react";

type OAuthPluginId = "gmail" | "googlecalendar";

type PluginWorkspaceContextValue = {
  state: PluginWorkspaceState;
  installedPlugins: ReturnType<typeof getInstalledPlugins>;
  stats: ReturnType<typeof computePluginStats>;
  sidebarItems: SidebarPluginNavItem[];
  showLabels: boolean;
  isHydrated: boolean;
  connectingPluginId: string | null;
  addPlugin: (pluginId: string) => void;
  removePlugin: (pluginId: string) => void;
  connectPlugin: (pluginId: string) => Promise<void>;
  refreshConnectionStatus: (
    pluginId?: OAuthPluginId,
  ) => Promise<import("@/features/plugins/types/plugin.types").PluginConnectionStatus | null>;
  updateSettings: (pluginId: string, patch: Partial<PluginSettings>) => void;
  isInstalled: (pluginId: string) => boolean;
};

const PluginWorkspaceContext =
  createContext<PluginWorkspaceContextValue | null>(null);

const OAUTH_PLUGIN_IDS = new Set<string>(["gmail", "googlecalendar"]);

function isOAuthPluginId(pluginId: string): pluginId is OAuthPluginId {
  return OAUTH_PLUGIN_IDS.has(pluginId);
}

export function PluginWorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PluginWorkspaceState>(
    DEFAULT_PLUGIN_WORKSPACE_STATE,
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const [connectingPluginId, setConnectingPluginId] = useState<string | null>(
    null,
  );

  const utils = api.useUtils();

  const statusQuery = api.integrations.getStatus.useQuery(
    { pluginIds: state.installedIds },
    {
      enabled: isHydrated && state.installedIds.length > 0,
      refetchOnWindowFocus: true,
    },
  );

  const startOAuthMutation = api.integrations.startOAuth.useMutation();
  const syncPluginSettingsMutation =
    api.integrations.syncPluginSettings.useMutation();

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setState(loadPluginWorkspaceState());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    savePluginWorkspaceState(state);
  }, [state.installedIds, state.settings, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      const settings = Object.fromEntries(
        state.installedIds.map((pluginId) => [
          pluginId,
          getPluginSettings(state, pluginId),
        ]),
      );

      syncPluginSettingsMutation.mutate({
        installedIds: state.installedIds,
        settings,
      });
    }, 400);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isHydrated, state, syncPluginSettingsMutation.mutate]);

  useEffect(() => {
    if (!statusQuery.data) return;
    setState((current) =>
      applyServerConnectionStatuses(current, statusQuery.data),
    );
  }, [statusQuery.data]);

  const refreshConnectionStatus = useCallback(
    async (pluginId?: OAuthPluginId) => {
      if (pluginId) {
        const status = await utils.integrations.getPluginStatus.fetch({
          pluginId,
        });
        setState((current) =>
          patchPluginConnectionStatus(current, pluginId, status),
        );
        return status;
      }

      await statusQuery.refetch();
      return null;
    },
    [statusQuery, utils.integrations.getPluginStatus],
  );

  const installedPlugins = useMemo(
    () => getInstalledPlugins(state),
    [state],
  );

  const stats = useMemo(() => computePluginStats(state), [state]);

  const sidebarItems = useMemo(
    () => getSidebarPluginNavItems(state),
    [state],
  );

  const showLabels = useMemo(
    () =>
      state.installedIds.includes("gmail") &&
      state.connections.gmail === "connected" &&
      (state.settings.gmail?.enabled ?? true),
    [state],
  );

  const addPlugin = useCallback((pluginId: string) => {
    const plugin = getCatalogPlugin(pluginId);
    if (!plugin) return;

    setState((current) => {
      if (current.installedIds.includes(pluginId)) return current;
      return addPluginToState(current, pluginId);
    });

    toast.success(`${plugin.name} added to workspace`);
  }, []);

  const removePlugin = useCallback((pluginId: string) => {
    const plugin = getCatalogPlugin(pluginId);
    if (!plugin) return;

    setState((current) => removePluginFromState(current, pluginId));
    toast.success(`${plugin.name} removed`);
  }, []);

  const connectPlugin = useCallback(
    async (pluginId: string) => {
      const plugin = getCatalogPlugin(pluginId);
      if (!plugin) return;

      if (!isOAuthPluginId(pluginId)) {
        toast.info(`${plugin.name} OAuth is coming soon.`);
        return;
      }

      setConnectingPluginId(pluginId);

      try {
        const { url } = await startOAuthMutation.mutateAsync({ pluginId });
        window.location.assign(url);
      } catch (error) {
        console.error("[plugins] OAuth start failed:", error);
        toast.error(`Could not connect ${plugin.name}. Try again.`);
        setConnectingPluginId(null);
      }
    },
    [startOAuthMutation],
  );

  const updateSettings = useCallback(
    (pluginId: string, patch: Partial<PluginSettings>) => {
      setState((current) =>
        updatePluginSettingsInState(current, pluginId, patch),
      );
    },
    [],
  );

  const isInstalled = useCallback(
    (pluginId: string) => state.installedIds.includes(pluginId),
    [state.installedIds],
  );

  const value = useMemo(
    () => ({
      state,
      installedPlugins,
      stats,
      sidebarItems,
      showLabels,
      isHydrated,
      connectingPluginId,
      addPlugin,
      removePlugin,
      connectPlugin,
      refreshConnectionStatus,
      updateSettings,
      isInstalled,
    }),
    [
      state,
      installedPlugins,
      stats,
      sidebarItems,
      showLabels,
      isHydrated,
      connectingPluginId,
      addPlugin,
      removePlugin,
      connectPlugin,
      refreshConnectionStatus,
      updateSettings,
      isInstalled,
    ],
  );

  return (
    <PluginWorkspaceContext.Provider value={value}>
      {children}
    </PluginWorkspaceContext.Provider>
  );
}

export function usePluginWorkspace() {
  const context = useContext(PluginWorkspaceContext);
  if (!context) {
    throw new Error(
      "usePluginWorkspace must be used within PluginWorkspaceProvider",
    );
  }
  return context;
}
